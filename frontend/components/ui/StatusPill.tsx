'use client'

import React from 'react'
import clsx from 'clsx'

type StatusPillProps = {
    status: 'connected' | 'syncing' | 'reconnecting' | 'degraded' | 'offline' | string
    label: string
    icon?: React.ReactNode
    className?: string
}

const toneMap: Record<string, string> = {
    connected: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-200',
    syncing: 'border-sky-300/25 bg-sky-400/10 text-sky-200',
    reconnecting: 'border-amber-300/25 bg-amber-400/10 text-amber-200',
    degraded: 'border-violet-300/25 bg-violet-400/10 text-violet-200',
    offline: 'border-rose-300/25 bg-rose-400/10 text-rose-200',
}

function StatusPill({ status, label, icon, className = '' }: StatusPillProps) {
    return (
        <span className={clsx('inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition', toneMap[status] ?? toneMap.offline, className)}>
            {icon ? <span className="shrink-0">{icon}</span> : null}
            {label}
        </span>
    )
}

export default React.memo(StatusPill)
