'use client'

import React, { useCallback, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Card from '../ui/Card'
import { useModelMetrics } from '../../lib/hooks'
import * as api from '../../lib/api'
import { useStore } from '../../lib/store'

function fmtTime(ts: number) {
    const d = new Date(ts)
    return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0')
}

function SafeNumber(...vals: Array<any>) {
    for (const v of vals) {
        if (typeof v === 'number' && !Number.isNaN(v)) return v
    }
    return '-' as const
}

export default function ModelMonitor() {
    const { data, loading } = useModelMetrics()
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const setMetrics = useStore(s => s.setMetrics)

    const reconnect = useCallback(async () => {
        setError(null)
        setRefreshing(true)
        try {
            const d = await api.getModelMetrics()
            // normalize to array
            setMetrics(Array.isArray(d) ? d : [])
        } catch (err: any) {
            console.error('reconnect getModelMetrics error', err)
            setError(err?.message || 'Failed to reach backend')
        } finally {
            setRefreshing(false)
        }
    }, [setMetrics])

    // Loading state
    if (loading) {
        return (
            <Card className="h-52 p-3">
                <div className="animate-pulse flex flex-col gap-3">
                    <div className="h-5 bg-white/6 rounded w-32" />
                    <div className="flex gap-3">
                        <div className="flex-1 space-y-2">
                            <div className="h-36 bg-white/6 rounded" />
                        </div>
                        <div className="w-56 space-y-2">
                            <div className="h-8 bg-white/6 rounded" />
                            <div className="grid grid-cols-2 gap-2">
                                <div className="h-12 bg-white/6 rounded" />
                                <div className="h-12 bg-white/6 rounded" />
                                <div className="h-12 bg-white/6 rounded" />
                                <div className="h-12 bg-white/6 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        )
    }

    // Handle empty / offline / error states
    const metrics = Array.isArray(data) ? data : []
    if (!metrics || metrics.length === 0) {
        return (
            <Card className="h-52 p-4 flex flex-col items-center justify-center text-center">
                <div className="text-sm font-medium mb-2">No model metrics available</div>
                <div className="text-xs text-gray-300 mb-4">The backend may be offline or not returning metrics.</div>
                <div className="flex gap-2">
                    <button
                        onClick={reconnect}
                        className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-md"
                        disabled={refreshing}
                    >
                        {refreshing ? 'Reconnecting…' : 'Reconnect'}
                    </button>
                    <button
                        onClick={() => setMetrics([])}
                        className="px-3 py-2 bg-white/6 hover:bg-white/10 text-gray-200 rounded-md"
                    >
                        Clear
                    </button>
                </div>
                {error ? <div className="text-xs text-rose-400 mt-3">{error}</div> : null}
            </Card>
        )
    }

    // Safe latest and chart data
    const latest = metrics[metrics.length - 1]
    const chartData = metrics.map((p: any) => ({ time: fmtTime(p?.ts ?? Date.now()), latency: p?.latencyMs ?? p?.latency ?? null, throughput: p?.throughput ?? null }))

    const modelName = latest?.model ?? latest?.model_name ?? 'No model connected'
    const latency = SafeNumber(latest?.latencyMs, latest?.latency, latest?.latency_ms)
    const throughput = SafeNumber(latest?.throughput, latest?.tokens_per_sec)
    const requests = SafeNumber(latest?.requests_per_sec, latest?.reqs_per_sec)
    const memory = SafeNumber(latest?.memory_mb, latest?.memMb, latest?.mem_mb)
    const queue = SafeNumber(latest?.queue_size, latest?.queue)

    return (
        <Card className="h-52 p-3">
            <div className="flex gap-4 h-full">
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium">Model Latency</div>
                            <div className="text-xs text-gray-300">Active model: <strong>{modelName}</strong></div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm">{latency === '-' ? '-' : `${latency} ms`}</div>
                            <div className="text-xs text-gray-400">latency</div>
                        </div>
                    </div>
                    <div className="mt-2 h-36">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="latency" stroke="#7c3aed" strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="w-56 flex flex-col gap-2">
                    <div className="text-sm font-medium">Stats</div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/20 rounded p-2 text-xs">
                            <div className="text-sm font-semibold">{throughput}</div>
                            <div className="text-[10px] text-gray-300">tokens/sec</div>
                        </div>
                        <div className="bg-black/20 rounded p-2 text-xs">
                            <div className="text-sm font-semibold">{requests}</div>
                            <div className="text-[10px] text-gray-300">req/sec</div>
                        </div>
                        <div className="bg-black/20 rounded p-2 text-xs">
                            <div className="text-sm font-semibold">{memory}</div>
                            <div className="text-[10px] text-gray-300">memory MB</div>
                        </div>
                        <div className="bg-black/20 rounded p-2 text-xs">
                            <div className="text-sm font-semibold">{queue}</div>
                            <div className="text-[10px] text-gray-300">queue</div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    )
}
