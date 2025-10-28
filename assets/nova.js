// Scroll doux vers #audit
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href="#audit"]');
  if (!link) return;
  e.preventDefault();
  const target = document.getElementById('audit');
  if (target) target.scrollIntoView({ behavior: 'smooth' });
});

// Chat minimal
const fab = document.getElementById('nova-fab');
const box = document.getElementById('nova-box');
const form = document.getElementById('nova-form');
const log = document.getElementById('nova-log');
const field = document.getElementById('nova-field');

if (fab && box) {
  fab.addEventListener('click', () => {
    const closed = box.hasAttribute('hidden');
    if (closed) {
      box.removeAttribute('hidden');
      fab.setAttribute('aria-expanded','true');
    } else {
      box.setAttribute('hidden','');
      fab.setAttribute('aria-expanded','false');
    }
  });
}

if (form && log && field) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = (field.value || '').trim();
    if (!text) return;

    const me = document.createElement('div');
    me.textContent = "Vous: " + text;
    log.appendChild(me);

    field.value = '';

    const bot = document.createElement('div');
    bot.textContent = "Nova: (module local non connecté pour l’instant)";
    log.appendChild(bot);

    log.scrollTop = log.scrollHeight;
  });
}
