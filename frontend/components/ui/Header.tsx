'use client'

import React from 'react'

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
    )
}
