'use client'

import React from 'react'
import { useAgentActivity } from '../lib/hooks'
import { motion } from 'framer-motion'

export default function AgentPanel() {
    const { data: agents, loading } = useAgentActivity()

    return (
        <aside className="h-full bg-panel p-4 glass flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="font-semibold">Agent Activity</div>
                <div className="text-xs text-muted">Realtime</div>
            </div>

            <div className="flex-1 overflow-auto space-y-3">
                {loading && <div className="p-3 rounded-md bg-white/3 animate-pulse">Loading agents…</div>}
                {agents?.map(a => (
                    <motion.div key={a.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-md bg-white/3">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-medium">{a.name}</div>
                                <div className="text-sm text-muted">{a.task || 'Idle'}</div>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${a.state === 'active' ? 'bg-green-600' : 'bg-gray-600'}`}>{a.state}</div>
                        </div>
                        <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: `${a.progress}%` }} />
                        </div>
                        <div className="text-xs text-muted mt-2">Updated: {new Date(a.updatedAt).toLocaleTimeString()}</div>
                    </motion.div>
                ))}
            </div>

            <div className="text-xs text-muted">Local</div>
        </aside>
    )
}
