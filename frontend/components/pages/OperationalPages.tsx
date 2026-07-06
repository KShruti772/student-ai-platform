'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Bot, CheckCircle2, Clock3, Cpu, Database, Search, Server, Users, Wifi } from 'lucide-react'
import AgentActivityPanel from '../AgentActivityPanel'
import RealtimeModelMonitor from '../monitor/RealtimeModelMonitor'
import Timeline from '../timeline'
import { useStore } from '../../lib/store'
import * as api from '../../lib/api'

function Heading({ kicker, title, description }: { kicker: string; title: string; description: string }) {
    return <div className="page-heading"><div className="page-kicker">{kicker}</div><h2 className="page-title">{title}</h2><p className="page-description">{description}</p></div>
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Activity }) {
    return <div className="workspace-card p-4"><div className="flex items-center justify-between text-xs text-[var(--muted)]"><span>{label}</span><Icon size={15} /></div><div className="mt-3 text-2xl font-semibold">{value}</div></div>
}

export function AgentsContent() {
    const agents = useStore((state) => state.agents)
    const active = agents.filter((agent) => agent.state === 'active').length
    const avg = agents.length ? Math.round(agents.reduce((sum, agent) => sum + agent.progress, 0) / agents.length) : 0
    return <div className="page-shell"><Heading kicker="Agent fleet" title="Agents" description="Live worker health, assigned tasks, and execution progress from the orchestration backend." /><div className="mb-4 grid gap-3 sm:grid-cols-3"><Stat label="Registered" value={agents.length} icon={Users} /><Stat label="Active now" value={active} icon={Bot} /><Stat label="Average progress" value={`${avg}%`} icon={Activity} /></div><AgentActivityPanel /></div>
}

export function ModelMonitorContent() {
    const connection = useStore((state) => state.connection)
    const metrics = useStore((state) => state.metrics)
    const latest = metrics.at(-1)
    return <div className="page-shell"><Heading kicker="Observability" title="Model monitor" description="Realtime model latency, throughput, queue pressure, GPU, and memory telemetry." /><div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Socket" value={connection.status} icon={Wifi} /><Stat label="Latency" value={latest ? `${Math.round(latest.latencyMs)} ms` : '—'} icon={Clock3} /><Stat label="GPU" value={latest?.gpuPct !== undefined ? `${Math.round(latest.gpuPct)}%` : '—'} icon={Cpu} /><Stat label="Queue" value={latest?.queue ?? '—'} icon={Server} /></div><RealtimeModelMonitor /></div>
}

export function AnalyticsContent() {
    const analytics = useStore((state) => state.analytics)
    const metrics = useStore((state) => state.metrics)
    const agents = useStore((state) => state.agents)
    const nodes = useStore((state) => state.workflowNodes)
    const completion = analytics && analytics.tasksCompleted + analytics.tasksPending > 0 ? Math.round(analytics.tasksCompleted / (analytics.tasksCompleted + analytics.tasksPending) * 100) : 0

    const trend = useMemo(() => {
        const source = metrics.length ? metrics : [
            { tokensPerSecond: 38, latencyMs: 180, queue: 3 },
            { tokensPerSecond: 44, latencyMs: 162, queue: 4 },
            { tokensPerSecond: 51, latencyMs: 151, queue: 3 },
            { tokensPerSecond: 59, latencyMs: 142, queue: 2 },
            { tokensPerSecond: 72, latencyMs: 128, queue: 2 },
            { tokensPerSecond: 67, latencyMs: 135, queue: 3 },
            { tokensPerSecond: 81, latencyMs: 122, queue: 2 },
        ]
        return source.slice(-7).map((point, index) => ({ label: `T${index + 1}`, throughput: 'tokensPerSecond' in point ? point.tokensPerSecond : ('throughput' in point ? point.throughput : 0), latency: point.latencyMs ?? 0, queue: point.queue ?? 0 }))
    }, [metrics])

    const workflowBreakdown = ['running', 'done', 'failed', 'idle'].map((status) => ({ status, count: nodes.filter((node) => (node.data.status ?? 'idle') === status).length }))

    return (
        <div className="page-shell">
            <Heading kicker="Workspace insights" title="Analytics" description="A realtime view of delivery health, orchestration activity, and model performance with animated telemetry." />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Tasks completed" value={analytics?.tasksCompleted ?? '—'} icon={CheckCircle2} /><Stat label="Completion rate" value={`${completion}%`} icon={Activity} /><Stat label="Agents observed" value={agents.length} icon={Users} /><Stat label="Metric samples" value={metrics.length} icon={Database} /></div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-card p-5">
                    <div className="text-sm font-semibold">Realtime throughput</div>
                    <div className="mt-4 h-56 rounded-[1.1rem] border border-[var(--border)] bg-[var(--surface-2)]/60 p-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend}>
                                <defs>
                                    <linearGradient id="throughput" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent-strong)" stopOpacity={0.45} /><stop offset="100%" stopColor="var(--accent-strong)" stopOpacity={0.04} /></linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="throughput" stroke="var(--accent-strong)" fill="url(#throughput)" strokeWidth={2.2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="workspace-card p-5">
                    <div className="text-sm font-semibold">Latency and queue pressure</div>
                    <div className="mt-4 h-56 rounded-[1.1rem] border border-[var(--border)] bg-[var(--surface-2)]/60 p-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend}>
                                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="latency" stroke="#38bdf8" strokeWidth={2.2} dot={false} />
                                <Line type="monotone" dataKey="queue" stroke="#a78bfa" strokeWidth={2.2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="workspace-card p-5"><div className="text-sm font-semibold">Project health</div><div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--surface-2)]"><div className="h-full rounded-full bg-[var(--accent)] transition-[width]" style={{ width: `${completion}%` }} /></div><dl className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-xs text-[var(--muted)]">Code lines</dt><dd className="mt-1 text-xl font-semibold">{analytics?.codeLines ?? '—'}</dd></div><div><dt className="text-xs text-[var(--muted)]">Coverage</dt><dd className="mt-1 text-xl font-semibold">{analytics ? `${analytics.coveragePct}%` : '—'}</dd></div></dl></div>
                <div className="workspace-card p-5"><div className="text-sm font-semibold">Workflow distribution</div><div className="mt-4 h-56 rounded-[1.1rem] border border-[var(--border)] bg-[var(--surface-2)]/60 p-3"><ResponsiveContainer width="100%" height="100%"><BarChart data={workflowBreakdown}><CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} /><XAxis dataKey="status" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} /><Tooltip /><Bar dataKey="count" radius={[8, 8, 0, 0]}>{workflowBreakdown.map((entry, index) => <Cell key={entry.status} fill={index === 1 ? 'var(--accent-strong)' : index === 0 ? '#38bdf8' : index === 2 ? '#fb7185' : '#a78bfa'} />)}</Bar></BarChart></ResponsiveContainer></div></div>
            </div>
        </div>
    )
}

export function TimelineContent() {
    return <div className="page-shell"><Heading kicker="Event stream" title="Timeline" description="Replay persisted session events and follow tokens, workflow changes, and reasoning traces live." /><Timeline sessionId="default" /></div>
}

export function SessionsContent() {
    const [sessionId, setSessionId] = useState('default')
    const [activeId, setActiveId] = useState('default')
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const load = async (id: string) => {
        setLoading(true)
        try { setSession(await api.getSession(id)) } catch { setSession(null) } finally { setLoading(false) }
    }
    useEffect(() => { load(activeId) }, [activeId])
    const messages = Array.isArray(session?.messages) ? session.messages : []
    const events = Array.isArray(session?.events) ? session.events : []
    return (
        <div className="page-shell">
            <Heading kicker="Session memory" title="Sessions" description="Open a persisted session by ID, inspect its messages, and replay its realtime event history." />
            <form onSubmit={(event) => { event.preventDefault(); if (sessionId.trim()) setActiveId(sessionId.trim()) }} className="mb-4 flex max-w-lg gap-2"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-3.5 text-[var(--muted)]" /><input value={sessionId} onChange={(event) => setSessionId(event.target.value)} className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm outline-none focus:border-[var(--accent-strong)]" placeholder="Session ID" /></div><button className="rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-white">Open</button></form>
            <div className="mb-4 grid gap-3 sm:grid-cols-3"><Stat label="Session" value={activeId} icon={Clock3} /><Stat label="Messages" value={loading ? '…' : messages.length} icon={Bot} /><Stat label="Events" value={loading ? '…' : events.length} icon={Activity} /></div>
            <Timeline sessionId={activeId} />
        </div>
    )
}
