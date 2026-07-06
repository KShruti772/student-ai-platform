'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../lib/api'
import { websocketUrl } from '../lib/endpoints'
import { useStore } from '../lib/store'
import RealtimeManager from '../services/realtime'

const EVENT_BATCH_MS = 120

export function useRealtime(sessionId = 'default') {
    const applyRealtimeEvent = useStore(s => s.applyRealtimeEvent)
    const setConnection = useStore(s => s.setConnection)
    const setAgents = useStore(s => s.setAgents)
    const setWorkflow = useStore(s => s.setWorkflow)
    const setMetrics = useStore(s => s.setMetrics)
    const setAnalytics = useStore(s => s.setAnalytics)
    const queueRef = useRef<any[]>([])
    const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [booting, setBooting] = useState(true)

    const flush = useCallback(() => {
        const events = queueRef.current.splice(0)
        flushTimerRef.current = null
        for (const event of events) applyRealtimeEvent(event)
    }, [applyRealtimeEvent])

    const enqueue = useCallback((event: any) => {
        queueRef.current.push(event)
        if (!flushTimerRef.current) {
            flushTimerRef.current = setTimeout(flush, EVENT_BATCH_MS)
        }
    }, [flush])

    const wsUrl = useMemo(() => websocketUrl('/ws/events'), [])
    useEffect(() => {
        const sub = RealtimeManager.subscribe(wsUrl, { onMessage: enqueue, onStatus: (s: any) => setConnection(s) })
        return () => sub.unsubscribe()
    }, [wsUrl, enqueue, setConnection])

    useEffect(() => {
        let mounted = true
        async function seed() {
            setBooting(true)
            const [agents, workflow, metrics, analytics] = await Promise.allSettled([
                api.getAgentActivity(),
                api.getWorkflow(),
                api.getModelMetrics(),
                api.getProjectAnalytics(),
            ])

            if (!mounted) return
            if (agents.status === 'fulfilled') setAgents(Array.isArray(agents.value) ? agents.value : [])
            if (workflow.status === 'fulfilled') setWorkflow(workflow.value.nodes || [], workflow.value.edges || [])
            if (metrics.status === 'fulfilled') setMetrics(Array.isArray(metrics.value) ? metrics.value : [])
            if (analytics.status === 'fulfilled') setAnalytics(analytics.value)
            setBooting(false)
        }

        seed()
        return () => {
            mounted = false
            if (flushTimerRef.current) clearTimeout(flushTimerRef.current)
        }
    }, [sessionId, setAgents, setAnalytics, setMetrics, setWorkflow])

    return { send: (payload: unknown) => RealtimeManager.send(wsUrl, payload), booting }
}
