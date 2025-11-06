from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
import os

# ***************************************************************
# 1. CONFIGURATION DES CLÉS (CRITIQUE : LA CLÉ DOIT ÊTRE ENTRE GUILLEMETS)
# ***************************************************************

# Votre clé API réelle est insérée ici, entre guillemets.
# Si vous changez la clé, assurez-vous de garder les guillemets!
OPENAI_API_KEY = "sk-proj-CRPZCZILBEDS-nwr17uzRb3D_ErvmZyiGfl0HKH35jFTolbtrRgzFVOUiVwzIqLCHuAlQKf8T3B1BkF7NCsPPANgHMeyMogxhallQIxMazl2s3uQ223gZDc6c664413yhnn5jsKTAL55vUYDdBbPSHeZd-gA"
SITE_ACCESS_KEY = os.getenv("SITE_ACCESS_KEY", "") # Utilisé si tu veux une sécurité supplémentaire

# Vérification de la clé API
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY manquante. Vérifiez la Ligne 17 de main.py.")

client = OpenAI(api_key=OPENAI_API_KEY)

# ***************************************************************
# 2. INITIALISATION DE FASTAPI ET CORS
# ***************************************************************

app = FastAPI()

# Configuration CORS (nécessaire pour la communication entre novasuite.ca et ton local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Autorise novasuite.ca et le local à appeler l'API
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# ***************************************************************
# 3. SCHÉMAS DE DONNÉES (POUR LA REQUÊTE ET LA RÉPONSE)
# ***************************************************************

class ChatIn(BaseModel):
    message: str
    history: List[Dict[str, str]] = []

class ChatOut(BaseModel):
    reply: str

# ***************************************************************
# 4. ENDPOINTS DE L'API
# ***************************************************************

@app.get("/api/test")
async def test():
    """Un simple endpoint pour vérifier que l'API est en cours d'exécution."""
    return {"status": "ok", "msg": "NovaSuite API responding!"}

@app.post("/chat", response_model=ChatOut)
def chat(body: ChatIn, x_site_key: str = Header(default="")):
    """Endpoint principal pour la conversation avec l'IA."""
   
    # 🚨 DÉSACTIVATION TEMPORAIRE DE LA VÉRIFICATION DE LA CLÉ D'ACCÈS POUR LE TEST FINAL
    # if SITE_ACCESS_KEY and x_site_key != SITE_ACCESS_KEY:
    # raise HTTPException(status_code=401, detail="Unauthorized")
    
    messages = [{"role": "system", "content": "Tu es Nova, un assistant IA local et sécurisé qui fournit des audits de sécurité web. Réponds de manière brève, professionnelle et encourage le client à passer à l'Audit Express."}]
   
    # Ajouter l'historique de la conversation
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
        raise HTTPException(status_code=500, detail="Erreur interne de l'IA (vérifiez votre clé API ou les logs)")

# Fin du fichier main.py