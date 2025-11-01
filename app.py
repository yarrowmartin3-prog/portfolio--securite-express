from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# --- Configuration ---
# Remplacez par l'URL de votre instance Nova/LM Studio/Ollama
# EXEMPLE: Si LM Studio tourne sur le port 1234, ce sera http://localhost:1234
NOVA_API_URL = os.getenv("NOVA_API_URL", "http://localhost:1234/v1/chat/completions")
# Remplacez par le nom du modèle que vous utilisez (par ex. "Nous-Hermes-2-Mixtral-8x7B-DPO")
NOVA_MODEL_NAME = os.getenv("NOVA_MODEL_NAME", "your-local-model")
# Votre domaine NovaSuite
FRONTEND_ORIGIN = "https://novasuite.ca" 

app = FastAPI()

# --- Configuration de Sécurité (CORS) ---
# Nécessaire pour que votre site Web (Front-End) puisse communiquer avec ce serveur d'API
origins = [
    FRONTEND_ORIGIN,
    # Ajoutez d'autres domaines si nécessaire
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schéma pour la requête entrante du Front-End
class ChatRequest(BaseModel):
    message: str

# --- Route de Chat ---
@app.post("/api/chat/nova")
async def chat_with_nova(request: ChatRequest):
    try:
        # 1. Préparation de la requête pour l'API Nova (format OpenAI)
        payload = {
            "model": NOVA_MODEL_NAME,
            "messages": [
                {"role": "system", "content": "Vous êtes Nova, un assistant de cybersécurité pour NovaSuite. Vous fournissez des conseils techniques concis et professionnels."},
                {"role": "user", "content": request.message}
            ],
            "temperature": 0.7 
            # Ajoutez d'autres paramètres pour l'API de votre modèle local
        }

        # 2. Appel à l'API locale Nova (LM Studio/Ollama)
        response = requests.post(NOVA_API_URL, json=payload, timeout=60)
        response.raise_for_status() # Lève une exception si le statut n'est pas 200

        # 3. Extraction de la réponse (Adapté au format OpenAI)
        response_data = response.json()
        
        # Le contenu est généralement dans le premier choix (choices[0])
        nova_response = response_data['choices'][0]['message']['content']

        # 4. Retourner la réponse au Front-End
        return {"response": nova_response}

    except requests.exceptions.RequestException as e:
        # Erreur si Nova n'est pas accessible ou ne répond pas
        print(f"Erreur lors de l'appel à l'API Nova: {e}")
        raise HTTPException(status_code=503, detail="Le service Nova est actuellement indisponible.")
    except Exception as e:
        print(f"Erreur inattendue: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur.")
      
