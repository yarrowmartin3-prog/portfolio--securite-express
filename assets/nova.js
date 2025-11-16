document.addEventListener('DOMContentLoaded', () => {
    const chatFab = document.getElementById('nova-fab'),
        chatBox = document.getElementById('nova-box'),
        chatForm = document.getElementById('nova-form'),
        chatField = document.getElementById('nova-field'),
        chatLog = document.getElementById('nova-log');

    if (!chatFab || !chatBox || !chatForm || !chatField || !chatLog) {
        console.error("Nova Chatbot: Un ou plusieurs éléments HTML (ID) sont manquants.");
        return;
    }

    if (chatBox.style.display !== 'flex') {
        chatBox.style.display = 'none';
    }

    chatFab.addEventListener('click', () => {
        const isHidden = chatBox.style.display === 'none';
        chatBox.style.display = isHidden ? 'flex' : 'none';
        chatFab.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
        if (isHidden) {
            chatField.focus();
        }
    });

    const API_ENDPOINT = 'https://novasuite.onrender.com/chat/';
    let history = [];

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = (chatField.value || '').trim();
        chatField.value = '';

        if (!text) return;

        appendMessage('user', text);

        const loadingMessage = appendMessage('nova', '...', true);

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text,
                    history: history
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const replyText = data.reply;

            history.push({ role: "user", content: text });
            history.push({ role: "assistant", content: replyText });

            loadingMessage.remove();
            appendMessage('nova', replyText);

        } catch (error) {
            console.error('Erreur fatale de l\'API Nova:', error);
            loadingMessage.remove();
            appendMessage('nova', `Désolé, connexion impossible. Vérifiez l'état de l'API Render. Erreur: ${error.message}`);
        }
    });

    function appendMessage(sender, text, isLoading = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', sender);

        if (isLoading) {
             // Utilisation d'un texte simple pour le chargement
             messageDiv.textContent = '...'; 
             messageDiv.style.fontWeight = 'bold'; // Léger ajustement pour le style
        } else {
             messageDiv.textContent = text;
        }

        chatLog.appendChild(messageDiv);
        chatLog.scrollTop = chatLog.scrollHeight;

        return messageDiv;
    }

});

