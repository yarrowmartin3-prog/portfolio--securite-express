// --- Vérification de chargement du script ---
console.log("Script chargé ✅");

// --- Sécurisation du formulaire de contact ---
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // --- Récupération des données du formulaire ---
    const formData = new FormData(form);
    const status = document.getElementById('formStatus');
    
    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        status.innerHTML = "✅ Message envoyé avec succès ! Réponse sous 24h.";
        form.reset();
      } else {
        status.innerHTML = "⚠️ Une erreur est survenue, veuillez réessayer.";
      }
    } catch (error) {
      status.innerHTML = "❌ Erreur réseau. Vérifiez votre connexion.";
    }
  });
}