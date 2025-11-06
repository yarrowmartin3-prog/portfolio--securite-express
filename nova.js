// nova.js
// 1. Démarrer le script après que le DOM (HTML) soit entièrement chargé
document.addEventListener('DOMContentLoaded', () => {

    // 2. Sélection des éléments du chat
    const chatFab = document.getElementById('nova-fab');
    const chatBox = document.getElementById('nova-box');
    const chatForm = document.getElementById('nova-form');
    const chatField = document.getElementById('nova-field');
    const chatLog = document.getElementById('nova-log');

    // Vérification de sécurité: si un élément manque, arrête l'exécution
    if (!chatFab || !chatBox || !chatForm || !chatField || !chatLog) {
        console.error("Nova Chatbot: Un ou plusieurs éléments HTML (ID) sont manquants (nova-fab, nova-box, nova-form, nova-field, nova-log).");
        return; 
    }

    // 3. Gestion de l'affichage du bouton flottant
    chatBox.style.display = 'none'; // CRITIQUE: Assure que la boîte est cachée au départ

    chatFab.addEventListener('click', () => {
        const isHidden = chatBox.style.display === 'none';
        // Utiliser 'flex' pour le conteneur principal
        chatBox.style.display = isHidden ? 'flex' : 'none'; 
        chatFab.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
        if (isHidden) {
            chatField.focus(); // Met le focus sur le champ de texte
        }
    });

    // ************************************************
    // 4. CONNEXION À L'API et GESTION DE L'HISTORIQUE
    // ************************************************
    
    // CRITIQUE : URL Render correcte (basée sur vos logs)
    const API_ENDPOINT = 'https://novasuite.onrender.com/chat/'; 
    let history = []; 

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page

        const text = (chatField.value || '').trim();
        chatField.value = ''; // Efface le champ immédiatement

        if (!text) return;

        // Affiche le message de l'utilisateur
        appendMessage('user', text);
        
        // Affiche un message de chargement de Nova
        const loadingMessage = appendMessage('nova', '...', true);

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // Laissez X-Site-Key de côté pour ce test, si ce n'est pas nécessaire
                },
                body: JSON.stringify({
                    // CRITIQUE : ENVOIE 'question' pour correspondre au main.py corrigé
                    question: text, 
                    history: history 
                })
            });

            if (!response.ok) {
                // Si l'API retourne une erreur HTTP (401, 422, 500)
                throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // CRITIQUE : Récupère la réponse avec la clé 'reply' (comme défini dans ChatOut)
            const replyText = data.reply; 
            
            // Mise à jour de l'historique
            history = data.history || []; // Récupère l'historique mis à jour par le Python

            // Retire le message de chargement et affiche la réponse
            loadingMessage.remove(); 
            appendMessage('nova', replyText);

        } catch (error) {
            console.error('Erreur fatale de l\'API Nova:', error);
            loadingMessage.remove();
            appendMessage('nova', `Désolé, connexion impossible. Vérifiez l'état de l'API Render (voir console). Erreur: ${error.message}`);
        }
    });

    // Fonction d'affichage des messages
    function appendMessage(sender, text, isLoading = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', sender);
        
        if (isLoading) {
             // Affichage des points de chargement
             messageDiv.innerHTML = '<span class="loading-dot">.</span><span class="loading-dot">.</span><span class="loading-dot">.</span>';
        } else {
             messageDiv.textContent = text;
        }

        chatLog.appendChild(messageDiv);
        
        // Fait défiler jusqu'au bas du log
        chatLog.scrollTop = chatLog.scrollHeight; 
        
        return messageDiv; // Retourne l'élément pour pouvoir le modifier/supprimer
    }

});
