'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, ChevronRight, List, MessageSquare, Radio, Timer } from 'lucide-react'
import * as api from '../../lib/api'
import { websocketUrl } from '../../lib/endpoints'
import RealtimeManager from '../../services/realtime'

type TimelineEvent = {
    id: string
    ts: number
    type: string
    token?: string
    message?: string
    severity?: string
    source?: string
    trace?: string
}

export default function RealtimeTimeline({ sessionId = 'default' }: { sessionId?: string }) {
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [collapsedTraces, setCollapsedTraces] = useState<Record<string, boolean>>({})

    const [status, setStatus] = useState<string>('connecting')

    useEffect(() => {
        const wsUrl = websocketUrl(`/ws/session/${encodeURIComponent(sessionId)}`)
        const sub = RealtimeManager.subscribe(wsUrl, {
            onMessage: (message: any) => {
                const ts = Number(message.ts || Date.now())
                setEvents(current => [
                    ...current,
                    {
                        id: `${ts}-${Math.random().toString(16).slice(2)}`,
                        ts,
                        type: message.type || 'event',
                        token: message.token || message.delta,
                        message: message.message || message.log,
                        severity: message.severity || message.level || 'info',
                        source: message.source || message.agent || message.node || 'session',
                        trace: message.reasoning || message.trace,
                    },
                ].slice(-240))
            },
            onStatus: (s) => setStatus(s.status)
        })
        return () => sub.unsubscribe()
    }, [sessionId])

    useEffect(() => {
        let mounted = true
        async function load() {
            try {
                const timeline = await api.getSessionTimeline(sessionId)
                if (!mounted) return
                const initial = [
                    ...(timeline.events || []),
                    ...(timeline.messages || []),
                ].map((item: any, index: number) => ({
                    id: String(item.id || item.ts || index),
                    ts: Number(item.ts || Date.now()),
                    type: item.type || item.role || 'event',
                    token: item.token,
                    message: item.content || item.message || item.log,
                    severity: item.severity || 'info',
                    source: item.source || item.role || 'session',
                    trace: item.reasoning || item.trace,
                }))
                setEvents(initial.slice(-240))
            } catch {
                setEvents([])
            }
        }
        load()
        return () => { mounted = false }
    }, [sessionId])

    const streamedText = useMemo(() => events.map(event => event.token || '').join(''), [events])
    const visibleEvents = useMemo(() => events.slice(-80).reverse(), [events])
    const tokensPerSecond = useMemo(() => {
        const tokenEvents = events.filter(event => event.token)
        if (tokenEvents.length < 2) return 0
        const span = (tokenEvents[tokenEvents.length - 1].ts - tokenEvents[0].ts) / 1000
        return span > 0 ? Math.round(tokenEvents.length / span) : 0
    }, [events])

    return (
        <div className="glass-card card-border overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/20 p-5 shadow-soft">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <List size={17} className="text-cyan-200" />
                        Session Timeline
                    </div>
                    <div className="mt-1 text-sm text-zinc-400">Session {sessionId} with grouped live events and reasoning traces</div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="status-pill status-pill--connected flex items-center gap-1 text-cyan-200"><Radio size={12} className={status === 'connected' ? 'animate-pulse' : ''} />{status}</span>
                    <span className="status-pill status-pill--warning flex items-center gap-1 text-zinc-300"><Timer size={12} />{tokensPerSecond} t/s</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-h-[260px] rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
                    <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
                        <MessageSquare size={14} />
                        Token stream
                    </div>
                    <div className="prose prose-invert max-h-[280px] max-w-none overflow-auto text-sm leading-6">
                        {streamedText ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamedText}</ReactMarkdown>
                        ) : (
                            <div className="flex h-40 items-center justify-center text-center text-sm text-zinc-500">
                                Tokens will stream here as the active assistant response is generated.
                            </div>
                        )}
                    </div>
                </div>

                <div className="max-h-[360px] overflow-auto rounded-[1.5rem] border border-white/10 bg-black/20 p-3">
                    <AnimatePresence initial={false}>
                        {visibleEvents.map(event => {
                            const traceCollapsed = collapsedTraces[event.id] ?? true
                            return (
                                <motion.div key={event.id} layout initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="mb-2 rounded-md border border-white/8 bg-white/[0.035] p-3 text-xs">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${event.severity === 'error' ? 'bg-rose-300' : event.type.includes('token') ? 'bg-cyan-300' : 'bg-violet-300'}`} />
                                            <span className="truncate font-medium text-zinc-200">{event.source}</span>
                                        </div>
                                        <span className="shrink-0 text-zinc-600">{new Date(event.ts).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="mt-2 text-zinc-400">{event.message || event.token || event.type}</div>
                                    {event.trace && (
                                        <button className="mt-2 flex items-center gap-1 text-cyan-200" onClick={() => setCollapsedTraces(state => ({ ...state, [event.id]: !traceCollapsed }))}>
                                            {traceCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                            Reasoning trace
                                        </button>
                                    )}
                                    {event.trace && !traceCollapsed && <div className="mt-2 rounded bg-black/30 p-2 text-zinc-400">{event.trace}</div>}
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                    {!visibleEvents.length && <div className="p-6 text-center text-sm text-zinc-500">Waiting for session events.</div>}
                </div>
            </div>
        </div>
    )
}
