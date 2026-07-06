'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Bot, Code2, Database, Layers, Sparkles, Search, Zap } from 'lucide-react'
import Link from 'next/link'
import Card from '../ui/Card'

const FEATURES = [
    {
        title: 'AI Chat',
        description: 'Local-first LLM chat with streaming assistant responses, reasoning traces, and session recall.',
        icon: Bot,
        accent: 'from-cyan-400 to-blue-500',
    },
    {
        title: 'Workflow Engine',
        description: 'Visual DAG orchestration with retries, execution graphs, and live task telemetry.',
        icon: Layers,
        accent: 'from-violet-500 to-fuchsia-500',
    },
    {
        title: 'Mentor System',
        description: 'Educational AI mentor for explanations, code walkthroughs, and learning guidance.',
        icon: Sparkles,
        accent: 'from-emerald-400 to-cyan-400',
    },
    {
        title: 'Knowledge Base',
        description: 'Upload documents, run semantic search, and power contextual retrieval workflows.',
        icon: Database,
        accent: 'from-sky-400 to-indigo-500',
    },
    {
        title: 'Skills Engine',
        description: 'Detect skills automatically, inject prompts, and activate tool-based capabilities.',
        icon: Code2,
        accent: 'from-fuchsia-500 to-violet-500',
    },
    {
        title: 'Model Telemetry',
        description: 'Realtime latency, throughput, memory, and token rate metrics for every model.',
        icon: Zap,
        accent: 'from-sky-300 to-cyan-300',
    },
]

const ARCHITECTURE = [
    { title: 'Frontend', detail: 'React + Next.js workspace with realtime controls.', icon: ArrowRight },
    { title: 'Backend', detail: 'AI orchestration APIs and session persistence.', icon: ArrowRight },
    { title: 'Websocket Layer', detail: 'Live event delivery, reconnect, and stream-ready sync.', icon: ArrowRight },
    { title: 'Orchestration', detail: 'DAG execution, retry strategies, and agent handoff.', icon: ArrowRight },
    { title: 'Knowledge', detail: 'Semantic retrieval, embeddings, and document indexing.', icon: ArrowRight },
    { title: 'Model', detail: 'Local-first model telemetry, prompt routing, and token streaming.', icon: ArrowRight },
]

export default function HomeLanding() {
    return (
        <div className="space-y-10">
            <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-soft backdrop-blur-xl">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-cyan-400/10 to-transparent" />
                <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] xl:gap-10">
                    <div className="relative z-10 space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-200 shadow-glow">
                            <Sparkles size={16} /> Local-first AI operating system
                        </div>
                        <div className="space-y-5">
                            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">Student AI Platform</h1>
                            <p className="max-w-2xl text-lg leading-8 text-zinc-400">Local-first AI operating system for learning, orchestration, workflows, mentoring, and realtime AI experimentation.</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Link href="/ai-workspace" className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-4 text-base font-semibold text-slate-950 shadow-glow transition hover:brightness-110">
                                Open Workspace <ArrowRight size={18} />
                            </Link>
                            <Link href="/workflows" className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-base font-semibold text-white transition hover:bg-white/10">
                                Explore workflows
                            </Link>
                            <Link href="/agents" className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-base font-semibold text-white transition hover:bg-white/10">
                                View agents
                            </Link>
                            <Link href="/sessions" className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-base font-semibold text-white transition hover:bg-white/10">
                                Session timeline
                            </Link>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-soft">
                        <div className="absolute -right-10 top-8 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl" />
                        <div className="relative z-10 space-y-5 text-sm text-zinc-300">
                            <div className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                                <div>
                                    <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">Realtime preview</div>
                                    <div className="mt-1 text-xl font-semibold text-white">Live model telemetry</div>
                                </div>
                                <div className="rounded-3xl bg-cyan-500/10 px-3 py-2 text-cyan-100">Connected</div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Agents active</div>
                                    <div className="mt-3 text-3xl font-semibold text-white">12</div>
                                </div>
                                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Token throughput</div>
                                    <div className="mt-3 text-3xl font-semibold text-white">142/s</div>
                                </div>
                                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Latency</div>
                                    <div className="mt-3 text-3xl font-semibold text-white">24ms</div>
                                </div>
                                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Workflows</div>
                                    <div className="mt-3 text-3xl font-semibold text-white">8 active</div>
                                </div>
                            </div>

                            <div className="rounded-[1.75rem] bg-slate-950/80 p-5 text-sm text-zinc-400">
                                <div className="font-medium text-white">Workspace snapshot</div>
                                <div className="mt-3 grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
                                    <div className="rounded-3xl border border-white/10 bg-black/20 p-3">Knowledge base ready</div>
                                    <div className="rounded-3xl border border-white/10 bg-black/20 p-3">Mentor system active</div>
                                    <div className="rounded-3xl border border-white/10 bg-black/20 p-3">Realtime stream healthy</div>
                                    <div className="rounded-3xl border border-white/10 bg-black/20 p-3">Queued tasks 4</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_0.88fr]">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.26em] text-cyan-300/80">
                        <div className="h-0.5 w-10 rounded-full bg-cyan-400/40" /> Platform capabilities
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {FEATURES.map((feature) => {
                            const Icon = feature.icon
                            return (
                                <Card key={feature.title} className="group overflow-hidden border-white/10 bg-black/30 p-6 transition hover:-translate-y-0.5 hover:bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br ${feature.accent} text-white shadow-glow`}>
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                                            <p className="mt-2 text-sm text-zinc-400">{feature.description}</p>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-soft">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">Architecture overview</p>
                                <h2 className="mt-3 text-2xl font-semibold text-white">How the platform fits together</h2>
                            </div>
                            <div className="rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-200">Designed for AI ops</div>
                        </div>
                        <div className="mt-6 space-y-4">
                            {ARCHITECTURE.map((item) => {
                                const Icon = item.icon
                                return (
                                    <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-300/25 hover:bg-white/10">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-200">
                                                <Icon size={18} />
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                                <p className="mt-1 text-sm text-zinc-400">{item.detail}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-soft">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">Live operations</p>
                                <h2 className="mt-3 text-2xl font-semibold text-white">Realtime status at a glance</h2>
                            </div>
                            <span className="rounded-full border border-white/10 bg-cyan-500/10 px-4 py-2 text-xs text-cyan-200">Health monitoring</span>
                        </div>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Workflows</p>
                                <p className="mt-3 text-3xl font-semibold text-white">8 live</p>
                                <p className="mt-2 text-sm text-zinc-400">Retryable orchestration and execution graphs.</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Sessions</p>
                                <p className="mt-3 text-3xl font-semibold text-white">14 active</p>
                                <p className="mt-2 text-sm text-zinc-400">Replay, grouped events, and analytics.</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Knowledge</p>
                                <p className="mt-3 text-3xl font-semibold text-white">22 docs</p>
                                <p className="mt-2 text-sm text-zinc-400">Embeddings ready for semantic retrieval.</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Agents</p>
                                <p className="mt-3 text-3xl font-semibold text-white">6 online</p>
                                <p className="mt-2 text-sm text-zinc-400">Heartbeat probes, workload, and telemetry.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
