document.addEventListener('DOMContentLoaded', () => {
    
    // ***************************************************************
    // 1. CONFIGURATION (CORRIGÉE)
    // ***************************************************************
    
    // L'URL corrigée de votre API Nova sur Render
    const API_URL = 'https://novasuite.onrender.com/chat'; 

    // Variable pour stocker l'historique des messages (pour le contexte de l'IA)
    // Elle doit être initialisée même si elle est vide au début
    let conversationHistory = []; 

    const chatFab = document.getElementById('nova-fab'); // Le bouton flottant
    const chatBox = document.getElementById('nova-box'); // La fenêtre de chat
    const chatInput = document.getElementById('chat-input'); // Le champ de texte
    const chatSendBtn = document.getElementById('chat-send-btn'); // Le bouton d'envoi
    const chatMessages = document.getElementById('chat-messages'); // Le conteneur des messages

    // --- A. Gérer l'affichage et la fermeture du chat ---
    if (chatFab && chatBox) {
        chatFab.addEventListener('click', () => {
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
       
        // 1. Désactiver l'envoi et afficher le message utilisateur
        chatInput.value = '';
        chatInput.disabled = true;
        chatSendBtn.disabled = true;

        // 2. Ajouter le message de l'utilisateur à l'historique et l'afficher
        conversationHistory.push({ "role": "user", "content": message });
        appendMessage('user', message);
       
        // 3. Afficher le message de chargement
        const thinkingIndicator = appendMessage('nova', '... Nova écrit ...', true);

        try {
            // 4. Envoyer le message à l'API de votre serveur
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // **NOTE : 'X-Site-Key' est omis ici car votre SITE_ACCESS_KEY est vide sur Render**
                },
                body: JSON.stringify({ 
                    // ENVOI DU BON FORMAT REQUI PAR VOTRE API PYTHON
                    message: message, 
                    history: conversationHistory 
                }),
            });

            if (!response.ok) {
                // Cette erreur pourrait être le 401 si vous ajoutez SITE_ACCESS_KEY plus tard
                throw new Error(`Erreur API: ${response.statusText || response.status}. Vérifiez les logs Render.`);
            }

            const data = await response.json();
            // L'API renvoie la réponse sous la clé 'reply'
            const novaReply = data.reply || "Désolé, une erreur est survenue dans la réponse de l'IA.";
           
            // 5. Mettre à jour et ajouter la réponse de l'assistant à l'historique
            updateMessage(thinkingIndicator, novaReply);
            conversationHistory.push({ "role": "assistant", "content": novaReply });

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
   
    // Écouteurs pour le bouton d'envoi et la touche Entrée
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', sendMessage);
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                sendMessage();
            }
        });
    }
   
    // Fonctions utilitaires (non modifiées)
    function appendMessage(sender, text, isThinking = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.textContent = text;
       
        if (isThinking) {
            messageDiv.id = 'nova-thinking-indicator';
        }
       
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageDiv;
    }

    function updateMessage(element, newText) {
        if (element) {
            element.textContent = newText;
            element.removeAttribute('id');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
});
