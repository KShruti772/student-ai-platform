'use client'

import React, { useMemo } from 'react'
import ReactFlow, { Background, Controls, MarkerType, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'
import { motion } from 'framer-motion'
import { AlertTriangle, GitBranch, Loader2 } from 'lucide-react'
import { useWorkflow } from '../../lib/hooks'
import Card from '../ui/Card'
import StatusNode from './StatusNode'

export default function RealtimeWorkflowView() {
    const { nodes, edges, loading } = useWorkflow()
    const nodeTypes = useMemo(() => ({ statusNode: StatusNode }), [])
    const running = nodes.filter(node => node.data?.status === 'running').length
    const failed = nodes.filter(node => node.data?.status === 'failed').length
    const complete = nodes.filter(node => node.data?.status === 'done').length

    const rfNodes = useMemo(() => nodes.map((node, index) => ({
        ...node,
        type: node.type || 'statusNode',
        position: node.position || { x: (index % 4) * 220, y: Math.floor(index / 4) * 140 },
        data: { ...node.data, status: node.data?.status || 'idle' },
    })), [nodes])

    const activeNodeIds = useMemo(() => new Set(nodes.filter(node => node.data?.status === 'running').map(node => node.id)), [nodes])
    const rfEdges = useMemo(() => edges.map(edge => ({
        ...edge,
        animated: edge.animated || activeNodeIds.has(edge.source),
        className: activeNodeIds.has(edge.source) ? 'flow-edge' : '',
        style: {
            stroke: activeNodeIds.has(edge.source) ? '#22d3ee' : 'rgba(148,163,184,0.42)',
            strokeWidth: activeNodeIds.has(edge.source) ? 2.5 : 1.5,
        },
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: activeNodeIds.has(edge.source) ? '#22d3ee' : 'rgba(148,163,184,0.42)',
        },
    })), [activeNodeIds, edges])

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: 'easeOut' }}>
            <Card className="overflow-hidden">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <GitBranch size={17} className="text-cyan-200" />
                            Workflow Execution Graph
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">Animated DAG state from websocket execution events</div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-200">{running} running</span>
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-emerald-200">{complete} complete</span>
                        <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-2.5 py-1 text-rose-200">{failed} failed</span>
                    </div>
                </div>

                {loading ? (
                    <div className="grid h-[360px] place-items-center rounded-lg border border-white/10 bg-black/20">
                        <div className="flex items-center gap-2 text-sm text-zinc-400"><Loader2 size={16} className="animate-spin" /> Hydrating workflow topology</div>
                    </div>
                ) : !rfNodes.length ? (
                    <div className="grid h-[360px] place-items-center rounded-lg border border-dashed border-white/10 bg-white/[0.025] text-center">
                        <div>
                            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
                            <div className="font-medium text-white">No workflow loaded</div>
                            <div className="mt-1 text-sm text-zinc-500">Execution nodes will animate here when the backend emits workflow events.</div>
                        </div>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[420px] overflow-hidden rounded-lg border border-white/10 bg-black/20">
                        <ReactFlow nodes={rfNodes} edges={rfEdges} nodeTypes={nodeTypes} fitView attributionPosition="bottom-left" proOptions={{ hideAttribution: true }}>
                            <Background color="rgba(255,255,255,0.08)" gap={18} />
                            <MiniMap pannable zoomable nodeColor={node => node.data?.status === 'running' ? '#22d3ee' : node.data?.status === 'done' ? '#34d399' : node.data?.status === 'failed' ? '#fb7185' : '#52525b'} />
                            <Controls />
                        </ReactFlow>
                    </motion.div>
                )}
            </Card>
        </motion.div>
    )
}
