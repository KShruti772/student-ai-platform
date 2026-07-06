import React from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

export default function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <span className={twMerge(clsx('inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground', className))}>{children}</span>
}
