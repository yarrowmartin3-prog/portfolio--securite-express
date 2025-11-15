// nova.js
// ... (Les sections 1, 2, et 3 restent inchangées) ...

// ************************************************
// 4. CONNEXION À L'API et GESTION DE L'HISTORIQUE
// ************************************************

document.addEventListener('DOMContentLoaded', () => {

    const chatFab = document.getElementById('nova-fab');
    const chatBox = document.getElementById('nova-box');
    const chatForm = document.getElementById('nova-form');
    const chatField = document.getElementById('nova-field');
    const chatLog = document.getElementById('nova-log');
    
    // ... (Gestion de l'affichage du bouton flottant reste inchangée) ...

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
                    // Ajoutez ici votre 'X-Site-Key' si vous l'avez définie sur Render.
                },
                body: JSON.stringify({
                    // ✅ CORRECTION CRITIQUE 422 : Le champ s'appelle maintenant 'message'
                    message: text, 
                    history: history 
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const replyText = data.reply; 
            
            // NOTE : L'historique n'est pas mis à jour par le Python dans ce code. 
            // Nous le mettrons à jour côté JS pour le test.
            history.push({role: "user", content: text});
            history.push({role: "assistant", content: replyText});

            loadingMessage.remove(); 
            appendMessage('nova', replyText);

        } catch (error) {
            console.error('Erreur fatale de l\'API Nova:', error);
            loadingMessage.remove();
            appendMessage('nova', `Désolé, connexion impossible. Vérifiez l'état de l'API Render (voir console). Erreur: ${error.message}`);
        }
    });

    // ... (Fonction appendMessage reste inchangée) ...
});
