'use client'

import React from 'react'

export default function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse rounded-3xl bg-white/5 ${className}`} />
}
