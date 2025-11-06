from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
import os

# ***************************************************************
# 1. CONFIGURATION DES CLÉS (CRITIQUE : UTILISER os.getenv)
# ***************************************************************

# 🛡️ LIRE LA CLÉ D'OPENAI DE L'ENVIRONNEMENT RENDER (OBLIGATOIRE POUR LA SÉCURITÉ)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# 🛡️ LIRE LA CLÉ D'ACCÈS DU SITE DE L'ENVIRONNEMENT RENDER (POUR L'AUTH DE novasuite.ca)
SITE_ACCESS_KEY = os.getenv("SITE_ACCESS_KEY", "") 

# Vérification des clés
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY manquante. Définissez la variable d'environnement sur Render.")
# NOTE: Nous permettons à SITE_ACCESS_KEY d'être vide pour le développement, mais la vérification ci-dessous la rend obligatoire.

client = OpenAI(api_key=OPENAI_API_KEY)

# ***************************************************************
# 2. INITIALISATION DE FASTAPI ET CORS
# ***************************************************************

app = FastAPI()

# Configuration CORS (Autorise novasuite.ca à appeler l'API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Autorise toute origine pour la flexibilité (idéalement, listez seulement novasuite.ca)
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

# 🐛 CORRECTION DU BUG 500 : Route de base pour éviter l'erreur.
@app.get("/")
def read_root():
    """Route simple pour vérifier l'état du service."""
    return {"status": "ok", "msg": "NovaSuite API est en ligne !"}

@app.get("/api/test")
async def test():
    """Un simple endpoint pour vérifier que l'API est en cours d'exécution."""
    return {"status": "ok", "msg": "NovaSuite API responding!"}

@app.post("/chat", response_model=ChatOut)
def chat(body: ChatIn, x_site_key: str = Header(default="")):
    """Endpoint principal pour la conversation avec l'IA."""
   
    # 🛡️ VÉRIFICATION DE LA CLÉ D'ACCÈS DU SITE (X-Site-Key)
    if SITE_ACCESS_KEY and x_site_key != SITE_ACCESS_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized: Clé d'accès du site invalide.")
   
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
        print(f"Erreur OpenAI: {e}")
        # L'erreur 500 indique souvent une erreur côté OpenAI (ex: clé facturation expirée)
        raise HTTPException(status_code=500, detail="Erreur interne de l'IA (vérifiez les logs de Render et l'état de votre compte OpenAI).")