from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
import os

# ***************************************************************
# 1. CONFIGURATION DES CLÉS (CRITIQUE : os.getenv)
# ***************************************************************

# 🔑 ACTION REQUISE : La variable OPENAI_API_KEY DOIT être définie sur Render.com.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
SITE_ACCESS_KEY = os.getenv("SITE_ACCESS_KEY", "")

if not OPENAI_API_KEY:
    # Ceci provoquera une erreur de déploiement si la clé manque
    # 🕵️ LIGNE DE DIAGNOSTIC AJOUTÉE (pour identifier l'erreur terminale)
    # Si le log est propre à ce niveau, l'erreur vient d'un ancien appel ou d'un problème Render.
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
