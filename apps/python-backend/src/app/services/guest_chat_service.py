from app.models.guest_chat import GuestChatHistoryEntry


async def generate_guest_chat_response(
    question: str,
    history: list[GuestChatHistoryEntry] | None = None,
) -> str:
    normalized = question.strip().lower()
    if not normalized:
        raise ValueError("Question is required.")

    if "privacy" in normalized or "data" in normalized or "secure" in normalized:
        return (
            "Guest sessions are temporary and designed for preliminary guidance only. "
            "Full records and governance workflows require sign-in."
        )

    if "questionnaire" in normalized or "questions" in normalized:
        return (
            "Use the 0 to 4 scale consistently and answer based on recent work patterns. "
            "Honest responses improve screening quality."
        )

    if "result" in normalized or "score" in normalized:
        return (
            "Guest outputs are preliminary and not diagnostic. After sign-in, "
            "you can continue to fuller workflow features."
        )

    return (
        "Thanks for your question. I can guide you on screening steps, privacy basics, "
        "and what to expect from the questionnaire."
    )
