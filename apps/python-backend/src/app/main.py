from fastapi import FastAPI

from app.api import guest_chat
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="CareLink Python backend service for guest chat and screening APIs.",
)
app.include_router(guest_chat.router, prefix="/api/v1", tags=["guest-chat"])


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}
