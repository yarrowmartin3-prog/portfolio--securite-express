console.log("Script chargé ✅");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");
  if (!form || !statusEl) {
    console.warn("Formulaire ou formStatus introuvable");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.textContent = "Envoi…";
    try {
      const endpoint = form.dataset.endpoint;
      const data = new FormData(form);
      const res = await fetch(endpoint, { method: "POST", body: data });
      if (res.ok) {
        statusEl.textContent = "Message envoyé avec succès ✅";
        form.reset();
      } else {
        statusEl.textContent = "Erreur d’envoi 😕";
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Erreur réseau ⚠️";
    }
  });
});