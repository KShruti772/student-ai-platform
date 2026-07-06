import { useEffect, useState } from 'react'
import * as api from './api'
import { websocketUrl } from './endpoints'
import { AgentActivity, WorkflowNode, WorkflowEdge, MentorResponse, ModelMetricPoint, ProjectAnalytics } from './types'
import { useStore } from './store'
import RealtimeManager from '../services/realtime'

const DEFAULT_POLL_MS = 10_000

export function useAgentActivity() {
    const [loading, setLoading] = useState(true)
    const agents = useStore(s => s.agents)
    const setAgents = useStore(s => s.setAgents)

    useEffect(() => {
        let mounted = true

        async function fetchOnce() {
            try {
                const d = await api.getAgentActivity()
                if (!mounted) return
                setAgents(d)
            } catch (err) {
                // swallow; store remains whatever it was
                console.error('getAgentActivity error', err)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        if (!agents.length) fetchOnce()
        else setLoading(false)
        return () => { mounted = false }
    }, [setAgents])

    return { data: agents, loading }
}

export function useWorkflow() {
    const [loading, setLoading] = useState(true)
    const nodes = useStore(s => s.workflowNodes)
    const edges = useStore(s => s.workflowEdges)
    const setWorkflow = useStore(s => s.setWorkflow)

    useEffect(() => {
        let mounted = true

        async function fetchOnce() {
            try {
                const r = await api.getWorkflow()
                if (!mounted) return
                setWorkflow(r.nodes, r.edges)
            } catch (err) {
                console.error('getWorkflow error', err)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        if (!nodes.length) fetchOnce()
        else setLoading(false)
        return () => { mounted = false }
    }, [setWorkflow])

    return { nodes, edges, loading }
}

export function useMentor() {
    async function ask(prompt: string): Promise<MentorResponse | null> {
        try {
            const res = await api.getMentorExplanation(prompt)
            return res
        } catch (err) {
            console.error('mentor ask error', err)
            return null
        }
    }

    return { ask }
}

export function useModelMetrics() {
    const [loading, setLoading] = useState(true)
    const metrics = useStore(s => s.metrics)
    const setMetrics = useStore(s => s.setMetrics)

    useEffect(() => {
        let mounted = true

        async function fetchOnce() {
            try {
                const d = await api.getModelMetrics()
                if (!mounted) return
                setMetrics(d)
            } catch (err) {
                console.error('getModelMetrics error', err)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        if (!metrics.length) fetchOnce()
        else setLoading(false)
        return () => { mounted = false }
    }, [setMetrics])

    return { data: metrics, loading }
}

export function useProjectAnalytics() {
    const [loading, setLoading] = useState(true)
    const analytics = useStore(s => s.analytics)
    const setAnalytics = useStore(s => s.setAnalytics)

    useEffect(() => {
        let mounted = true

        async function fetchOnce() {
            try {
                const d = await api.getProjectAnalytics()
                if (!mounted) return
                setAnalytics(d)
            } catch (err) {
                console.error('getProjectAnalytics error', err)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        if (!analytics) fetchOnce()
        else setLoading(false)
        return () => { mounted = false }
    }, [setAnalytics])

    return { data: analytics, loading }
}

export function useEventBus() {
    // connect to backend websocket and dispatch events into the client app
    useEffect(() => {
        let mounted = true
        const wsUrl = websocketUrl('/ws/events')
        let pollInterval: any = null

        function startPollingFallback() {
            if (pollInterval) return
            console.warn('WebSocket unavailable; starting polling fallback for event bus')
            pollInterval = setInterval(async () => {
                try {
                    if (typeof document !== 'undefined' && document.hidden) return
                    const agents = await api.getAgentActivity()
                    useStore.getState().setAgents(agents)
                    const metrics = await api.getModelMetrics()
                    useStore.getState().setMetrics(metrics)
                } catch (err) {
                    console.debug('Polling fallback error', err)
                }
            }, DEFAULT_POLL_MS * 2)
        }

        function stopPollingFallback() {
            if (pollInterval) {
                clearInterval(pollInterval)
                pollInterval = null
            }
        }

        const sub = RealtimeManager.subscribe(wsUrl, {
            onMessage: (d: any) => {
                try {
                    if (d && d.type === 'heartbeat') return
                    if (d.type && d.type.startsWith('node.')) {
                        const id = d.node
                        const status = d.type === 'node.started' ? 'running' : d.type === 'node.completed' ? 'done' : 'failed'
                        useStore.getState().setNodeStatus(id, status)
                        return
                    }
                    if (d.type === 'chat.token' || d.type === 'token_stream') {
                        useStore.getState().appendToLastAssistant(d.token || '')
                        return
                    }
                    console.debug('EventBus received', d)
                } catch (err) {
                    console.error('Failed to parse event message', err)
                }
            },
            onStatus: (s) => {
                if (!mounted) return
                // update global connection snapshot for UI banners
                useStore.getState().setConnection(s as any)
                if (s.status === 'reconnecting' && (s.attempts || 0) >= 5) startPollingFallback()
                if (s.status === 'connected') stopPollingFallback()
            }
        })

        return () => {
            mounted = false
            stopPollingFallback()
            sub.unsubscribe()
        }
    }, [])
}

export function useSessionEvents(sessionId: string) {
    useEffect(() => {
        if (!sessionId) return
        const wsUrl = websocketUrl(`/ws/session/${encodeURIComponent(sessionId)}`)
        let pollInterval: any = null
        let mounted = true

        async function startPollingTimeline() {
            if (pollInterval) return
            pollInterval = setInterval(async () => {
                try {
                    if (typeof document !== 'undefined' && document.hidden) return
                    const tl = await api.getSessionTimeline(sessionId)
                    console.debug('Polled timeline', tl)
                } catch (err) {
                    console.debug('Polling timeline failed', err)
                }
            }, DEFAULT_POLL_MS * 2)
        }

        function stopPollingTimeline() {
            if (pollInterval) {
                clearInterval(pollInterval)
                pollInterval = null
            }
        }

        const sub = RealtimeManager.subscribe(wsUrl, {
            onMessage: (d: any) => {
                try {
                    if (d.type === 'token_stream' || d.type === 'chat.token') {
                        useStore.getState().appendToLastAssistant(d.token || '')
                    }
                    if (d.type && d.type.startsWith('node.')) {
                        const id = d.node
                        const status = d.type === 'node.started' ? 'running' : d.type === 'node.completed' ? 'done' : 'failed'
                        useStore.getState().setNodeStatus(id, status)
                    }
                } catch (err) {
                    console.error('Failed to parse session event', err)
                }
            },
            onStatus: (s) => {
                if (!mounted) return
                useStore.getState().setConnection(s as any)
                if (s.status === 'reconnecting' && (s.attempts || 0) >= 4) startPollingTimeline()
                if (s.status === 'connected') stopPollingTimeline()
            }
        })

        return () => {
            mounted = false
            stopPollingTimeline()
            sub.unsubscribe()
        }
    }, [sessionId])
}
