// script.js — Nova chat + safeFetch + fallback
console.log("Script chargé ✅");

const FLAGS = {
  NOVA_LOCAL_ENABLED: true,        // Mettre false si LM Studio/Ollama éteint
  OPENAI_FALLBACK: true            // Bascule possible si clé fournie ci-dessous
};

// ⚠️ Si vous souhaitez activer le fallback GPT, insérez votre clé ci-dessous (côté client) ou laissez vide.
const OPENAI_API_KEY = ""; // ex: "sk-..."
const OPENAI_MODEL = "gpt-4o-mini"; // modifiable selon votre compte

function setStatusText(targetId, text){
  const el = document.getElementById(targetId);
  if (el) el.textContent = text;
}

async function safeFetch(url, opts={}, retries=1, timeoutMs=8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (err) {
    if (retries > 0) return safeFetch(url, opts, retries - 1, timeoutMs);
    throw err;
  } finally {
    clearTimeout(t);
  }
}

function addLog(role, text){
  const log = document.getElementById('nova-log');
  const div = document.createElement('div');
  div.style.margin = '6px 0';
  div.innerHTML = `<strong style="color:#93c5fd">${role==='user'?'Vous':'Nova'}</strong><div style="white-space:pre-wrap;color:#e5e7eb">${text}</div>`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

async function chatLocal(prompt){
  if (!FLAGS.NOVA_LOCAL_ENABLED) throw new Error('Nova locale désactivée');
  const url = 'http://localhost:1234/v1/chat/completions'; // LM Studio (OpenAI-like)
  const body = {
    model: 'local-model',
    messages: [
      {role:'system', content:'Tu es Nova, assistante IA locale de Yarrow. Aide au code, réponds concrètement et brièvement.'},
      {role:'user', content: prompt}
    ],
    temperature: 0.2
  };
  const res = await safeFetch(url, {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer lm-studio'},
    body: JSON.stringify(body)
  }, 1, 9000);
  const data = await res.json();
  const txt = data?.choices?.[0]?.message?.content?.trim();
  if (!txt) throw new Error('Réponse vide (LM Studio)');
  return txt;
}

async function chatOpenAI(prompt){
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY manquante');
  const res = await safeFetch('https://api.openai.com/v1/chat/completions', {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization':`Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {role:'system', content:'Tu es Nova, assistante IA de Yarrow. Aide au code, réponds clairement et concrètement.'},
        {role:'user', content: prompt}
      ],
      temperature: 0.3
    })
  }, 0, 12000);
  const data = await res.json();
  const txt = data?.choices?.[0]?.message?.content?.trim();
  if (!txt) throw new Error('Réponse vide (OpenAI)');
  return txt;
}

async function handleChatSubmit(e){
  e.preventDefault();
  const input = document.getElementById('nova-input');
  const btn = document.getElementById('nova-send');
  const q = input.value.trim();
  if (!q) return;
  addLog('user', q);
  input.value = ''; btn.disabled = true;
  addLog('assistant', '…');
  try {
    let a;
    try {
      a = await chatLocal(q);
    } catch (locErr) {
      console.warn('[NOVA local] échec', locErr);
      if (FLAGS.OPENAI_FALLBACK) {
        a = await chatOpenAI(q);
      } else {
        throw new Error("Nova locale indisponible. Activez le fallback GPT (ou lancez LM Studio).");
      }
    }
    // remove placeholder
    const log = document.getElementById('nova-log');
    log.lastChild.remove();
    addLog('assistant', a);
  } catch (err) {
    const log = document.getElementById('nova-log');
    log.lastChild.remove();
    addLog('assistant', 'Erreur : ' + (err.message || err.toString()));
    console.error(err);
  } finally {
    const btn2 = document.getElementById('nova-send');
    if (btn2) btn2.disabled = false;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('nova-form');
  if (form) form.addEventListener('submit', handleChatSubmit);
});
