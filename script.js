document.addEventListener("DOMContentLoaded", () => {
  console.log("Script chargé ✅");

  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Formulaire envoyé !");
    });
  }
});