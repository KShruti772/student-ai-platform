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
    className = '',
}: {
    icon: LucideIcon
    title: string
    description: string
    href: Route
    className?: string
}) {
    return (
        <Link
            href={href}
            className={twMerge(clsx('group flex min-h-[220px] flex-col rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl shadow-black/5 transition duration-200 hover:-translate-y-1 hover:border-cyan-400/50 hover:bg-secondary', className))}
        >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-cyan-400 transition group-hover:bg-violet-500/25 group-hover:text-cyan-300">
                <Icon size={22} />
            </span>
            <h3 className="mt-6 text-xl font-semibold text-foreground">{title}</h3>
            <p className="mt-3 flex-1 text-base leading-7 text-muted-foreground">{description}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400">
                Open <ArrowRight size={15} className="transition group-hover:translate-x-1" />
            </span>
        </Link>
    )
}
