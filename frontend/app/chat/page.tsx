'use client'

import ChatWorkspace from '../../components/chat/ChatWorkspace'

export default function ChatPage() {
    return <ChatWorkspace />
    /*
    return (
        <div className="space-y-8">
            <section className="glass-card card-border overflow-hidden rounded-[2rem] border-white/10 bg-slate-950/90 p-8 shadow-soft backdrop-blur-xl">
                <div className="grid gap-8 xl:grid-cols-[1.4fr_0.6fr]">
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-cyan-300/80">
                            <MessageCircle size={16} className="text-cyan-300" />
                            AI Chat Workspace
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl font-semibold text-white sm:text-5xl">A conversation-first AI command center.</h1>
                            <p className="max-w-3xl text-base leading-8 text-zinc-400">Interact with the platform using a fluid chat experience, streaming assistant responses, slash commands, and contextual reasoning alongside your workflow orchestration.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Link href="/ai-workspace" className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:brightness-110">Open AI Workspace <ArrowRight size={18} /></Link>
                            <Link href="/mentor" className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10">Start Mentor Session</Link>
                        </div>
                    </div>
                    <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-black/20 p-6 text-sm text-zinc-300">
                        <div className="flex items-center justify-between gap-3 rounded-3xl bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.24em] text-cyan-200">Realtime session</div>
                        <div className="grid gap-4">
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                                <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Assistant status</div>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <span className="text-xl font-semibold text-white">Responsive</span>
                                    <StatusPill status="connected" label="Live" />
                                </div>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                                <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Streaming</div>
                                <div className="mt-3 text-3xl font-semibold text-white">Token flow</div>
                                <div className="mt-2 text-sm text-zinc-400">Streaming tokens with instant assistant updates.</div>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                                <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Security</div>
                                <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400"><ShieldCheck size={16} className="text-cyan-300" /> Local-first data handling with session persistence.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
                <div>
                    <ChatWindow />
                </div>
                <div className="space-y-4">
                    <Card className="space-y-4 p-6">
                        <div className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">Task library</div>
                        <div className="space-y-3 text-sm text-zinc-300">
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">/summarize — Summarize your current workflow state and activity.</div>
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">/explain — Ask the mentor to explain the reasoning behind the AI plan.</div>
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">/deploy — Send a deployment instruction to the workflow engine.</div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-3 text-sm font-semibold text-white">
                            <Sparkles size={16} className="text-cyan-200" /> Conversation continuity
                        </div>
                        <div className="mt-3 text-sm leading-7 text-zinc-400">Your session history stays local, so you can close the browser and return to the same assistant state with context preserved.</div>
                    </Card>
                </div>
            </div>
        </div>
    )
    */
}
