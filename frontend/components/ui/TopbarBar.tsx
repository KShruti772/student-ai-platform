'use client'

import { useMemo } from 'react'
import { Bell, Search, Moon, Sun, Zap } from 'lucide-react'
import StatusPill from './StatusPill'
import { usePathname } from 'next/navigation'
import { useStore } from '../../lib/store'

export default function TopbarBar({ onOpenCommand, theme, toggleTheme }: { onOpenCommand: () => void; theme: 'dark' | 'light'; toggleTheme: () => void }) {
    const connection = useStore((state) => state.connection)
    const pathname = usePathname()
    const title = useMemo(() => {
        if (pathname === '/') return 'Home'
        if (pathname === '/chat') return 'AI Chat'
        if (pathname === '/ai-workspace') return 'Workspace'
        if (pathname === '/knowledge-base') return 'Knowledge Base'
        if (pathname === '/mentor') return 'Mentor'
        if (pathname === '/analytics') return 'Analytics'
        if (pathname === '/model-monitor') return 'Model Monitor'
        if (pathname === '/sessions') return 'Sessions'
        if (pathname === '/settings') return 'Settings'
        return 'Student AI Platform'
    }, [pathname])

    return (
        <div className="glass-card card-border sticky top-0 z-20 mb-5 rounded-[2rem] border-white/10 bg-slate-950/90 p-4 shadow-soft backdrop-blur-xl">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-2">
                    <div className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">{title}</div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                        <span>Realtime AI operations</span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300">
                            <Zap size={14} className="text-cyan-300" /> {connection.status === 'connected' ? 'Live' : connection.status === 'reconnecting' ? 'Reconnecting' : connection.status === 'offline' ? 'Offline' : connection.status}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={onOpenCommand} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/10">
                        <Search size={16} /> Quick command
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/10">
                        <Bell size={16} /> Notifications
                    </button>
                    <button onClick={toggleTheme} className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-zinc-300 transition hover:bg-white/10">
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>
            </div>
        </div>
    )
}
