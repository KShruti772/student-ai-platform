import React from 'react'
import { motion } from 'framer-motion'

export default function StatusNode({ data }: any) {
    const status = data?.status || 'idle'
    const color = status === 'running' ? '#22d3ee' : status === 'done' ? '#34d399' : status === 'failed' ? '#fb7185' : '#71717a'
    const label = status === 'running' ? 'Running' : status === 'done' ? 'Complete' : status === 'failed' ? 'Retry needed' : 'Queued'

    return (
        <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, boxShadow: status === 'running' ? '0 0 32px rgba(34,211,238,0.28)' : '0 12px 34px rgba(0,0,0,0.24)' }}
            whileHover={{ scale: 1.01, y: -2 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="min-w-[168px] rounded-[1.5rem] border bg-zinc-950/90 p-4 text-white backdrop-blur"
            style={{ borderColor: color }}
        >
            <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                    {status === 'running' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: color }} />}
                    <span className="relative inline-flex h-3 w-3 rounded-full" style={{ background: color }} />
                </span>
                <div>
                    <div className="text-sm font-semibold">{data?.label}</div>
                    <div className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-zinc-500">{label}</div>
                </div>
            </div>
        </motion.div>
    )
}
