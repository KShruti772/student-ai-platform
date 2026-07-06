import Link from 'next/link'
import type { Route } from 'next'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

export default function FeatureCard({
    icon: Icon,
    title,
    description,
    href,
    actionLabel = 'Open',
    tone = 'violet',
    className = '',
}: {
    icon: LucideIcon
    title: string
    description: string
    href: Route
    actionLabel?: string
    tone?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'blue' | 'pink'
    className?: string
}) {
    const toneStyles = {
        violet: 'from-violet-500/25 to-fuchsia-500/10 text-violet-300 shadow-violet-500/20',
        cyan: 'from-cyan-400/25 to-sky-500/10 text-cyan-300 shadow-cyan-400/20',
        emerald: 'from-emerald-400/25 to-teal-500/10 text-emerald-300 shadow-emerald-400/20',
        amber: 'from-amber-400/25 to-orange-500/10 text-amber-300 shadow-amber-400/20',
        blue: 'from-blue-400/25 to-indigo-500/10 text-blue-300 shadow-blue-400/20',
        pink: 'from-pink-400/25 to-rose-500/10 text-pink-300 shadow-pink-400/20',
    }[tone]
    const hoverBorder = {
        violet: 'hover:border-violet-400/50',
        cyan: 'hover:border-cyan-400/50',
        emerald: 'hover:border-emerald-400/50',
        amber: 'hover:border-amber-400/50',
        blue: 'hover:border-blue-400/50',
        pink: 'hover:border-pink-400/50',
    }[tone]

    return (
        <Link
            href={href}
            className={twMerge(clsx('group relative flex min-h-[240px] flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl shadow-black/5 transition duration-200 hover:-translate-y-1 hover:bg-secondary hover:shadow-black/10', hoverBorder, className))}
        >
            <span className={twMerge(clsx('pointer-events-none absolute inset-x-8 -top-16 h-28 rounded-full bg-gradient-to-r opacity-0 blur-3xl transition duration-300 group-hover:opacity-100', toneStyles))} />
            <span className={twMerge(clsx('relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br shadow-xl transition duration-200 group-hover:scale-105', toneStyles))}>
                <Icon size={22} />
            </span>
            <h3 className="relative mt-6 text-xl font-semibold text-foreground">{title}</h3>
            <p className="relative mt-3 flex-1 text-base leading-7 text-muted-foreground">{description}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400">
                {actionLabel} <ArrowRight size={15} className="transition group-hover:translate-x-1" />
            </span>
        </Link>
    )
}
