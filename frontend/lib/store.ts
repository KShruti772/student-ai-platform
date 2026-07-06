import { create } from 'zustand'
import {
    AgentActivity,
    WorkflowNode,
    WorkflowEdge,
    ModelMetricPoint,
    ProjectAnalytics,
    ChatMessage,
    ConnectionSnapshot,
    RealtimeLogEvent,
} from './types'

type State = {
    agents: AgentActivity[]
    workflowNodes: WorkflowNode[]
    workflowEdges: WorkflowEdge[]
    metrics: ModelMetricPoint[]
    analytics?: ProjectAnalytics | null
    chatMessages: ChatMessage[]
    logs: RealtimeLogEvent[]
    connection: ConnectionSnapshot
    // setters
    setAgents: (a: AgentActivity[]) => void
    upsertAgent: (a: AgentActivity) => void
    setWorkflow: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void
    setMetrics: (m: ModelMetricPoint[]) => void
    addMetric: (m: ModelMetricPoint) => void
    setAnalytics: (p: ProjectAnalytics) => void
    setConnection: (snapshot: Partial<ConnectionSnapshot>) => void
    addLog: (event: RealtimeLogEvent) => void
    addLogs: (events: RealtimeLogEvent[]) => void
    // chat helpers
    setChatMessages: (msgs: ChatMessage[]) => void
    addMessage: (m: ChatMessage) => void
    appendToLastAssistant: (token: string) => void
    setMessageComplete: (id: number, content?: string) => void
    setMessageError: (id: number, err: string) => void
    setMessageContent: (id: number, content: string) => void
    // node helpers
    setNodeStatus: (nodeId: string, status: 'idle' | 'pending' | 'running' | 'done' | 'completed' | 'failed' | 'retrying') => void
    applyRealtimeEvent: (event: any) => void
}

export const useStore = create<State>((set, get) => ({
    agents: [],
    workflowNodes: [],
    workflowEdges: [],
    metrics: [],
    analytics: null,
    chatMessages: [{ id: 1, role: 'assistant', content: 'How can I help you think, build, or learn today?' }],
    logs: [],
    connection: { status: 'connecting', attempts: 0 },
    setAgents: (a) => set({ agents: a }),
    upsertAgent: (agent) => set(state => ({
        agents: [
            agent,
            ...state.agents.filter(item => item.id !== agent.id),
        ].slice(0, 24),
    })),
    setWorkflow: (nodes, edges) => set({ workflowNodes: nodes, workflowEdges: edges }),
    setMetrics: (m) => set({ metrics: m }),
    addMetric: (m) => set(state => ({ metrics: [...state.metrics.slice(-80), m] })),
    setAnalytics: (p) => set({ analytics: p }),
    setConnection: (snapshot) => set(state => ({ connection: { ...state.connection, ...snapshot } })),
    addLog: (event) => set(state => ({ logs: [event, ...state.logs].slice(0, 500) })),
    addLogs: (events) => set(state => ({ logs: [...events.reverse(), ...state.logs].slice(0, 500) })),
    setChatMessages: (msgs) => set({ chatMessages: msgs }),
    addMessage: (m) => set(state => ({ chatMessages: [...state.chatMessages, m] })),
    appendToLastAssistant: (token) => set(state => {
        const msgs = [...state.chatMessages]
        for (let i = msgs.length - 1; i >= 0; i--) {
            const msg = msgs[i]
            if (msg.role === 'assistant' && msg.pending) {
                msgs[i] = { ...msg, content: (msg.content === 'Thinking...' ? '' : msg.content) + token }
                return { chatMessages: msgs }
            }
        }
        return { chatMessages: msgs }
    }),
    setMessageComplete: (id, content) => set(state => ({ chatMessages: state.chatMessages.map(m => m.id === id ? { ...m, pending: false, content: content || m.content } : m) })),
    setMessageError: (id, err) => set(state => ({ chatMessages: state.chatMessages.map(m => m.id === id ? { ...m, pending: false, error: true, content: `Error: ${err}` } : m) })),
    setMessageContent: (id, content) => set(state => ({ chatMessages: state.chatMessages.map(m => m.id === id ? { ...m, content } : m) })),
    setNodeStatus: (nodeId, status) => set(state => ({ workflowNodes: state.workflowNodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status } } : n) })),
    applyRealtimeEvent: (event) => {
        if (!event || typeof event !== 'object') return
        const state = useStore.getState()
        const ts = Number(event.ts || Date.now())
        const type = String(event.type || event.event || '')

        const normalizedStatus = (status: string) => {
            if (status === 'completed') return 'done'
            if (status === 'pending') return 'idle'
            return status
        }

        if (type === 'heartbeat') {
            state.setConnection({ status: 'connected', lastHeartbeat: ts, latencyMs: Math.max(0, Date.now() - ts) })
            return
        }

        if (type === 'chat.token' || type === 'token_stream') {
            state.appendToLastAssistant(String(event.token || event.delta || ''))
        }

        if (type.startsWith('node.')) {
            const status = type === 'node.started' ? 'running' : type === 'node.completed' ? 'done' : 'failed'
            state.setNodeStatus(String(event.node || event.node_id || event.id), status)
        }

        if ((type === 'workflow.progress' || type === 'workflow_progress') && Array.isArray(event.nodes)) {
            state.setWorkflow(event.nodes, Array.isArray(event.edges) ? event.edges : state.workflowEdges)
        }

        if (type === 'model.metrics' || event.metrics) {
            const metrics = event.metrics || event
            state.addMetric({
                ts,
                latencyMs: Number(metrics.latencyMs ?? metrics.latency_ms ?? metrics.latency ?? 0),
                throughput: Number(metrics.throughput ?? metrics.tokens_per_sec ?? metrics.tokensPerSecond ?? 0),
                tokensPerSecond: Number(metrics.tokensPerSecond ?? metrics.tokens_per_sec ?? metrics.throughput ?? 0),
                memMb: Number(metrics.memMb ?? metrics.mem_mb ?? metrics.memory_mb ?? 0),
                gpuPct: Number(metrics.gpuPct ?? metrics.gpu_pct ?? metrics.gpu ?? 0),
                memoryPct: Number(metrics.memoryPct ?? metrics.memory_pct ?? 0),
                queue: Number(metrics.queue ?? metrics.queue_size ?? 0),
                requestsPerSecond: Number(metrics.requestsPerSecond ?? metrics.requests_per_sec ?? metrics.reqs_per_sec ?? 0),
                model: metrics.model || metrics.model_name,
            })
        }

        if (type === 'agent.updated' || type === 'agent_status' || event.agent) {
            const agent = event.agent || event
            const rawState = String(agent.state || agent.status || 'active')
            const mappedState = normalizedStatus(rawState)
            const agentState = mappedState === 'done' ? 'completed' : mappedState === 'failed' ? 'error' : mappedState === 'idle' ? 'idle' : 'active'
            state.upsertAgent({
                id: String(agent.id || agent.name || `agent-${ts}`),
                name: String(agent.name || agent.agent || agent.id || 'Agent'),
                state: agentState,
                task: agent.task || agent.current_task || event.message,
                progress: Number(agent.progress ?? event.progress ?? 0),
                updatedAt: new Date(ts).toISOString(),
            })
        }

        if (type === 'workflow_complete' && event.result) {
            state.addLog({
                id: `${ts}-${Math.random().toString(16).slice(2)}`,
                ts,
                source: 'Workflow',
                severity: 'info',
                message: 'Workflow completed. Final result is ready.',
                group: event.workflow_id,
            })
        }

        if (type === 'log' || type === 'workflow_log' || event.message || event.log) {
            state.addLog({
                id: `${ts}-${Math.random().toString(16).slice(2)}`,
                ts,
                source: String(event.source || event.agent || event.node || 'orchestrator'),
                severity: event.severity || event.level || (type.includes('failed') ? 'error' : 'info'),
                message: String(event.message || event.log || type || 'Realtime event'),
                group: event.group || event.session || event.workflow,
            })
        }
    },
}))
