async def get_workflow() -> dict:
    from .workflow_runner import default_graph

    return default_graph()
