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
# Retrait du RuntimeError pour ne pas faire planter l'application au démarrage sur Render
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# 🛡️ LIRE LA CLÉ D'ACCÈS DU SITE DE L'ENVIRONNEMENT RENDER
SITE_ACCESS_KEY = os.getenv("SITE_ACCESS_KEY", "") 

# *Note : La vérification de la clé sera faite plus bas.*

# Initialisation du client OpenAI
client = OpenAI(api_key=OPENAI_API_KEY)

# ***************************************************************
# 2. INITIALISATION DE FASTAPI ET CORS
# ***************************************************************

app = FastAPI(title="NovaSuite AI API")

# Configuration CORS (Autorise l'accès depuis novasuite.ca)
app.add_middleware(
    CORSMiddleware,
    # Utilisez ["*"] tant que novasuite.ca n'est pas votre domaine final
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# ***************************************************************
# 3. SCHÉMAS DE DONNÉES
# ***************************************************************

class ChatIn(BaseModel):
    message: str
    history: List[Dict[str, str]] = []

class ChatOut(BaseModel):
    reply: str

# ***************************************************************
# 4. ENDPOINTS DE L'API
# ***************************************************************

# ✅ Route de base pour éviter le plantage interne et vérifier l'état
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
    
    # Vérification que la clé OpenAI est présente avant l'appel
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
    messages.append({"role": "user", "content": body.message})

    try:
        # Appel à l'API OpenAI
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )
       
        reply = completion.choices[0].message.content.strip()
        return ChatOut(reply=reply)
   
    except Exception as e:
        logger.exception(f"Erreur fatale lors de l'appel OpenAI: {e}")
        # L'erreur 500 est renvoyée si la clé est invalide ou le compte facturé
        raise HTTPException(status_code=500, detail="Erreur interne de l'IA. Vérifiez l'état de votre clé OpenAI sur Render.")
