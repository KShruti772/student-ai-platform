'use client'

import React from 'react'
import clsx from 'clsx'
import Card from './Card'

export default React.memo(function MetricWidget({
    label,
    value,
    detail,
    icon,
    accent = 'from-cyan-400 to-blue-500',
    className = '',
}: {
    label: string
    value: string
    detail: string
    icon: React.ReactNode
    accent?: string
    className?: string
}) {
    return (
        <Card className={clsx('overflow-hidden p-5', className)}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</div>
                    <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
                    <div className="mt-2 text-sm text-zinc-400">{detail}</div>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br ${accent} text-white shadow-glow`}>
                    {icon}
                </div>
            </div>
        </Card>
    )
})
