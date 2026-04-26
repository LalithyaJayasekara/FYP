from fastapi import APIRouter, HTTPException

from app.models.guest_chat import GuestChatRequest, GuestChatResponse
from app.services.guest_chat_service import generate_guest_chat_response

router = APIRouter()


@router.post("/guest-chat", response_model=GuestChatResponse)
async def guest_chat(request: GuestChatRequest) -> GuestChatResponse:
    try:
        answer = await generate_guest_chat_response(request.question, request.history)
        return GuestChatResponse(answer=answer)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=500, detail="Guest chat service unavailable.")
