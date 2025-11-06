Document.addEventListener('DOMContentLoaded', () => {
    
    // ***************************************************************
    // 1. CONFIGURATION ET SÉLECTION DES ÉLÉMENTS (CORRIGÉ)
    // ***************************************************************
    
    // L'URL corrigée de votre API Nova sur Render
    const API_URL = 'https://novasuite.onrender.com/chat'; 

    // Variable pour stocker l'historique des messages (pour le contexte de l'IA)
    let conversationHistory = []; 

    // ATTENTION : Les IDs ci-dessous DOIVENT correspondre aux IDs de votre HTML (div, form, input)
    const chatFab = document.getElementById('nova-fab');     // Le bouton flottant
    const chatBox = document.getElementById('nova-box');     // La fenêtre de chat
    const chatInput = document.getElementById('nova-field'); // Le champ de texte (ID corrigé)
    const chatSendBtn = document.getElementById('nova-send');  // Le bouton d'envoi (ID corrigé)
    const chatMessages = document.getElementById('nova-log');  // Le conteneur des messages (ID corrigé)

    // ***************************************************************
    // 2. GESTION DE L'AFFICHAGE ET FERMETURE DU CHAT (LOGIQUE AJOUTÉE)
    // ***************************************************************
    
    if (chatFab && chatBox && chatInput && chatMessages) {
        chatFab.addEventListener('click', () => {
            
            const isHidden = chatBox.hasAttribute('hidden');

            if (isHidden) {
                // Ouvre le chat
                chatBox.removeAttribute('hidden');
                chatBox.style.display = 'flex'; // Affiche la boîte de chat
                chatFab.setAttribute('aria-expanded', 'true');
                chatInput.focus();
            } else {
                // Ferme le chat
                chatBox.setAttribute('hidden', '');
                chatBox.style.display = 'none'; // Cache la boîte de chat
                chatFab.setAttribute('aria-expanded', 'false');
            }
            
            // Fait défiler le log au bas, quelle que soit l'action
            chatMessages.scrollTop = chatMessages.scrollHeight; 
        });
    }


    // ***************************************************************
    // 3. GESTION DE L'ENVOI DE MESSAGE
    // ***************************************************************
    
    const sendMessage = async () => {
        // La validation du champ se fait sur l'ID corrigé (nova-field)
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
                },
                body: JSON.stringify({ 
                    message: message, 
                    history: conversationHistory 
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.statusText || response.status}. Vérifiez les logs Render.`);
            }

            const data = await response.json();
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
   
    // Écouteurs pour le bouton d'envoi et la touche Entrée (ID corrigés)
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
   
    // ***************************************************************
    // 4. FONCTIONS UTILITAIRES
    // ***************************************************************

    function appendMessage(sender, text, isThinking = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.textContent = text;
       
        if (isThinking) {
            messageDiv.id = 'nova-thinking-indicator';
        }
       
        // Utilise l'ID corrigé (nova-log)
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
