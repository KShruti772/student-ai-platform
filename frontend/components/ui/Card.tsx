import React from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

export default function Card({ children, className = '', padded = true }: { children: React.ReactNode; className?: string; padded?: boolean }) {
    return (
        <div className={twMerge(clsx('rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl shadow-black/5 transition-colors duration-150', !padded && 'p-0', className))}>
            {children}
        </div>
    )
}
