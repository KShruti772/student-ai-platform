'use client'

import React from 'react'
import { Command, Menu, Search, Sparkles } from 'lucide-react'
import { StudentView } from './types'

const labels: Record<StudentView, string> = {
    home: 'Home',
    chat: 'AI Chat',
    roadmap: 'Career Roadmap',
    projects: 'Projects',
    resume: 'Resume Builder',
    mentor: 'Mentor',
    knowledge: 'Knowledge Base',
    workflows: 'Workflows',
    settings: 'Settings',
}

export default function StudentTopbar({ active, onOpenCommand }: { active: StudentView; onOpenCommand: () => void }) {
    return (
        <div className="sticky top-4 z-30 mb-6">
            <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-3">
                    <button className="rounded-xl border border-white/10 p-2 text-zinc-400 lg:hidden" aria-label="Open navigation"><Menu size={18} /></button>
                    <div>
                        <div className="text-sm text-zinc-500">Student AI Career OS</div>
                        <div className="text-lg font-semibold text-white">{labels[active]}</div>
                    </div>
                </div>
                <button onClick={onOpenCommand} className="order-last flex min-w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-zinc-400 hover:bg-white/8 md:order-none md:min-w-[360px]">
                    <Search size={17} />
                    <span className="flex-1">Ask, search, or jump anywhere...</span>
                    <span className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300"><Command size={12} />K</span>
                </button>
                <div className="flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">
                    <Sparkles size={16} />
                    AI ready
                </div>
            </div>
        </div>
    )
}
