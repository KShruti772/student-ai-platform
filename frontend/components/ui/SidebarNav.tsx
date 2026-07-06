'use client'

import { useState } from 'react'
import { Home, MessageCircle, GitBranch, Users, BookOpen, Sparkles, Clock3, BarChart3, Cpu, Settings2 } from 'lucide-react'
import NavLink from './NavLink'
import StatusPill from './StatusPill'

export default function SidebarNav() {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside className={`sticky top-0 hidden h-screen shrink-0 border-r border-white/10 bg-slate-950/80 px-4 py-5 backdrop-blur-xl lg:block ${collapsed ? 'w-24' : 'w-80'}`}>
            <div className="flex h-full flex-col gap-5">
                <div className="flex items-center gap-3 px-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 text-white shadow-glow">
                        <Sparkles size={22} />
                    </div>
                    {!collapsed && (
                        <div>
                            <div className="text-base font-semibold text-white">Student AI</div>
                            <p className="text-sm text-zinc-400">AI operating system</p>
                        </div>
                    )}
                    <button onClick={() => setCollapsed((value) => !value)} className="ml-auto rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 hover:bg-white/10">
                        {collapsed ? '›' : '‹'}
                    </button>
                </div>

                <div className="space-y-4 overflow-auto px-2">
                    <NavLink href="/" label="Home" icon={Home} exact />
                    <NavLink href="/chat" label="AI Chat" icon={MessageCircle} />
                    <NavLink href="/ai-workspace" label="Workflows" icon={GitBranch} />
                    <NavLink href="/agents" label="Agents" icon={Users} />
                    <NavLink href="/knowledge-base" label="Knowledge Base" icon={BookOpen} />
                    <NavLink href="/mentor" label="Mentor" icon={Sparkles} />
                    <NavLink href="/sessions" label="Sessions" icon={Clock3} />
                    <NavLink href="/analytics" label="Analytics" icon={BarChart3} />
                    <NavLink href="/model-monitor" label="Model Monitor" icon={Cpu} />
                    <NavLink href="/settings" label="Settings" icon={Settings2} />
                </div>

                {!collapsed && (
                    <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-4 text-sm text-zinc-300">
                        <div className="mb-3 text-xs uppercase tracking-[0.24em] text-zinc-500">Realtime status</div>
                        <StatusPill status="connected" label="Live websocket" />
                    </div>
                )}
            </div>
        </aside>
    )
}
