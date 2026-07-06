'use client'

import React, { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, CircleDot, Loader2, TerminalSquare } from 'lucide-react'
import { useAgentActivity } from '../lib/hooks'
import { useStore } from '../lib/store'
import type { AgentActivity, RealtimeLogEvent } from '../lib/types'

type PanelAgent = Partial<AgentActivity> & {
    status?: unknown
}

const stateTone = {
    active: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-500 dark:text-cyan-200',
    completed: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-600 dark:text-emerald-200',
    idle: 'border-border bg-secondary text-muted-foreground',
    error: 'border-rose-400/25 bg-rose-400/10 text-rose-600 dark:text-rose-200',
}

function normalizeAgent(agent: PanelAgent, index: number): AgentActivity {
    const rawStatus = String(agent.state || agent.status || 'idle')
    const state = rawStatus === 'completed' || rawStatus === 'done'
        ? 'completed'
        : rawStatus === 'failed' || rawStatus === 'error'
            ? 'error'
            : rawStatus === 'running' || rawStatus === 'active'
                ? 'active'
                : 'idle'
    return {
        id: String(agent.id || agent.name || `agent-${index}`),
        name: String(agent.name || 'Agent'),
        state,
        task: String(agent.task || 'Waiting for workflow work'),
        progress: Number(agent.progress || 0),
        updatedAt: String(agent.updatedAt || new Date().toISOString()),
    }
}

export default function AgentActivityPanel({
    agents: providedAgents,
    logs: providedLogs,
    title = 'Agent Activity',
    subtitle = 'Live agents, tasks, and workflow events',
    realtime = true,
}: {
    agents?: PanelAgent[]
    logs?: RealtimeLogEvent[]
    title?: string
    subtitle?: string
    realtime?: boolean
}) {
    const { data: fetchedAgents, loading } = useAgentActivity()
    const storeLogs = useStore(s => s.logs)
    const agents = useMemo(() => {
        const source = (providedAgents ?? fetchedAgents ?? []) as PanelAgent[]
        return source.map(normalizeAgent)
    }, [providedAgents, fetchedAgents])
    const recentLogs = useMemo(() => (providedLogs ?? storeLogs).slice(0, 8), [providedLogs, storeLogs])

    return (
        <aside className="flex h-full min-h-[520px] flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-foreground shadow-xl shadow-black/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="font-semibold text-foreground">{title}</div>
                    <div className="text-xs text-muted-foreground">{subtitle}</div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-600 dark:text-emerald-200">
                    <CircleDot size={12} className="animate-pulse" />
                    {realtime ? 'Live' : 'Standard'}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto space-y-3 pr-1">
                {loading && !providedAgents && (
                    <div className="space-y-3">
                        {[0, 1, 2].map(item => <div key={item} className="h-24 animate-pulse rounded-2xl bg-secondary" />)}
                    </div>
                )}
                <AnimatePresence initial={false}>
                    {agents?.map((agent, index) => (
                        <motion.div key={agent.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ delay: index * 0.03 }} className="rounded-2xl border border-border bg-secondary/70 p-3">
                            <div className="flex justify-between gap-3">
                                <div>
                                    <div className="font-medium text-foreground">{agent.name}</div>
                                    <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{agent.task || 'Waiting for workflow work'}</div>
                                </div>
                                <div className={`h-fit rounded-full border px-2 py-1 text-xs ${stateTone[agent.state] || stateTone.idle}`}>{agent.state}</div>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
                                <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400" animate={{ width: `${agent.progress}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                <span>{agent.progress}% complete</span>
                                <span>{new Date(agent.updatedAt).toLocaleTimeString()}</span>
                            </div>
                            {agent.state === 'active' && (
                                <div className="mt-3 flex items-center gap-1 text-xs text-cyan-500 dark:text-cyan-200">
                                    <Loader2 size={12} className="animate-spin" />
                                    Working on this step
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
                {!loading && !agents?.length && (
                    <div className="rounded-2xl border border-dashed border-border bg-secondary/50 p-6 text-center">
                        <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                        <div className="font-medium text-foreground">No active agents</div>
                        <div className="mt-1 text-sm text-muted-foreground">Agents will appear here when a workflow starts.</div>
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-border bg-secondary/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    <TerminalSquare size={14} />
                    Recent activity
                </div>
                <div className="max-h-48 space-y-3 overflow-hidden">
                    {recentLogs.map(log => (
                        <div key={log.id} className="grid grid-cols-[auto_1fr] gap-2 text-xs">
                            {log.severity === 'error' ? <AlertTriangle size={13} className="mt-0.5 text-rose-500" /> : <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                            <div>
                                <span className="text-muted-foreground">{log.source}</span>
                                <span className="text-foreground"> {log.message}</span>
                            </div>
                        </div>
                    ))}
                    {!recentLogs.length && <div className="text-xs text-muted-foreground">Workflow logs will appear here.</div>}
                </div>
            </div>
        </aside>
    )
}
