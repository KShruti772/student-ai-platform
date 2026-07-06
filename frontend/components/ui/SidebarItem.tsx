'use client'

import Link from 'next/link'
import type { Route } from 'next'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

export default function SidebarItem({
    href,
    label,
    icon: Icon,
    active,
    collapsed = false,
    onNavigate,
}: {
    href: Route
    label: string
    icon: LucideIcon
    active: boolean
    collapsed?: boolean
    onNavigate?: () => void
}) {
    return (
        <Link
            href={href}
            title={collapsed ? label : undefined}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
            className={twMerge(clsx(
                'group flex h-12 items-center rounded-2xl text-[15px] font-medium outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-cyan-400',
                collapsed ? 'justify-center px-0' : 'gap-3 px-4',
                active
                    ? 'bg-violet-500/15 text-foreground shadow-xl shadow-black/5 ring-1 ring-violet-500/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            ))}
        >
            <Icon size={18} className={clsx('shrink-0 transition', active ? 'text-cyan-400' : 'text-muted-foreground group-hover:text-cyan-400')} />
            {!collapsed && <span className="truncate">{label}</span>}
        </Link>
    )
}
