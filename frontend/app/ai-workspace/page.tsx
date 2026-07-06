import React from 'react'
import Workspace from '../../components/Workspace'
import Card from '../../components/ui/Card'
import Link from 'next/link'
import { Bot, Sparkles } from 'lucide-react'

export default function AIWorkspacePage() {
    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-soft backdrop-blur-xl">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="max-w-3xl space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-200">
                            <Sparkles size={16} /> AI-first workspace
                        </span>
                        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">AI Workspace</h1>
                        <p className="max-w-2xl text-base leading-8 text-zinc-400">A command-driven operator experience for chat, reasoning, workflow control, and realtime session restoration.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Link href="/playground" className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10">Open playground</Link>
                        <Link href="/sessions" className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10">Review sessions</Link>
                    </div>
                </div>
            </section>

            <Card className="grid gap-4 lg:grid-cols-[1fr_420px]">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-cyan-200">
                        <Bot size={18} />
                        <span>Operator command center</span>
                    </div>
                    <div className="text-sm text-zinc-400">Work with the current session, send prompts, inspect assistant reasoning, and keep your learning flow visible while models stream output.</div>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Workspace quick facts</div>
                    <div className="mt-4 grid gap-3">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">Session restore with local caching</div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">Markdown rendering and token streaming</div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">Slash commands, chat traces, and event context</div>
                    </div>
                </div>
            </Card>

            <Workspace />
        </div>
    )
}
