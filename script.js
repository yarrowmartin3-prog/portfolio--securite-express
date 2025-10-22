document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const statusEl = document.getElementById('formStatus');

  if (!form) {
    console.log('Form not found, skipping JS submit.');
    return;
  }

  function setStatus(msg, ok=false){
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.style.color = ok ? '#27ae60' : '#e74c3c';
    } else {
      console.log(msg);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('Envoi…');

    try {
      const data = new FormData(form);
      const endpoint = form.dataset.endpoint || form.action; // fallback action
      const resp = await fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (resp.ok) {
        form.reset();
        setStatus('Message envoyé ✅', true);
      } else {
        setStatus("Erreur d'envoi. Réessayez.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Erreur réseau. Réessayez.");
    }
  });
});