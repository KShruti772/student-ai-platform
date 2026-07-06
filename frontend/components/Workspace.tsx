'use client'

import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Bot, Clock3, GitBranch, Radio, RefreshCw, Sparkles, Zap } from 'lucide-react'
import ChatWindow from './chat/ChatWindow'
import AgentActivityPanel from './AgentActivityPanel'
import Card from './ui/Card'
import Timeline from './timeline'
import WorkflowPanel from './workflow/WorkflowPanel'
import RealtimeModelMonitor from './monitor/RealtimeModelMonitor'
import { useRealtime } from '../hooks/useRealtime'
import { useStore } from '../lib/store'

function formatNumber(value: number, suffix = '') {
    if (!Number.isFinite(value)) return `0${suffix}`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k${suffix}`
    return `${Math.round(value)}${suffix}`
}

function MetricTile({
    label,
    value,
    detail,
    icon: Icon,
    tone,
}: {
    label: string
    value: string
    detail: string
    icon: typeof Activity
    tone: string
}) {
    return (
        <Card className="relative min-h-[132px] overflow-hidden">
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${tone}`} />
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
                    <motion.div key={value} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-3xl font-semibold text-white">
                        {value}
                    </motion.div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-2 text-cyan-200">
                    <Icon size={18} />
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
                {detail}
            </div>
        </Card>
    )
}

export default function Workspace() {
    const realtime = useRealtime('default')
    const connection = useStore((s) => s.connection)
    const agents = useStore((s) => s.agents)
    const metrics = useStore((s) => s.metrics)
    const workflowNodes = useStore((s) => s.workflowNodes)
    const logs = useStore((s) => s.logs)
    const latestMetric = metrics[metrics.length - 1]
    const runningNodes = workflowNodes.filter((node) => node.data?.status === 'running').length
    const activeAgents = agents.filter((agent) => agent.state === 'active').length

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {connection.status !== 'connected' && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-5 rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 px-4 py-4 text-sm text-amber-100 shadow-soft">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <RefreshCw size={18} className="animate-spin" />
                                <div>
                                    <div className="font-medium">Realtime sync paused</div>
                                    <div className="text-amber-100/80">Connection is {connection.status}. Updates will resume automatically when the backend reconnects.</div>
                                </div>
                            </div>
                            <div className="rounded-full border border-amber-200/20 bg-black/20 px-3 py-2 text-xs text-amber-200">Auto-reconnect enabled</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
                        <MetricTile label="Active agents" value={formatNumber(activeAgents)} detail={`${agents.length} registered workers`} icon={Bot} tone="from-cyan-300 to-transparent" />
                        <MetricTile label="Workflow live" value={formatNumber(runningNodes)} detail={`${workflowNodes.length} DAG nodes observed`} icon={GitBranch} tone="from-violet-300 to-transparent" />
                        <MetricTile label="Token rate" value={formatNumber(latestMetric?.tokensPerSecond ?? latestMetric?.throughput ?? 0, '/s')} detail="Streaming meter synced" icon={Zap} tone="from-blue-300 to-transparent" />
                        <MetricTile label="Event intake" value={formatNumber(logs.length)} detail={`${connection.status} event bus`} icon={Radio} tone="from-emerald-300 to-transparent" />
                    </div>

                    <div id="workflow-panel">
                        <WorkflowPanel />
                    </div>

                    <div id="model-monitor">
                        <RealtimeModelMonitor />
                    </div>

                    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                        <div id="chat-panel">
                            <ChatWindow />
                        </div>
                        <Timeline sessionId="default" />
                    </div>
                </div>

                <div id="agent-panel" className="space-y-4 xl:sticky xl:top-28 xl:h-[calc(100vh-8rem)]">
                    <Card className="overflow-hidden">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="text-sm font-semibold text-white">System health</div>
                                <div className="text-xs text-zinc-500">Backend connection and infrastructure status</div>
                            </div>
                            <div className="status-pill status-pill--connected text-sm">
                                {realtime.booting ? 'Starting' : connection.status === 'connected' ? 'Live' : connection.status}
                            </div>
                        </div>
                        <div className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                            <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-center">
                                <Sparkles className="mx-auto mb-2 h-5 w-5 text-cyan-200" />
                                <div className="text-2xl font-semibold text-white">{formatNumber(latestMetric?.gpuPct ?? 0, '%')}</div>
                                <div className="mt-1 text-zinc-500">GPU</div>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-center">
                                <Activity className="mx-auto mb-2 h-5 w-5 text-violet-200" />
                                <div className="text-2xl font-semibold text-white">{formatNumber(latestMetric?.memoryPct ?? 0, '%')}</div>
                                <div className="mt-1 text-zinc-500">Memory</div>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-center">
                                <Clock3 className="mx-auto mb-2 h-5 w-5 text-blue-200" />
                                <div className="text-2xl font-semibold text-white">{formatNumber(latestMetric?.queue ?? 0)}</div>
                                <div className="mt-1 text-zinc-500">Queue</div>
                            </div>
                        </div>
                    </Card>
                    <AgentActivityPanel />
                </div>
            </div>
        </div>
    )
}
