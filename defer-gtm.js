/* SCRIPT GTM/GA EN DIFFÉRÉ */
function loadGTM() {
  // S'assure que le code n'est injecté qu'une seule fois
  if (window.gtmLoaded) return;
  window.gtmLoaded = true;

  // 1. GTM NOSCRIPT (pour les navigateurs sans JS - peu courant)
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TH9TZKR4" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
  document.body.prepend(noscript);

  // 2. GTM SCRIPT
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-TH9TZKR4');

  // Si le bandeau de consentement n'est pas affiché, force l'application de l'état "denied"
  if (localStorage.getItem('analytics_consent') === null) {
      window.dataLayer.push({
          'event': 'cookie_consent_update',
          'analytics_storage': 'denied'
      });
  }
}

// Déclencheurs : Interaction utilisateur OU après un court délai (3 secondes)
const events = ['mousemove', 'touchstart', 'scroll', 'keydown'];

// Fonction pour retirer les écouteurs d'événements
function removeListeners() {
    events.forEach(event => {
        document.removeEventListener(event, loadGTM, { once: true });
    });
}

// Charge GTM/GA au premier événement utilisateur ou après délai
events.forEach(event => {
    document.addEventListener(event, loadGTM, { once: true });
});

// Sécurité : Retirer les écouteurs après le chargement pour éviter le double chargement.
document.addEventListener('DOMContentLoaded', () => {
    // Charge après 3 secondes au maximum (pour les utilisateurs inactifs)
    setTimeout(() => {
        loadGTM();
        removeListeners();
    }, 3000);
});

