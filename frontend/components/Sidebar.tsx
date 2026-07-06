'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Bot, Code, Cpu, Database, GitBranch, Home, MessageSquare, Network, Terminal, Users, BookOpen, Sparkles, Zap } from 'lucide-react'
import StatusPill from './ui/StatusPill'

type NavItem = {
    id: string
    label: string
    href: Route
    icon: LucideIcon
}

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
    {
        title: 'Workspace',
        items: [
            { id: 'home', label: 'Home', href: '/', icon: Home },
            { id: 'workspace', label: 'AI Workspace', href: '/ai-workspace', icon: Sparkles },
            { id: 'workflows', label: 'Workflows', href: '/workflows', icon: GitBranch },
            { id: 'agents', label: 'Agents', href: '/agents', icon: Users },
            { id: 'sessions', label: 'Sessions', href: '/sessions', icon: MessageSquare },
            { id: 'knowledge', label: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
        ],
    },
    {
        title: 'Operations',
        items: [
            { id: 'skills', label: 'Skills', href: '/skills', icon: Code },
            { id: 'analytics', label: 'Analytics', href: '/analytics', icon: Cpu },
            { id: 'model-monitor', label: 'Model Monitor', href: '/model-monitor', icon: Zap },
            { id: 'timeline', label: 'Timeline', href: '/timeline', icon: Network },
            { id: 'playground', label: 'Playground', href: '/playground', icon: Terminal },
        ],
    },
]

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const pathname = usePathname() || '/'

    function isActive(href: string) {
        return href === '/' ? pathname === href : pathname.startsWith(href)
    }

    return (
        <motion.aside layout className={`sticky top-0 hidden h-screen shrink-0 p-4 lg:block ${collapsed ? 'w-24' : 'w-80'}`}>
            <motion.div layout className="glass-card card-border flex h-full flex-col gap-5 rounded-[2rem] border-white/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 text-white shadow-glow">
                        <Bot size={22} />
                    </div>
                    {!collapsed && (
                        <div>
                            <div className="text-base font-semibold text-white">Student AI</div>
                            <div className="text-sm text-zinc-400">AI operations hub</div>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed((c) => !c)}
                        className="ml-auto rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 transition hover:bg-white/10"
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? '›' : '‹'}
                    </button>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-4 text-sm text-zinc-300">
                    <div className="font-medium text-white">Workspace</div>
                    <div className="mt-2 text-sm">Local AI developer environment</div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-cyan-200">
                        <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.35)]" />
                        Connected
                    </div>
                </div>

                <nav className="flex-1 overflow-auto space-y-6 pt-2">
                    {NAV_GROUPS.map((group) => (
                        <div key={group.title}>
                            {!collapsed && <div className="mb-3 px-2 text-xs uppercase tracking-[0.24em] text-zinc-500">{group.title}</div>}
                            <div className="space-y-2">
                                {group.items.map((item) => {
                                    const Icon = item.icon
                                    const active = isActive(item.href)
                                    return (
                                        <Link key={item.id} href={item.href} className={`group flex items-center gap-3 rounded-3xl border px-4 py-3 transition ${active ? 'border-cyan-300/25 bg-cyan-400/10 text-white shadow-[0_0_30px_rgba(34,211,238,0.08)]' : 'border-white/5 text-zinc-300 hover:border-white/10 hover:bg-white/5'}`}>
                                            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-cyan-500/10 text-cyan-200' : 'bg-white/5 text-zinc-400 group-hover:bg-white/10 group-hover:text-white'}`}>
                                                <Icon size={18} />
                                            </span>
                                            {!collapsed && <span className="font-medium">{item.label}</span>}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {!collapsed && (
                    <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-4 text-sm text-zinc-300">
                        <div className="font-semibold text-white">Realtime status</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <StatusPill status="connected" label="Live websocket" />
                            <StatusPill status="syncing" label="Auto sync" />
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.aside>
    )
}
