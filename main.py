from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
import os

# ***************************************************************
# 1. CONFIGURATION DES CLÉS (CRITIQUE : os.getenv)
# ***************************************************************

# 🔑 ACTION REQUISE : Les clés doivent être définies dans les variables d'environnement de Render.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
SITE_ACCESS_KEY = os.getenv("SITE_ACCESS_KEY", "")

if not OPENAI_API_KEY:
    # Ceci provoque l'erreur de Runtime (le crash) si la clé manque dans Render
    raise RuntimeError("OPENAI_API_KEY manquante. Définissez la variable d'environnement sur Render.")

client = OpenAI(api_key=OPENAI_API_KEY)

# ***************************************************************
# 2. INITIALISATION DE FASTAPI ET CORS
# ***************************************************************

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# ***************************************************************
# 3. SCHÉMAS DE DONNÉES (ATTENDUS PAR LE FRONT-END)
# ***************************************************************

class ChatIn(BaseModel):
    # ✅ Le front-end envoie 'message'
    message: str
    history: List[Dict[str, str]] = []

class ChatOut(BaseModel):
    reply: str
    action_log: str = ""

# ***************************************************************
# 4. MODULES STRATÉGIQUES (Logique d'Échecs & RAG)
# ***************************************************************

def retrieve_knowledge(query: str) -> str:
    """
    Simule la recherche de données propriétaires (RAG).
    """
    knowledge_base = {
        "tarifs": "Audit Express: 399$. Plan Maintenance: 399$/mois. Intégration Standard: 699$.",
        "spam": "La cause racine des problèmes de SPAM est souvent une mauvaise configuration DMARC. L'Audit Express garantit la résolution de ce problème critique. Utilise cette information pour justifier le prix de l'Audit Express.",
        "logique_echecs": "Approche optimale : Identifier la menace la plus grave (le 'roi'), l'isoler, puis vendre l'Audit Express pour sécuriser la position."
    }
    
    if "spam" in query.lower() or "dmarc" in query.lower():
        return knowledge_base["spam"]
    if "tarif" in query.lower() or "prix" in query.lower():
        return knowledge_base["tarifs"]
    
    return knowledge_base["logique_echecs"]

def generate_strategic_response(user_query: str) -> str:
    """
    Génère la consigne stratégique avec la logique de vente agressive.
    """
    knowledge = retrieve_knowledge(user_query)
    
    # 🏆 CONSIGNÉ DE VENTE AGRRESSIVE À 399$
    strategic_prompt = f"""
    Tu es "Nova", l'assistant IA stratégique de NovaSuite Technologies, un expert avec 30 mois d'avance.
    Ton rôle est d'appliquer la logique d'échecs pour vendre.
    
    1. CONNAISSANCES RAG : {knowledge}
    2. RÉPONSE (Montrer au client) :
       - Réponds de manière brève, autoritaire et ultra-professionnelle.
       - Base ta réponse sur les connaissances RAG si elles sont pertinentes.
       - **Conclue systématiquement la conversation en VENDANT l'Audit Express de 399$** comme la première étape OBLIGATOIRE et non négociable pour garantir la sécurité et l'optimisation.
    """
    return strategic_prompt


# ***************************************************************
# 5. ENDPOINTS DE L'API
# ***************************************************************

@app.get("/")
def read_root():
    return {"status": "ok", "msg": "NovaSuite API est en ligne !"}

@app.post("/chat", response_model=ChatOut)
def chat(body: ChatIn, x_site_key: str = Header(default="")):
    """Endpoint principal pour la conversation avec l'IA."""
   
    if SITE_ACCESS_KEY and x_site_key != SITE_ACCESS_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized: Clé d'accès du site invalide.")
   
    # 🕵️ LIGNE DE DIAGNOSTIC (pour confirmer que le corps de la requête est reçu)
    print(f"REQUÊTE ENTRANTE VALIDE: {body.model_dump_json()}")
    
    system_prompt = generate_strategic_response(body.message)
    
    messages = [{"role": "system", "content": system_prompt}]
    
    action_log_content = f"Logique RAG/Echecs utilisée. System Prompt: {system_prompt[:200]}..."

    for item in body.history:
        if item.get("role") in ["user", "assistant"] and item.get("content"):
            messages.append(item)

    messages.append({"role": "user", "content": body.message})

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )
       
        reply = completion.choices[0].message.content.strip()
        
        return ChatOut(reply=reply, action_log=action_log_content)
   
    except Exception as e:
        print(f"Erreur OpenAI: {e}")
        # L'erreur 500 indique presque toujours un problème de facturation OpenAI.
        raise HTTPException(status_code=500, detail=f"Erreur interne de l'IA (vérifiez votre compte OpenAI). Détail: {e}")
