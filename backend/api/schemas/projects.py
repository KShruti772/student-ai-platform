from pydantic import BaseModel


class ProjectAnalytics(BaseModel):
    tasks_completed: int
    tasks_pending: int
    code_lines: int
    coverage: int
