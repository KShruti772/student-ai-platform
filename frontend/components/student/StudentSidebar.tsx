'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Briefcase, ChevronLeft, ChevronRight, FileText, GitBranch, GraduationCap, Home, MessageSquare, Settings, User } from 'lucide-react'
import { StudentView } from './types'

const nav: Array<{ id: StudentView; label: string; icon: typeof Home }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'roadmap', label: 'Career Roadmap', icon: GraduationCap },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'resume', label: 'Resume Builder', icon: FileText },
    { id: 'mentor', label: 'Mentor', icon: User },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'workflows', label: 'Workflows', icon: GitBranch },
    { id: 'settings', label: 'Settings', icon: Settings },
]

export default function StudentSidebar({ active, onSelect }: { active: StudentView; onSelect: (view: StudentView) => void }) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <motion.aside layout className={`sticky top-0 hidden h-screen shrink-0 p-4 lg:block ${collapsed ? 'w-24' : 'w-72'}`}>
            <div className="glass flex h-full flex-col rounded-2xl p-3">
                <div className="mb-5 flex items-center gap-3 px-1">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 text-lg font-bold text-white shadow-lg shadow-cyan-500/20">AI</div>
                    {!collapsed && (
                        <div>
                            <div className="font-semibold text-white">Student AI</div>
                            <div className="text-sm text-zinc-500">Career OS</div>
                        </div>
                    )}
                    <button onClick={() => setCollapsed(value => !value)} className="ml-auto rounded-xl border border-white/10 p-1.5 text-zinc-400 hover:bg-white/10" aria-label="Toggle sidebar">
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                <nav className="min-h-0 flex-1 space-y-1 overflow-auto">
                    {nav.map(item => {
                        const Icon = item.icon
                        const selected = item.id === active
                        return (
                            <motion.button
                                key={item.id}
                                layout
                                whileHover={{ x: 3 }}
                                onClick={() => onSelect(item.id)}
                                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${selected ? 'bg-white/10 text-white shadow-inner' : 'text-zinc-400 hover:bg-white/7 hover:text-zinc-100'}`}
                            >
                                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected ? 'bg-cyan-300/15 text-cyan-200' : 'bg-white/5'}`}><Icon size={18} /></span>
                                {!collapsed && <span className="font-medium">{item.label}</span>}
                                {selected && !collapsed && <motion.span layoutId="student-active-dot" className="ml-auto h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.8)]" />}
                            </motion.button>
                        )
                    })}
                </nav>

                {!collapsed && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="text-sm font-medium text-white">Today</div>
                        <div className="mt-1 text-sm leading-5 text-zinc-400">Build one useful artifact: a roadmap, project, resume bullet, or interview plan.</div>
                    </div>
                )}
            </div>
        </motion.aside>
    )
}
