from typing import Optional, Any
from pydantic import BaseModel


class ModelMetricPoint(BaseModel):
    # Timestamps
    ts: Optional[int]

    # Support either 'latency' (legacy) or 'latencyMs' (frontend) fields
    latency: Optional[int]
    latencyMs: Optional[int]

    # common fields
    throughput: Optional[int]
    tokens: Optional[int]

    # additional optional diagnostics
    model: Optional[str]
    memory_mb: Optional[int]
    queue_size: Optional[int]
    requests_per_sec: Optional[int]
    context_usage: Optional[Any]

    class Config:
        # allow population by field name or alias
        allow_population_by_field_name = True
