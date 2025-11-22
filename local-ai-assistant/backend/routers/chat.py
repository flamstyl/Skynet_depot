"""
Router pour les endpoints de chat
Gère les conversations avec l'IA via REST et WebSocket
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from typing import List, Dict
import json
import uuid

from models import (
    ChatRequest, ChatResponse, Message, MessageRole,
    SessionDetailResponse
)
from services.llm_service import get_llm_service
from services.memory_service import get_memory_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Envoie un message au chat et reçoit une réponse
    (Mode non-streaming)
    """
    try:
        llm_service = get_llm_service()
        memory_service = get_memory_service()

        # Récupérer le contexte de la session
        session_info = await memory_service.get_session_info(request.session_id)

        # Si la session n'existe pas, la créer
        if not session_info:
            await memory_service.create_session(request.session_id)

        # Ajouter le message utilisateur à l'historique
        await memory_service.add_message(
            session_id=request.session_id,
            role=MessageRole.USER,
            content=request.message
        )

        # Récupérer le contexte récent
        context = await memory_service.get_recent_context(request.session_id)

        # Ajouter le message actuel au contexte si ce n'est pas déjà fait
        context.append({"role": "user", "content": request.message})

        # Générer la réponse de l'IA
        response_text = await llm_service.generate_response(
            messages=context,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=False
        )

        # Sauvegarder la réponse dans l'historique
        await memory_service.add_message(
            session_id=request.session_id,
            role=MessageRole.ASSISTANT,
            content=response_text
        )

        return ChatResponse(
            message=response_text,
            session_id=request.session_id,
            model_used=llm_service.model
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération de la réponse: {str(e)}")


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session(session_id: str):
    """
    Récupère l'historique complet d'une session de chat
    """
    try:
        memory_service = get_memory_service()

        # Vérifier que la session existe
        session_info = await memory_service.get_session_info(session_id)
        if not session_info:
            raise HTTPException(status_code=404, detail="Session non trouvée")

        # Récupérer tous les messages
        messages = await memory_service.get_session_messages(session_id)

        return SessionDetailResponse(
            session_id=session_id,
            created_at=session_info.created_at,
            last_activity=session_info.last_activity,
            messages=messages
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de la session: {str(e)}")


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """
    Supprime une session de chat et son historique
    """
    try:
        memory_service = get_memory_service()

        # Vérifier que la session existe
        session_info = await memory_service.get_session_info(session_id)
        if not session_info:
            raise HTTPException(status_code=404, detail="Session non trouvée")

        await memory_service.delete_session(session_id)

        return {"status": "success", "message": f"Session {session_id} supprimée"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")


# WebSocket pour le chat en streaming
@router.websocket("/ws/{session_id}")
async def chat_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket pour le chat avec streaming des réponses
    Le client envoie des messages JSON et reçoit les réponses en temps réel
    """
    await websocket.accept()

    try:
        llm_service = get_llm_service()
        memory_service = get_memory_service()

        # Vérifier/créer la session
        session_info = await memory_service.get_session_info(session_id)
        if not session_info:
            await memory_service.create_session(session_id)

        while True:
            # Recevoir un message du client
            data = await websocket.receive_text()
            message_data = json.loads(data)

            user_message = message_data.get("message", "")
            temperature = message_data.get("temperature", 0.7)
            max_tokens = message_data.get("max_tokens", 2000)

            if not user_message:
                await websocket.send_json({
                    "type": "error",
                    "message": "Message vide"
                })
                continue

            # Sauvegarder le message utilisateur
            await memory_service.add_message(
                session_id=session_id,
                role=MessageRole.USER,
                content=user_message
            )

            # Récupérer le contexte
            context = await memory_service.get_recent_context(session_id)
            context.append({"role": "user", "content": user_message})

            # Indiquer que l'IA commence à répondre
            await websocket.send_json({
                "type": "start",
                "session_id": session_id
            })

            # Générer la réponse en streaming
            response_text = ""

            try:
                # Pour OpenAI avec streaming
                stream_response = await llm_service.generate_response(
                    messages=context,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True
                )

                # Si c'est un générateur (streaming)
                if hasattr(stream_response, '__aiter__'):
                    async for chunk in stream_response:
                        if hasattr(chunk, 'choices') and len(chunk.choices) > 0:
                            delta = chunk.choices[0].delta
                            if hasattr(delta, 'content') and delta.content:
                                content = delta.content
                                response_text += content

                                # Envoyer le chunk au client
                                await websocket.send_json({
                                    "type": "chunk",
                                    "content": content
                                })
                else:
                    # Mode non-streaming (fallback)
                    response_text = stream_response
                    await websocket.send_json({
                        "type": "chunk",
                        "content": response_text
                    })

            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Erreur de génération: {str(e)}"
                })
                continue

            # Sauvegarder la réponse complète
            await memory_service.add_message(
                session_id=session_id,
                role=MessageRole.ASSISTANT,
                content=response_text
            )

            # Indiquer que la réponse est terminée
            await websocket.send_json({
                "type": "end",
                "session_id": session_id,
                "full_response": response_text
            })

    except WebSocketDisconnect:
        print(f"Client déconnecté de la session {session_id}")
    except Exception as e:
        print(f"Erreur WebSocket: {str(e)}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass
