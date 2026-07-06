export type AgentState = 'idle' | 'active' | 'completed' | 'error'
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'stale' | 'offline'

export interface AgentActivity {
    id: string
    name: string
    state: AgentState
    task?: string
    progress: number
    updatedAt: string
}

export interface WorkflowNode {
    id: string
    type?: string
    label?: string
    data: { label: string; status?: 'idle' | 'pending' | 'running' | 'done' | 'completed' | 'failed' | 'retrying' }
    position: { x: number; y: number }
}

export type ChatMessage = {
    id: number
    role: 'user' | 'assistant'
    content: string
    pending?: boolean
    error?: boolean
    progress?: number
}

export interface WorkflowEdge {
    id: string
    source: string
    target: string
    animated?: boolean
}

export interface MentorResponse {
    simple?: string
    technical?: string
    why?: string
    analogy?: string
    best_practices?: string[]
    common_mistakes?: string[]
    learning_points?: string[]
    raw?: unknown
}

export interface ModelMetricPoint {
    ts: number
    latencyMs: number
    latency?: number
    latency_ms?: number
    throughput: number
    tokens_per_sec?: number
    memMb: number
    mem_mb?: number
    memory_mb?: number
    tokensPerSecond?: number
    gpuPct?: number
    gpu_pct?: number
    memoryPct?: number
    memory_pct?: number
    queue?: number
    queue_size?: number
    requestsPerSecond?: number
    requests_per_sec?: number
    reqs_per_sec?: number
    model?: string
    model_name?: string
}

// Realtime websocket payloads
export type RealtimeEventType =
    | 'heartbeat'
    | 'node.started'
    | 'node.completed'
    | 'node.failed'
    | 'workflow.progress'
    | 'workflow_progress'
    | 'workflow_log'
    | 'workflow_complete'
    | 'workflow_failed'
    | 'agent_status'
    | 'chat.token'
    | 'token_stream'
    | 'session'
    | 'model.metrics'
    | 'agent.updated'
    | 'log'

export interface RealtimeBase {
    type: RealtimeEventType
    ts?: number
}

export interface HeartbeatEvent extends RealtimeBase {
    type: 'heartbeat'
    status: 'connected' | 'disconnected'
}

export interface SessionEvent extends RealtimeBase {
    type: 'session'
    session: string
    status?: string
}

export interface NodeEvent extends RealtimeBase {
    type: 'node.started' | 'node.completed'
    node?: string
    status?: 'running' | 'done' | 'failed'
}

export type RealtimePayload = HeartbeatEvent | SessionEvent | NodeEvent | any

export interface ProjectAnalytics {
    tasksCompleted: number
    tasksPending: number
    codeLines: number
    coveragePct: number
}

export interface RealtimeLogEvent {
    id: string
    ts: number
    source: string
    severity: 'debug' | 'info' | 'warn' | 'error'
    message: string
    group?: string
}

export interface ConnectionSnapshot {
    status: ConnectionStatus
    attempts: number
    lastHeartbeat?: number
    latencyMs?: number
    url?: string
}
