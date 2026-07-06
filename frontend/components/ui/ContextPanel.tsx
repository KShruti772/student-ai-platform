'use client'

import { type ReactNode } from 'react'
import { Info, Sparkles } from 'lucide-react'
import StatusPill from './StatusPill'

export default function ContextPanel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <aside className="hidden xl:block xl:w-[360px]">
            <div className="glass-card card-border space-y-5 rounded-[2rem] border-white/10 bg-slate-950/90 p-6 shadow-soft backdrop-blur-xl">
                <div className="flex items-center gap-3 text-sm font-semibold text-white">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-glow"><Sparkles size={18} /></span>
                    <div>
                        <div>{title}</div>
                        <div className="text-xs text-zinc-400">Context-aware controls and status</div>
                    </div>
                </div>
                <StatusPill status="connected" label="AI sync ready" />
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Info size={16} /> Session insights</div>
                    {children}
                </div>
            </div>
        </aside>
    )
}
