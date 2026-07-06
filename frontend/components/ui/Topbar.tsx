'use client'

import React from 'react'
import { Bell, Command, Search, Sparkles, Wifi, Moon, Sun } from 'lucide-react'
import { ConnectionSnapshot } from '../../lib/types'
import StatusPill from './StatusPill'
import useMounted from '../../hooks/useMounted'

export default function Topbar({ onOpenCommand, connection, theme, toggleTheme }: { onOpenCommand: () => void; connection: ConnectionSnapshot; theme: 'dark' | 'light'; toggleTheme: () => void }) {
    const mounted = useMounted()
    const status = connection.status || 'offline'
    const statusLabel = status === 'connected' ? `${connection.latencyMs ?? 0}ms live` : status === 'reconnecting' ? 'Reconnecting...' : status === 'offline' ? 'Offline' : status

    return (
        <div className="sticky top-4 z-30 mb-5">
            <div className="glass-card card-border flex flex-col gap-4 rounded-[1.75rem] border-white/10 p-5 shadow-soft">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <div className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Operator Workspace</div>
                        <div className="mt-2 text-2xl font-semibold text-white">Realtime AI command center</div>
                        <div className="mt-1 max-w-2xl text-sm text-zinc-400">Manage agents, workflows, and model streams with an elegant, responsive dashboard built for modern AI operations.</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button onClick={onOpenCommand} className="inline-flex min-w-[210px] items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-white/10">
                            <Search size={18} className="text-cyan-300" />
                            <span className="flex-1">Search agents, sessions, workflows...</span>
                            <span className="rounded-full border border-white/10 px-2 py-1 text-[0.68rem] uppercase text-zinc-300">⌘K</span>
                        </button>
                        <StatusPill status={status === 'stale' ? 'degraded' : status} label={statusLabel} icon={<Wifi size={12} />} className="min-w-[160px]" />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-zinc-400">
                    <div className="inline-flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200"><Sparkles size={16} /></span>
                        <div>
                            <div className="font-semibold text-white">Operator profile</div>
                            <div>AI Ops • Local environment</div>
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <button className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10">Notifications</button>
                        <button onClick={toggleTheme} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10">
                            {mounted ? theme === 'dark' ? <Sun size={14} /> : <Moon size={14} /> : <span aria-hidden="true" className="inline-block h-[14px] w-[14px]" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
