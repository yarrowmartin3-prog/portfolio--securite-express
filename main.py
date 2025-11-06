from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

# Configuration du logging pour mieux voir les erreurs dans Render
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ***************************************************************
# 1. CONFIGURATION DES CLÉS (CRITIQUE : UTILISER os.getenv)
# ***************************************************************

# 🛡️ LIRE LA CLÉ D'OPENAI DE L'ENVIRONNEMENT RENDER
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# 🛡️ LIRE LA CLÉ D'ACCÈS DU SITE DE L'ENVIRONNEMENT RENDER
SITE_ACCESS_KEY = os.getenv("SITE_ACCESS_KEY", "") 

# Initialisation du client OpenAI
client = OpenAI(api_key=OPENAI_API_KEY)

# ***************************************************************
# 2. INITIALISATION DE FASTAPI ET CORS
# ***************************************************************

app = FastAPI(title="NovaSuite AI API")

# Configuration CORS (Autorise l'accès depuis novasuite.ca)
app.add_middleware(
    CORSMiddleware,
    # Laissez ["*"] pour l'instant pour la compatibilité maximale pendant les tests
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# ***************************************************************
# 3. SCHÉMAS DE DONNÉES (CORRIGÉ)
# ***************************************************************

class ChatIn(BaseModel):
    # CORRECTION CRITIQUE : Renommer 'message' en 'question' 
    # pour correspondre au corps JSON envoyé par nova.js
    question: str
    history: List[Dict[str, str]] = []

class ChatOut(BaseModel):
    # Reste 'reply' pour minimiser les changements côté JS, mais 'response' était aussi possible
    reply: str
    # AJOUT : Renvoyer l'historique pour que le JS puisse le mettre à jour
    history: List[Dict[str, str]]


# ***************************************************************
# 4. ENDPOINTS DE L'API
# ***************************************************************

@app.get("/")
def read_root():
    """Route simple pour vérifier l'état du service."""
    return {"status": "ok", "msg": "NovaSuite API est en ligne !"}

@app.post("/chat", response_model=ChatOut)
def chat(body: ChatIn, x_site_key: str = Header(default="")):
    """Endpoint principal pour la conversation avec l'IA."""
   
    # 🛡️ VÉRIFICATION DE LA CLÉ D'ACCÈS DU SITE (X-Site-Key)
    if SITE_ACCESS_KEY and x_site_key != SITE_ACCESS_KEY:
        logger.warning(f"Tentative d'accès non autorisé avec clé: {x_site_key}")
        raise HTTPException(status_code=401, detail="Unauthorized: Clé d'accès du site invalide.")
    
    if not OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY est manquante ou vide sur Render.")
        raise HTTPException(status_code=500, detail="Erreur de configuration du serveur (Clé OpenAI manquante).")
   
    # Messages de base pour l'IA
    messages = [{"role": "system", "content": "Tu es Nova, un assistant IA local et sécurisé qui fournit des audits de sécurité web. Réponds de manière brève, professionnelle et encourage le client à passer à l'Audit Express."}]
   
    # Intégrer l'historique de la conversation
    for item in body.history:
        if item.get("role") in ["user", "assistant"] and item.get("content"):
            messages.append(item)

    # Ajouter le message actuel de l'utilisateur
    messages.append({"role": "user", "content": body.question}) # UTILISER body.question (CORRIGÉ)

    try:
        # Appel à l'API OpenAI
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )
       
        reply = completion.choices[0].message.content.strip()
        
        # Mettre à jour l'historique AVEC la nouvelle question et la nouvelle réponse
        body.history.append({"role": "user", "content": body.question})
        body.history.append({"role": "assistant", "content": reply})
        
        # Renvoyer la réponse et l'historique mis à jour
        return ChatOut(reply=reply, history=body.history)
   
    except Exception as e:
        logger.exception(f"Erreur fatale lors de l'appel OpenAI: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne de l'IA. Vérifiez l'état de votre clé OpenAI sur Render.")
