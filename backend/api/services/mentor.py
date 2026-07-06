from .chat import send_chat


async def handle_mentor(message: str, session_id: str = "default") -> dict:
    # delegate to chat model and wrap in mentor-like structure
    result = await send_chat(message, session_id)
    if result.error:
        return {"error": result.error, "debug": result.debug}
    return {"response": result.response}
