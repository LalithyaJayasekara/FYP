from pydantic import BaseModel, Field
from typing import Literal


class GuestChatHistoryEntry(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class GuestChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    history: list[GuestChatHistoryEntry] | None = None


class GuestChatResponse(BaseModel):
    answer: str
