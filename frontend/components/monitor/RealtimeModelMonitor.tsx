'use client'

import React, { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Cpu, Gauge, HardDrive, Layers, Timer, Zap } from 'lucide-react'
import Card from '../ui/Card'
import { useModelMetrics } from '../../lib/hooks'

function normalizePoint(point: any, index: number) {
    const ts = Number(point?.ts || index * 1000)
    return {
        time: point?.ts ? new Date(ts).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }) : `-${60 - index}s`,
        latency: Number(point?.latencyMs ?? point?.latency_ms ?? point?.latency ?? 0),
        throughput: Number(point?.throughput ?? point?.tokens_per_sec ?? point?.tokensPerSecond ?? 0),
        tokens: Number(point?.tokensPerSecond ?? point?.tokens_per_sec ?? point?.throughput ?? 0),
        gpu: Number(point?.gpuPct ?? point?.gpu_pct ?? point?.gpu ?? 0),
        memory: Number(point?.memoryPct ?? point?.memory_pct ?? 0),
        queue: Number(point?.queue ?? point?.queue_size ?? 0),
        requests: Number(point?.requestsPerSecond ?? point?.requests_per_sec ?? point?.reqs_per_sec ?? 0),
        model: point?.model || point?.model_name || 'local-model',
    }
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Cpu }) {
    return (
        <div className="rounded-md border border-white/10 bg-black/25 p-3">
            <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs">{label}</span>
                <Icon size={14} />
            </div>
            <div className="mt-2 text-lg font-semibold text-white">{value}</div>
        </div>
    )
}

export default function RealtimeModelMonitor() {
    const { data, loading } = useModelMetrics()
    const metrics = Array.isArray(data) ? data : []
    const chartData = useMemo(() => metrics.slice(-64).map(normalizePoint), [metrics])
    const latest = chartData[chartData.length - 1]

    return (
        <Card className="overflow-hidden">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Cpu size={18} className="text-cyan-200" />
                        AI Model Monitor
                    </div>
                    <div className="mt-1 text-sm text-zinc-400">Latency, throughput, token streaming, queue, GPU and memory usage</div>
                </div>
                <div className="status-pill status-pill--connected text-xs">
                    {loading ? 'Syncing metrics' : latest?.model || 'No model connected'}
                </div>
            </div>

            {!chartData.length ? (
                <div className="grid min-h-[260px] place-items-center rounded-lg border border-dashed border-white/10 bg-white/[0.025] text-center">
                    <div>
                        <Gauge className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
                        <div className="font-medium text-white">Waiting for model telemetry</div>
                        <div className="mt-1 text-sm text-zinc-500">The monitor will animate as websocket or polling metrics arrive.</div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="h-56 rounded-lg border border-white/10 bg-black/20 p-3">
                            <div className="mb-2 text-xs uppercase tracking-[0.16em] text-zinc-500">Latency trend</div>
                            <ResponsiveContainer width="100%" height="88%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                                    <XAxis dataKey="time" tick={{ fill: '#71717a', fontSize: 11 }} minTickGap={24} />
                                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} width={34} />
                                    <Tooltip contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }} />
                                    <Area type="monotone" dataKey="latency" stroke="#22d3ee" strokeWidth={2} fill="url(#latencyFill)" animationDuration={450} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="h-56 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                            <div className="mb-2 text-xs uppercase tracking-[0.16em] text-zinc-500">Throughput and token/sec</div>
                            <ResponsiveContainer width="100%" height="88%">
                                <LineChart data={chartData}>
                                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                                    <XAxis dataKey="time" tick={{ fill: '#71717a', fontSize: 11 }} minTickGap={24} />
                                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} width={34} />
                                    <Tooltip contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }} />
                                    <Line type="monotone" dataKey="throughput" stroke="#8b5cf6" strokeWidth={2} dot={false} animationDuration={450} />
                                    <Line type="monotone" dataKey="tokens" stroke="#60a5fa" strokeWidth={2} dot={false} animationDuration={450} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Stat label="Latency" value={`${Math.round(latest?.latency || 0)} ms`} icon={Timer} />
                        <Stat label="Tokens/sec" value={`${Math.round(latest?.tokens || 0)}`} icon={Zap} />
                        <Stat label="Requests/sec" value={`${Math.round(latest?.requests || 0)}`} icon={Activity} />
                        <Stat label="Queue" value={`${Math.round(latest?.queue || 0)}`} icon={Layers} />
                        <Stat label="GPU" value={`${Math.round(latest?.gpu || 0)}%`} icon={Cpu} />
                        <Stat label="Memory" value={`${Math.round(latest?.memory || 0)}%`} icon={HardDrive} />
                    </div>
                </div>
            )}
        </Card>
    )
}
