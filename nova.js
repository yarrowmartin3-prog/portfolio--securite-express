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
    // NOTE : Nous faisons confiance au CSS pour cacher nova-box, ou au code ci-dessous si le CSS est lent.
    if (chatBox.style.display !== 'flex') {
        chatBox.style.display = 'none';
    }

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
    
    // CRITIQUE : URL Render correcte
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
                    // Ajoutez 'X-Site-Key' ici si nécessaire
                },
                body: JSON.stringify({
                    // ✅ CORRECTION 422 : Envoie "message" (au lieu de "question") pour correspondre à main.py
                    message: text, 
                    history: history 
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const replyText = data.reply; 
            
            // Mise à jour de l'historique côté client
            history.push({role: "user", content: text});
            history.push({role: "assistant", content: replyText});

            // Retire le message de chargement et affiche la réponse
            loadingMessage.remove(); 
            appendMessage('nova', replyText);

        } catch (error) {
            console.error('Erreur fatale de l\'API Nova:', error);
            loadingMessage.remove();
            appendMessage('nova', `Désolé, connexion impossible. Vérifiez l'état de l'API Render. Erreur: ${error.message}`);
        }
    });

    // Fonction d'affichage des messages
    function appendMessage(sender, text, isLoading = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', sender);
        
        if (isLoading) {
             messageDiv.innerHTML = '<span class="loading-dot">.</span><span class="loading-dot">.</span><span class="loading-dot">.</span>';
        } else {
             messageDiv.textContent = text;
        }

        chatLog.appendChild(messageDiv);
        chatLog.scrollTop = chatLog.scrollHeight; 
        
        return messageDiv;
    }

});
