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
        console.error("Nova Chatbot: Un ou plusieurs éléments HTML (ID) sont manquants.");
        return; 
    }

    // 3. Gestion de l'affichage du bouton flottant
    chatBox.style.display = 'none'; // CRITIQUE: Assure que la boîte est cachée au départ

    chatFab.addEventListener('click', () => {
        const isHidden = chatBox.style.display === 'none';
        chatBox.style.display = isHidden ? 'flex' : 'none'; // Affiche en 'flex' si caché, cache si affiché
        chatFab.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });

    // ************************************************
    // 4. CONNEXION À L'API et GESTION DE L'HISTORIQUE
    // ************************************************
    
    // IMPORTANT: Remplacez l'IP local par l'URL Render public pour les tests:
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
                },
                body: JSON.stringify({
                    question: text,
                    history: history 
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            // Mise à jour de l'historique
            history = data.history || [];

            // Retire le message de chargement et affiche la réponse
            loadingMessage.remove(); 
            appendMessage('nova', data.response);

        } catch (error) {
            console.error('Erreur API Nova:', error);
            loadingMessage.remove();
            appendMessage('nova', 'Désolé, une erreur est survenue lors de la connexion à l\'IA. Veuillez vérifier l\'API (voir la console).');
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
        
        // Fait défiler jusqu'au bas du log
        chatLog.scrollTop = chatLog.scrollHeight; 
        
        return messageDiv; // Retourne l'élément pour pouvoir le modifier/supprimer
    }

});
