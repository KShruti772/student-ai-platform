'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { motion } from 'framer-motion'
import {
    Activity,
    ArrowRight,
    BookOpen,
    Bot,
    BrainCircuit,
    Clock3,
    Compass,
    Cpu,
    FileUp,
    GitBranch,
    GraduationCap,
    MessageSquare,
    Play,
    Radio,
    Sparkles,
    Users,
    Zap,
} from 'lucide-react'
import { useStore } from '../../lib/store'

const QUICK_ACTIONS: Array<{ title: string; description: string; href: Route; icon: typeof MessageSquare }> = [
    { title: 'Start a conversation', description: 'Jump into a fresh AI chat with prompts, context, and file attachments.', href: '/chat', icon: MessageSquare },
    { title: 'Open workflows', description: 'Inspect active orchestration, retries, and execution history.', href: '/workflows', icon: GitBranch },
    { title: 'Ask the mentor', description: 'Get guided explanations and learning pathways for the current task.', href: '/mentor', icon: GraduationCap },
    { title: 'Ground new knowledge', description: 'Upload documents and connect them to the knowledge base.', href: '/knowledge', icon: BookOpen },
]

const CAPABILITIES: Array<{ title: string; description: string; href: Route; icon: typeof MessageSquare }> = [
    { title: 'AI chat', description: 'Converse naturally with context-aware assistance.', href: '/chat', icon: MessageSquare },
    { title: 'Workflow orchestration', description: 'Route work through live execution states and retries.', href: '/workflows', icon: GitBranch },
    { title: 'Knowledge base', description: 'Search, ground, and retrieve from indexed documents.', href: '/knowledge', icon: BookOpen },
    { title: 'Skills engine', description: 'Activate the right capability for the task at hand.', href: '/skills', icon: BrainCircuit },
    { title: 'Mentor system', description: 'Get educational guidance and structured explanations.', href: '/mentor', icon: GraduationCap },
    { title: 'Telemetry monitor', description: 'Watch the live health of the platform in one view.', href: '/analytics', icon: Activity },
]

const RECENT_SESSIONS: Array<{ title: string; context: string; href: Route }> = [
    { title: 'Default operator session', context: 'Last updated a few minutes ago', href: '/chat' },
    { title: 'Workflow review', context: 'Monitoring active agent execution', href: '/workflows' },
    { title: 'Knowledge onboarding', context: 'Preparing local retrieval context', href: '/knowledge' },
]

const SUGGESTED_WORKFLOWS: Array<{ title: string; description: string; href: Route }> = [
    { title: 'Research synthesis', description: 'Collect signals, summarize findings, and draft next steps.', href: '/workflows' },
    { title: 'Agent handoff', description: 'Route tasks, retry failed steps, and keep the timeline visible.', href: '/agents' },
]

const TODAY_FOCUS = [
    { label: 'Research', detail: 'Gather fresh context and shape the next decision', progress: 72 },
    { label: 'Execution', detail: 'Keep workflows moving with clear checkpoints', progress: 58 },
    { label: 'Learning', detail: 'Turn progress into a guided explanation path', progress: 84 },
]

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof Activity }) {
    return (
        <div className="workspace-card soft-ring p-4">
            <div className="flex items-start justify-between">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">{label}</div>
                <Icon size={16} className="text-[var(--accent-strong)]" />
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
            <div className="mt-1 text-xs text-[var(--muted)]">{detail}</div>
        </div>
    )
}

export default function HomeWorkspace() {
    const agents = useStore((state) => state.agents)
    const nodes = useStore((state) => state.workflowNodes)
    const metrics = useStore((state) => state.metrics)
    const analytics = useStore((state) => state.analytics)
    const connection = useStore((state) => state.connection)
    const logs = useStore((state) => state.logs)
    const latest = metrics.at(-1)
    const activeAgents = agents.filter((agent) => agent.state === 'active').length
    const activeNodes = nodes.filter((node) => node.data?.status === 'running').length

    return (
        <div className="page-shell space-y-6">
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)]/80 px-6 py-8 shadow-[0_24px_80px_rgba(2,6,23,0.35)] sm:px-8 lg:px-10 lg:py-10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(103,84,200,0.3),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.2),transparent_40%)]" />
                <div className="absolute inset-y-0 right-0 hidden w-56 bg-[radial-gradient(circle,rgba(255,255,255,0.15),transparent_70%)] blur-3xl lg:block" />
                <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)]/80 px-3 py-1.5 text-xs font-medium text-[var(--accent-strong)]">
                            <Sparkles size={14} /> Your premium AI operating workspace
                        </div>
                        <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Build your future with AI-guided learning and career intelligence.</h2>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">Discover career paths, learn in-demand skills, build projects, and receive personalized mentorship in one AI workspace.</p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <Link href={'/career-roadmap' as Route} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[var(--accent)] px-5 text-sm font-medium text-white transition hover:opacity-90">
                                <GraduationCap size={17} /> Start Career Analysis
                            </Link>
                            <Link href="/chat" className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background)]/80 px-5 text-sm font-medium transition hover:border-[var(--border-strong)]">
                                <MessageSquare size={16} /> Open AI Chat
                            </Link>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                            {['Explain this platform', 'Plan a workflow', 'Ground a knowledge base', 'Review active agents'].map((prompt) => (
                                <Link key={prompt} href="/chat" className="rounded-full border border-[var(--border)] bg-[var(--surface)]/70 px-3 py-1.5 text-sm text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]">{prompt}</Link>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface)]/80 p-4 backdrop-blur">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold">Command mode</div>
                                <div className="mt-1 text-xs text-[var(--muted)]">Press Ctrl/Cmd + K to jump anywhere</div>
                            </div>
                            <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">Live</div>
                        </div>
                        <button type="button" className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)]/70 px-3 py-3 text-left text-sm text-[var(--muted)] transition hover:border-[var(--border-strong)]">
                            <Compass size={16} className="text-[var(--accent-strong)]" />
                            <span>Search chats, workflows, knowledge, and models</span>
                        </button>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/70 p-3 text-sm">
                                <div className="text-[var(--muted)]">Realtime</div>
                                <div className="mt-1 font-semibold">{connection.status === 'connected' ? 'Connected' : connection.status}</div>
                            </div>
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/70 p-3 text-sm">
                                <div className="text-[var(--muted)]">Session state</div>
                                <div className="mt-1 font-semibold">Restorable locally</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            <section aria-label="Quick actions" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon
                    return (
                        <motion.div key={action.title} whileHover={{ y: -4, scale: 1.01, boxShadow: '0 18px 44px rgba(15, 23, 42, 0.18)' }} transition={{ type: 'spring', stiffness: 240, damping: 24 }}>
                            <Link href={action.href} className="workspace-card workspace-card-hover soft-ring block p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                                        <Icon size={18} />
                                    </div>
                                    <ArrowRight size={15} className="mt-1 text-[var(--muted)]" />
                                </div>
                                <div className="mt-4 text-sm font-semibold">{action.title}</div>
                                <div className="mt-2 text-sm leading-6 text-[var(--muted)]">{action.description}</div>
                            </Link>
                        </motion.div>
                    )
                })}
            </section>

            <section className="workspace-card soft-ring p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="page-kicker">Today’s focus</div>
                        <h3 className="mt-1 text-xl font-semibold tracking-tight">Keep the next best action in view</h3>
                    </div>
                    <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">Adaptive</div>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface-2)]/70 p-4">
                        {TODAY_FOCUS.map((item) => (
                            <div key={item.label} className="mt-3 first:mt-0">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{item.label}</span>
                                    <span className="text-[var(--muted)]">{item.progress}%</span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.progress}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} className="h-full rounded-full bg-[var(--accent)]" />
                                </div>
                                <div className="mt-2 text-sm text-[var(--muted)]">{item.detail}</div>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface)]/80 p-4">
                        <div className="text-sm font-semibold">Operator checklist</div>
                        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                            <li>• Open a chat and turn context into a concrete next step.</li>
                            <li>• Review active workflows before handing work to agents.</li>
                            <li>• Use mentor or knowledge surfaces when the path is unclear.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section aria-label="Student metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Learning streak" value={(analytics as any)?.learningStreak ?? '0d'} detail="Days in a row" icon={Sparkles} />
                <Metric label="Roadmap progress" value={(analytics as any)?.roadmapProgress ? `${(analytics as any).roadmapProgress}%` : '—'} detail="Current plan completion" icon={GraduationCap} />
                <Metric label="Recommended skills" value={(analytics as any)?.recommendedSkillsCount ?? '—'} detail="Personalized suggestions" icon={BrainCircuit} />
                <Metric label="Active projects" value={(analytics as any)?.activeProjects ?? '—'} detail="Projects in progress" icon={GitBranch} />
            </section>

            <section className="workspace-card soft-ring p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="page-kicker">Capabilities</div>
                        <h3 className="mt-1 text-xl font-semibold tracking-tight">Everything needed for a premium AI workflow</h3>
                    </div>
                    <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)]/70 px-3 py-1.5 text-xs text-[var(--muted)] md:flex">
                        <Cpu size={14} className="text-[var(--accent-strong)]" /> Adaptive stack
                    </div>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {CAPABILITIES.map((capability) => {
                        const Icon = capability.icon
                        return (
                            <motion.div key={capability.title} whileHover={{ y: -3, scale: 1.01 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }}>
                                <Link href={capability.href} className="block rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface-2)]/70 p-4 transition hover:border-[var(--border-strong)]">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]"><Icon size={16} /></span>
                                        {capability.title}
                                    </div>
                                    <div className="mt-3 text-sm leading-6 text-[var(--muted)]">{capability.description}</div>
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                    <section className="workspace-card soft-ring p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="page-kicker">Suggested workflows</div>
                                <h3 className="mt-1 text-xl font-semibold tracking-tight">Launch your next productive flow</h3>
                            </div>
                            <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">Ready</div>
                        </div>
                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                            {SUGGESTED_WORKFLOWS.map((item) => (
                                <Link key={item.title} href={item.href} className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface-2)]/70 p-4 transition hover:border-[var(--border-strong)]">
                                    <div className="text-sm font-semibold">{item.title}</div>
                                    <div className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.description}</div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section className="workspace-card soft-ring p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold"><Activity size={16} className="text-[var(--accent-strong)]" /> AI activity feed</div>
                        <div className="mt-4 space-y-3">
                            {logs.slice(0, 5).map((log) => (
                                <div key={log.id} className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3 text-sm">
                                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${log.severity === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                    <div className="min-w-0">
                                        <div className="truncate text-[var(--text)]">{log.message}</div>
                                        <div className="mt-0.5 text-xs text-[var(--muted)]">{log.source}</div>
                                    </div>
                                </div>
                            ))}
                            {!logs.length && <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/40 p-4 text-center text-sm text-[var(--muted)]">Realtime events will appear here as your backend emits them.</div>}
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="workspace-card soft-ring p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold">System overview</div>
                                <div className="mt-1 text-xs text-[var(--muted)]">Live backend signals</div>
                            </div>
                            <span className={`h-2.5 w-2.5 rounded-full ${connection.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        </div>
                        <dl className="mt-5 space-y-3 text-sm">
                            <div className="flex justify-between"><dt className="text-[var(--muted)]">Tasks completed</dt><dd className="font-medium">{analytics?.tasksCompleted ?? '—'}</dd></div>
                            <div className="flex justify-between"><dt className="text-[var(--muted)]">Tasks pending</dt><dd className="font-medium">{analytics?.tasksPending ?? '—'}</dd></div>
                            <div className="flex justify-between"><dt className="text-[var(--muted)]">GPU utilization</dt><dd className="font-medium">{latest?.gpuPct !== undefined ? `${Math.round(latest.gpuPct)}%` : '—'}</dd></div>
                            <div className="flex justify-between"><dt className="text-[var(--muted)]">Queue depth</dt><dd className="font-medium">{latest?.queue ?? '—'}</dd></div>
                        </dl>
                        <Link href="/model-monitor" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent-strong)]">Open model monitor <ArrowRight size={14} /></Link>
                    </section>

                    <section className="workspace-card soft-ring p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold"><Clock3 size={16} className="text-[var(--accent-strong)]" /> Recent sessions</div>
                        <div className="mt-4 space-y-2">
                            {RECENT_SESSIONS.map((session) => (
                                <Link key={session.title} href={session.href} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-3 text-sm transition hover:border-[var(--border-strong)]">
                                    <div>
                                        <div className="font-medium">{session.title}</div>
                                        <div className="mt-1 text-xs text-[var(--muted)]">{session.context}</div>
                                    </div>
                                    <ArrowRight size={14} className="text-[var(--muted)]" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section className="workspace-card soft-ring p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold"><FileUp size={16} className="text-[var(--accent-strong)]" /> Knowledge & mentor shortcuts</div>
                        <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3">Drop in documents, notes, or research and let the knowledge base stay grounded.</div>
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3">Use the mentor to break down the current workflow into simple, practical learning steps.</div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
