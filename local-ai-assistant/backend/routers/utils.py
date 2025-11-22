"""
Router pour les utilitaires (résumé, traduction, génération)
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
import aiohttp
from bs4 import BeautifulSoup

from models import (
    SummaryRequest, SummaryResponse,
    TranslateRequest, TranslateResponse,
    GenerateRequest, GenerateResponse
)
from services.llm_service import get_llm_service
from services.memory_service import get_memory_service

router = APIRouter(prefix="/api/utils", tags=["utils"])


async def fetch_url_content(url: str) -> str:
    """
    Récupère le contenu textuel d'une URL

    Args:
        url: URL à récupérer

    Returns:
        Contenu textuel de la page
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status != 200:
                    raise Exception(f"Erreur HTTP {response.status}")

                html = await response.text()

                # Parser le HTML et extraire le texte
                soup = BeautifulSoup(html, 'html.parser')

                # Retirer les scripts et styles
                for script in soup(["script", "style"]):
                    script.decompose()

                # Récupérer le texte
                text = soup.get_text()

                # Nettoyer le texte
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = ' '.join(chunk for chunk in chunks if chunk)

                return text

    except Exception as e:
        raise Exception(f"Impossible de récupérer l'URL: {str(e)}")


@router.post("/summary", response_model=SummaryResponse)
async def create_summary(request: SummaryRequest):
    """
    Génère un résumé d'un contenu (texte ou URL)
    """
    try:
        llm_service = get_llm_service()
        memory_service = get_memory_service()

        # Déterminer le contenu à résumer
        if request.text:
            content = request.text
        elif request.url:
            # Vérifier d'abord si un résumé existe déjà pour cette URL
            existing_summary = await memory_service.get_page_summary(request.url)
            if existing_summary:
                return SummaryResponse(
                    summary=existing_summary,
                    session_id=request.session_id,
                    original_length=0,  # Pas disponible pour un résumé en cache
                    summary_length=len(existing_summary.split())
                )

            # Récupérer le contenu de l'URL
            content = await fetch_url_content(request.url)
        else:
            raise HTTPException(status_code=400, detail="Vous devez fournir soit 'text' soit 'url'")

        # Générer le résumé
        summary = await llm_service.generate_summary(
            text=content,
            max_length=request.max_length,
            language=request.language
        )

        # Sauvegarder le résumé si c'est une URL
        if request.url:
            await memory_service.save_page_summary(
                url=request.url,
                summary=summary,
                session_id=request.session_id
            )

        return SummaryResponse(
            summary=summary,
            session_id=request.session_id,
            original_length=len(content.split()),
            summary_length=len(summary.split())
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération du résumé: {str(e)}")


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    """
    Traduit un texte dans une langue cible
    """
    try:
        llm_service = get_llm_service()

        # Traduire le texte
        translated = await llm_service.translate_text(
            text=request.text,
            target_language=request.target_language,
            source_language=request.source_language
        )

        # Auto-détection de la langue source si non fournie
        # (l'IA le fait implicitement)
        detected_source = request.source_language or "auto"

        return TranslateResponse(
            translated_text=translated,
            source_language=detected_source,
            target_language=request.target_language,
            session_id=request.session_id
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la traduction: {str(e)}")


@router.post("/generate", response_model=GenerateResponse)
async def generate_content(request: GenerateRequest):
    """
    Génère du contenu selon un template ou un prompt personnalisé
    """
    try:
        llm_service = get_llm_service()

        # Templates prédéfinis
        templates = {
            "email": """Rédige un email professionnel avec les informations suivantes:
Destinataire: {recipient}
Sujet: {subject}
Contexte: {context}
Ton: {tone}

Email:""",
            "post": """Rédige un post pour {platform} sur le sujet suivant:
Sujet: {topic}
Ton: {tone}
Longueur: {length}

Post:""",
            "resume": """Résume les points clés suivants sous forme de liste à puces:
{points}

Résumé structuré:""",
            "reformulate": """Reformule le texte suivant avec un ton {tone}:
{text}

Texte reformulé:"""
        }

        # Choisir le template ou utiliser le prompt personnalisé
        if request.template_id and request.template_id in templates:
            prompt = templates[request.template_id]
            template_used = request.template_id
        elif request.custom_prompt:
            prompt = request.custom_prompt
            template_used = "custom"
        else:
            raise HTTPException(
                status_code=400,
                detail="Vous devez fournir soit 'template_id' soit 'custom_prompt'"
            )

        # Générer le contenu
        generated = await llm_service.generate_from_template(
            template_prompt=prompt,
            context=request.context,
            temperature=request.temperature
        )

        return GenerateResponse(
            generated_content=generated,
            template_used=template_used,
            session_id=request.session_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération: {str(e)}")


@router.get("/templates")
async def list_templates():
    """
    Liste tous les templates de génération disponibles
    """
    templates_info = {
        "email": {
            "name": "Email professionnel",
            "description": "Génère un email professionnel",
            "required_context": ["recipient", "subject", "context", "tone"]
        },
        "post": {
            "name": "Post réseaux sociaux",
            "description": "Génère un post pour les réseaux sociaux",
            "required_context": ["platform", "topic", "tone", "length"]
        },
        "resume": {
            "name": "Résumé structuré",
            "description": "Résume des points en liste à puces",
            "required_context": ["points"]
        },
        "reformulate": {
            "name": "Reformulation",
            "description": "Reformule un texte avec un ton différent",
            "required_context": ["text", "tone"]
        }
    }

    return {"templates": templates_info}
