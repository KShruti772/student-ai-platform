'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sparkles, Search, Layers, Rocket, Zap, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useStore } from '../lib/store'
import { CommandPalette, ContextPanel, SidebarNav, StatusPill, TopbarBar } from './ui'

const COMMANDS = [
    { id: 'open-workspace', title: 'Open AI Workspace', action: () => window.location.assign('/ai-workspace') },
    { id: 'view-workflows', title: 'Browse workflows', action: () => window.location.assign('/workflows') },
    { id: 'open-sessions', title: 'Open session timeline', action: () => window.location.assign('/sessions') },
    { id: 'launch-playground', title: 'Open playground', action: () => window.location.assign('/playground') },
]

export default function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [commandOpen, setCommandOpen] = useState(false)
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')
    const connection = useStore((s) => s.connection)

    useEffect(() => {
        document.documentElement.classList.toggle('theme-light', theme === 'light')
    }, [theme])

    const connectionLabel = useMemo(() => {
        if (connection.status === 'connected') return 'Live'
        if (connection.status === 'reconnecting') return 'Reconnecting'
        if (connection.status === 'stale') return 'Degraded'
        return 'Offline'
    }, [connection.status])

    const quickActions = [
        { id: 'new-session', label: 'New Workspace', icon: Sparkles, href: '/ai-workspace' },
        { id: 'run-workflow', label: 'Run Workflow', icon: Rocket, href: '/workflows' },
        { id: 'review-agents', label: 'Inspect Agents', icon: Layers, href: '/agents' },
        { id: 'open-knowledge', label: 'Knowledge Base', icon: Search, href: '/knowledge-base' },
    ]

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_26%)]" />
            <div className="pointer-events-none absolute right-0 top-32 h-[420px] w-[560px] rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/5 blur-3xl" />

            <CommandPalette commands={COMMANDS} open={commandOpen} onOpenChange={setCommandOpen} />

            <div className="relative flex min-h-screen">
                <SidebarNav />

                <div className="flex min-h-screen flex-1 flex-col">
                    <TopbarBar onOpenCommand={() => setCommandOpen(true)} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />

                    <div className="flex-1 overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-white/10 bg-black/30 p-4 shadow-soft backdrop-blur-xl">
                            <div>
                                <div className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">Platform navigation</div>
                                <div className="mt-2 text-sm text-slate-400">
                                    You are browsing <span className="font-semibold text-white">{pathname === '/' ? 'Home' : pathname.slice(1).replace('-', ' ').replace('/', ' / ')}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <StatusPill status={connection.status === 'stale' ? 'degraded' : connection.status} label={connectionLabel} icon={<Zap size={12} />} />
                                <StatusPill status={theme === 'dark' ? 'connected' : 'syncing'} label={`${theme === 'dark' ? 'Dark' : 'Light'} theme`} icon={<User size={12} />} />
                            </div>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                            <div>{children}</div>
                            <ContextPanel title="Workspace summary">
                                <div className="space-y-4">
                                    <StatusPill status={connection.status === 'stale' ? 'degraded' : connection.status} label={`Connection ${connectionLabel}`} />
                                    <div className="grid gap-3">
                                        {quickActions.map((action) => (
                                            <a key={action.id} href={action.href} className="inline-flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10">
                                                <span>{action.label}</span>
                                                <action.icon size={16} className="text-cyan-300" />
                                            </a>
                                        ))}
                                    </div>
                                    <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                                        <div className="font-semibold text-white">Realtime insight</div>
                                        <p className="mt-2">Last heartbeat: {connection.lastHeartbeat ? new Date(connection.lastHeartbeat).toLocaleTimeString() : 'No heartbeat yet'}</p>
                                        <p className="mt-2">Attempts: {connection.attempts ?? 0}</p>
                                    </div>
                                </div>
                            </ContextPanel>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
