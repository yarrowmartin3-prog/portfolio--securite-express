document.addEventListener('DOMContentLoaded', () => {
    // 1. Définir l'URL de votre futur serveur d'API.
    // REMPLACER cette URL par l'adresse réelle de votre serveur (ex: 'https://api.novasuite.ca/chat')
    const API_URL = 'VOTRE_URL_API_ICI'; 

    const chatFab = document.getElementById('nova-fab'); // Le bouton flottant
    const chatBox = document.getElementById('nova-box'); // La fenêtre de chat
    const chatInput = document.getElementById('chat-input'); // Le champ de texte
    const chatSendBtn = document.getElementById('chat-send-btn'); // Le bouton d'envoi
    const chatMessages = document.getElementById('chat-messages'); // Le conteneur des messages

    // --- A. Gérer l'affichage et la fermeture du chat ---
    if (chatFab && chatBox) {
        chatFab.addEventListener('click', () => {
            // Basculer l'état 'hidden' de la boîte de chat
            chatBox.hidden = !chatBox.hidden;
            if (!chatBox.hidden) {
                chatInput.focus();
            }
        });
    }

    // --- B. Gérer l'envoi de message ---
    const sendMessage = async () => {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // 1. Vider le champ et désactiver l'envoi
        chatInput.value = '';
        chatInput.disabled = true;
        chatSendBtn.disabled = true;

        // 2. Afficher le message de l'utilisateur
        appendMessage('user', message);
        
        // 3. Afficher le message de chargement de Nova
        const thinkingIndicator = appendMessage('nova', '... Nova écrit ...', true);

        try {
            // 4. Envoyer le message à l'API de votre serveur
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.statusText}`);
            }

            const data = await response.json();
            
            // 5. Mettre à jour le message de Nova avec la réponse finale
            updateMessage(thinkingIndicator, data.response || "Désolé, une erreur est survenue.");

        } catch (error) {
            console.error('Erreur lors de la communication avec Nova:', error);
            updateMessage(thinkingIndicator, "Erreur de connexion. Veuillez réessayer plus tard.");
        } finally {
            // 6. Rétablir le chat
            chatInput.disabled = false;
            chatSendBtn.disabled = false;
            chatInput.focus();
        }
    };
    
    // Écouteur pour le bouton d'envoi
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', sendMessage);
    }
    
    // Écouteur pour la touche Entrée dans le champ de texte
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Empêche le saut de ligne par défaut
                sendMessage();
            }
        });
    }
    
    // Fonctions utilitaires
    function appendMessage(sender, text, isThinking = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.textContent = text;
        
        if (isThinking) {
            messageDiv.id = 'nova-thinking-indicator';
        }
        
        chatMessages.appendChild(messageDiv);
        // Défiler vers le bas
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageDiv;
    }

    function updateMessage(element, newText) {
        if (element) {
            element.textContent = newText;
            element.removeAttribute('id'); // Retirer l'ID de l'indicateur
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
});
