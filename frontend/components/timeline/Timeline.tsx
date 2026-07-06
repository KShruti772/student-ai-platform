"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import * as api from '../../lib/api'
import { websocketUrl } from '../../lib/endpoints'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import ReactFlow, { Background, Controls, MiniMap, Node } from 'reactflow'
import 'reactflow/dist/style.css'
import RealtimeManager from '../../services/realtime'

type TokenEvent = { ts: number; token: string; stream_id?: string; type?: string }

export default function Timeline({ sessionId = 'default' }: { sessionId?: string }) {
    const [events, setEvents] = useState<TokenEvent[]>([])
    const [messages, setMessages] = useState<any[]>([])
    const [playing, setPlaying] = useState(false)
    const [position, setPosition] = useState(0)
    const [speed, setSpeed] = useState(1)
    const [workflowNodes, setWorkflowNodes] = useState<Node[]>([])
    const [nodeStatus, setNodeStatus] = useState<Record<string, string>>({})

    useEffect(() => {
        let mounted = true
        async function load() {
            const tl = await api.getSessionTimeline(sessionId)
            if (!mounted) return
            setEvents(tl.events || [])
            setMessages(tl.messages || [])
        }
        load()

        // connect session websocket for live events via centralized RealtimeManager
        const wsUrl = websocketUrl(`/ws/session/${encodeURIComponent(sessionId)}`)

        const sub = RealtimeManager.subscribe(wsUrl, {
            onMessage: (d: any) => {
                try {
                    if (d.type === 'token_stream' || d.type === 'chat.token') {
                        setEvents(e => [...e, { ts: d.ts || Date.now(), token: d.token, stream_id: d.stream_id, type: d.type }])
                    }
                    if (d.type && d.type.startsWith('node.')) {
                        const id = d.node
                        const status = d.type === 'node.started' ? 'running' : d.type === 'node.completed' ? 'done' : 'failed'
                        setNodeStatus(s => ({ ...s, [id]: status }))
                    }
                } catch (err) { }
            }
        })

        return () => { mounted = false; sub.unsubscribe() }
    }, [sessionId])

    const assembled = useMemo(() => events.map(e => e.token).join(''), [events])

    // simple playback: advance position using requestAnimationFrame while playing
    useEffect(() => {
        let raf = 0
        let last = performance.now()
        function tick(now: number) {
            const dt = now - last
            last = now
            if (playing) {
                // speed affects how many tokens advance per frame
                const step = Math.max(1, Math.floor((dt / 50) * speed))
                setPosition(pos => Math.min(events.length, pos + step))
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [playing, events.length])

    const tokensPerSecond = useMemo(() => {
        if (events.length < 2) return 0
        const span = (events[events.length - 1].ts - events[0].ts) / 1000
        return span > 0 ? Math.round(events.length / span) : 0
    }, [events])

    // load workflow nodes for visualization
    useEffect(() => {
        let mounted = true
        async function loadWorkflow() {
            try {
                const wf = await api.getWorkflow()
                if (!mounted) return
                // map to ReactFlow nodes if possible
                const nodes: Node[] = (wf.nodes || []).map((n, i) => ({ id: String(n.id || i), data: { label: n.label || n.id || `node-${i}` }, position: { x: (i % 4) * 180, y: Math.floor(i / 4) * 120 }, style: { padding: 8, border: '1px solid rgba(255,255,255,0.06)', background: '#0b1220', color: '#fff' } }))
                setWorkflowNodes(nodes)
            } catch (err) {
                // ignore
            }
        }
        loadWorkflow()
        return () => { mounted = false }
    }, [])

    return (
        <div className="p-4 bg-gradient-to-br from-gray-900/60 via-purple-900/40 to-white/5 rounded-lg backdrop-blur border border-white/5">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-xl font-semibold">Execution Timeline</h3>
                    <p className="text-sm text-gray-300">Session: {sessionId} — tokens: {events.length} — {tokensPerSecond} t/s</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPlaying(p => !p)} className="px-3 py-1 bg-indigo-600 rounded">{playing ? 'Pause' : 'Play'}</button>
                    <button onClick={() => { setPosition(0); setPlaying(false) }} className="px-3 py-1 bg-gray-700 rounded">Restart</button>
                    <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="ml-2 bg-black/20 rounded px-2 py-1 text-sm">
                        <option value={0.25}>0.25x</option>
                        <option value={0.5}>0.5x</option>
                        <option value={1}>1x</option>
                        <option value={2}>2x</option>
                        <option value={4}>4x</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <motion.div layout className="h-40 p-3 bg-black/40 rounded text-green-200 font-mono overflow-auto">
                        <motion.pre animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ duration: 0.25 }} className="whitespace-pre-wrap">
                            {assembled.slice(0, Math.max(0, position)).replace(/\n/g, '\n')}
                        </motion.pre>
                    </motion.div>
                    <input type="range" min={0} max={events.length} value={position} onChange={(e) => setPosition(Number(e.target.value))} className="w-full mt-2" />
                </div>

                <div style={{ width: 320 }}>
                    <div className="h-32 bg-black/30 rounded p-2">
                        <ResponsiveContainer width="100%" height={100}>
                            <LineChart data={events.map((ev, i) => ({ i, ts: ev.ts }))}>
                                <XAxis dataKey="i" hide />
                                <YAxis hide />
                                <Tooltip />
                                <Line type="monotone" dataKey="i" stroke="#8884d8" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 bg-black/20 rounded p-2 text-sm text-gray-200 h-28 overflow-auto">
                        <strong>Logs</strong>
                        <div className="mt-1">
                            {events.slice(-10).map((ev, idx) => (
                                <div key={idx} className="text-xs text-gray-300">{new Date(ev.ts).toLocaleTimeString()} — {ev.token}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 p-2 bg-black/20 rounded">
                <h4 className="text-sm font-medium mb-2">Workflow Replay</h4>
                <div className="h-48 rounded overflow-hidden bg-transparent">
                    <ReactFlow nodes={workflowNodes.map(n => ({ ...n, className: nodeStatus[n.id] === 'running' ? 'reactflow-node-running' : nodeStatus[n.id] === 'done' ? 'reactflow-node-done' : '' }))} edges={[]} fitView>
                        <Background gap={12} color="#081225" />
                        <MiniMap />
                        <Controls />
                    </ReactFlow>
                </div>
            </div>
        </div>
    )
}
