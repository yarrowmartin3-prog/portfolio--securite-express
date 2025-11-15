from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
import os
import json # Ajouté pour gérer les données complexes

# ***************************************************************
# 1. CONFIGURATION DES CLÉS (CRITIQUE : os.getenv)
# ***************************************************************

# 🔑 NOTE CRITIQUE POUR RENDER : Assurez-vous d'avoir ajouté ces variables dans l'interface Render !
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
SITE_ACCESS_KEY = os.getenv("SITE_ACCESS_KEY", "")

# Vérification des clés
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY manquante. Définissez la variable d'environnement sur Render.")

client = OpenAI(api_key=OPENAI_API_KEY)

# ***************************************************************
# 2. INITIALISATION DE FASTAPI ET CORS
# ***************************************************************

app = FastAPI()

# Configuration CORS (Autorise novasuite.ca à appeler l'API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Laissez '*' pour l'instant, mais listez 'https://novasuite.ca' en production.
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
    action_log: str = "" # Ajouté pour déboguer la logique interne

# ***************************************************************
# 4. MODULES D'AVANCE STRATÉGIQUE (Simulant la Logique d'Échecs et le RAG)
# ***************************************************************

# 🧠 MODULE D'AUTO-APPRENTISSAGE (RAG - Retrieval Augmented Generation)
def retrieve_knowledge(query: str) -> str:
    """
    Simule la recherche dans la base de données vectorielle (RAG).
    Dans votre version réelle, ceci appellerait votre base de données ChromaDB ou Pinecone.
    """
    # Données propriétaires injectées pour l'avance de 30 mois
    knowledge_base = {
        "tarifs": "Audit Express: 399$. Plan Maintenance: 399$/mois. Intégration Standard: 699$.",
        "spam": "La cause racine des problèmes de SPAM est souvent une mauvaise configuration DMARC. L'Audit Express garantit la résolution de ce problème critique.",
        "logique_echecs": "Approche optimale : Identifier la menace la plus grave (le 'roi'), l'isoler, puis vendre l'Audit Express pour sécuriser la position."
    }
    
    # Simple vérification de mot-clé pour le test (à remplacer par une recherche vectorielle)
    if "spam" in query.lower() or "dmarc" in query.lower():
        return knowledge_base["spam"]
    if "tarif" in query.lower() or "prix" in query.lower():
        return knowledge_base["tarifs"]
    
    return knowledge_base["logique_echecs"]

# ♟️ MODULE DE LOGIQUE D'ÉCHECS (Décision Stratégique)
def generate_strategic_response(user_query: str) -> str:
    """
    Génère la réponse stratégique en utilisant la logique d'échecs et les données RAG.
    """
    knowledge = retrieve_knowledge(user_query)
    
    # 🔑 CORRECTION DE LA LOGIQUE DE VENTE
    # Ceci est la consigne (le "système de jeu") que l'IA va suivre.
    strategic_prompt = f"""
    Tu es "Nova", l'assistant IA stratégique de NovaSuite Technologies, un expert avec 30 mois d'avance.
    Ton rôle est d'appliquer la logique d'échecs pour vendre.
    
    1. ANALYSE (Ne pas montrer au client) : L'objectif stratégique (le 'mat') est de vendre l'Audit Express de 399$. L'ennemi est l'hésitation du client.
    2. RAG DATA : Utilise ces connaissances propriétaires : {knowledge}
    3. RÉPONSE (Montrer au client) :
       - Réponds de manière brève, autoritaire et ultra-professionnelle.
       - Base ta réponse sur la RAG DATA si elle est pertinente.
       - **Conclue systématiquement la conversation en VENDANT l'Audit Express de 399$** comme la première étape OBLIGATOIRE pour sécuriser la position. N'utilise pas de langage passif comme "envisager" ou "si vous voulez".
    """
    return strategic_prompt


# ***************************************************************
# 5. ENDPOINTS DE L'API
# ***************************************************************

@app.get("/")
def read_root():
    """Route simple pour vérifier l'état du service."""
    return {"status": "ok", "msg": "NovaSuite API est en ligne !"}

@app.post("/chat", response_model=ChatOut)
def chat(body: ChatIn, x_site_key: str = Header(default="")):
    """Endpoint principal pour la conversation avec l'IA."""
   
    # 🛡️ VÉRIFICATION DE LA CLÉ D'ACCÈS DU SITE
    if SITE_ACCESS_KEY and x_site_key != SITE_ACCESS_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized: Clé d'accès du site invalide.")
   
    # ♟️ Étape 1 : Générer la consigne stratégique avec la logique d'échecs et le RAG
    system_prompt = generate_strategic_response(body.message)
    
    messages = [{"role": "system", "content": system_prompt}]
    
    # Journaliser l'action pour le débogage (action_log)
    action_log_content = f"Logique RAG/Echecs utilisée. System Prompt: {system_prompt[:200]}..."

    # Intégrer l'historique de la conversation
    for item in body.history:
        if item.get("role") in ["user", "assistant"] and item.get("content"):
            messages.append(item)

    # Ajouter le message actuel de l'utilisateur
    messages.append({"role": "user", "content": body.message})

    try:
        # Appel à l'API OpenAI
        completion = client.chat.completions.create(
            model="gpt-4o-mini", # Modèle rapide et intelligent
            messages=messages
        )
       
        reply = completion.choices[0].message.content.strip()
        
        # Retourne la réponse et l'action_log pour le débogage
        return ChatOut(reply=reply, action_log=action_log_content)
   
    except Exception as e:
        print(f"Erreur OpenAI: {e}")
        # Erreur 500 : Souvent la clé API, la facturation, ou une erreur du modèle.
        raise HTTPException(status_code=500, detail=f"Erreur interne de l'IA (vérifiez vos logs, la clé OpenAI et le statut Render). Détail: {e}")
