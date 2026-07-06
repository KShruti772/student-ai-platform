'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

export default function NavLink({ href, label, icon: Icon, exact = false }: { href: Route; label: string; icon: LucideIcon; exact?: boolean }) {
    const pathname = usePathname() || '/'
    const active = exact ? pathname === href : pathname.startsWith(href)

    return (
        <Link href={href} className={clsx('group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm transition', active ? 'bg-cyan-400/10 text-white shadow-[0_0_30px_rgba(34,211,238,0.08)]' : 'text-zinc-300 hover:bg-white/5 hover:text-white')}>
            <span className={clsx('flex h-11 w-11 items-center justify-center rounded-2xl transition', active ? 'bg-cyan-500/10 text-cyan-200' : 'bg-white/5 text-zinc-400 group-hover:bg-white/10 group-hover:text-white')}>
                <Icon size={18} />
            </span>
            <span className="font-medium">{label}</span>
        </Link>
    )
}
