'use client'

import React from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'
import { useWorkflow } from '../../lib/hooks'
import Card from '../ui/Card'
import { motion } from 'framer-motion'
import StatusNode from './StatusNode'

export default function WorkflowView() {
    const { nodes, edges, loading } = useWorkflow()

    if (loading || !nodes || !edges) {
        return <Card className="h-72 flex items-center justify-center">Loading workflow…</Card>
    }

    // reactflow expects nodes to include position and id and edges to follow its shape.
    const nodeTypes = { statusNode: StatusNode }
    const rfNodes = nodes.map(n => ({ ...n, type: n.type || 'statusNode', data: { ...n.data, status: n.data?.status || 'idle' } }))
    return (
        <Card className="h-72">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-full">
                <ReactFlow nodes={rfNodes} edges={edges} nodeTypes={nodeTypes} fitView attributionPosition="bottom-left">
                    <Background color="#222" gap={16} />
                    <Controls />
                </ReactFlow>
            </motion.div>
        </Card>
    )
}
