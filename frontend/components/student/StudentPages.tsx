'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, BookOpen, Bot, Briefcase, Bug, CheckCircle2, Clock, Copy, Download, FileText, GitBranch, GraduationCap, Layers, Loader2, MessageCircle, PlusCircle, RefreshCw, Rocket, Search, Send, ShieldCheck, Sparkles, Target, Upload, User, X } from 'lucide-react'
import ChatWindow from '../chat/ChatWindow'
import WorkflowPanel from '../workflow/WorkflowPanel'
import RealtimeModelMonitor from '../monitor/RealtimeModelMonitor'
import AgentActivityPanel from '../AgentActivityPanel'
import Timeline from '../timeline'
import { Badge, Button, Card, FeatureCard } from '../ui'
import * as api from '../../lib/api'
import { StudentView } from './types'
import { useStore } from '../../lib/store'

const promptSuggestions = [
    'Create AI/ML Roadmap',
    'Analyze Resume',
    'Suggest Projects',
    'Ask Mentor',
    'Help me prepare for interviews',
    'Build a 30-day study plan',
]

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl border border-border bg-card p-6 text-foreground shadow-xl shadow-black/5 md:p-7 ${className}`}>{children}</motion.div>
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
    return (
        <label className="block">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <textarea value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-[104px] w-full resize-none rounded-2xl border border-border bg-card p-4 text-base leading-7 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent" />
        </label>
    )
}

function CopyButton({ text }: { text: string }) {
    return (
        <button onClick={() => navigator.clipboard?.writeText(text)} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">
            <Copy size={15} />
            Copy
        </button>
    )
}

function fallbackRoadmap(goal: string, skills: string, timeframe: string) {
    const weeks = timeframe || '12 weeks'
    return {
        title: `${goal || 'Career'} Roadmap`,
        summary: `A focused ${weeks} plan based on your current skills: ${skills || 'beginner fundamentals'}.`,
        phases: [
            { title: 'Weeks 1-2: Foundation', detail: 'Strengthen core concepts, tooling, and a daily practice rhythm.', progress: 20 },
            { title: 'Weeks 3-6: Portfolio Build', detail: 'Build two projects with clear READMEs, architecture notes, and demos.', progress: 45 },
            { title: 'Weeks 7-10: Role Depth', detail: 'Add role-specific depth through certifications, system design, and targeted practice.', progress: 70 },
            { title: 'Weeks 11-12: Interview Readiness', detail: 'Practice project stories, technical questions, communication, and applications.', progress: 90 },
        ],
        requiredSkills: ['Programming fundamentals', 'Git/GitHub', 'APIs', 'Data structures', 'Communication'],
        projects: ['AI study planner', 'Resume analyzer', 'Interview practice assistant'],
        certifications: ['Cloud fundamentals', 'Role-specific course certificate', 'Portfolio demo video'],
        interviewPrep: ['Prepare 3 project stories', 'Practice 25 role questions', 'Run weekly mock interviews'],
    }
}

function fallbackProjects(skills: string, interests: string, level: string) {
    const stack = skills || 'React, Python, APIs'
    return [
        {
            title: `${interests || 'AI'} Career Coach`,
            difficulty: level || 'Intermediate',
            time: '2-3 weeks',
            stack,
            problem: 'Students need a guided way to convert career goals into weekly execution and portfolio proof.',
            features: ['Goal intake', 'Roadmap generation', 'Progress tracker', 'Resume bullet export'],
            architecture: ['Next.js UI', 'FastAPI planning endpoint', 'Local persistence', 'Optional LLM provider'],
            folderStructure: ['app/', 'components/student/', 'lib/api.ts', 'backend/api/routers/'],
            githubPlan: ['Create issue list', 'Ship MVP branch', 'Add screenshots and demo video', 'Write deployment notes'],
            steps: ['Design intake form', 'Build generator', 'Store progress', 'Polish README'],
            impact: 'Shows product thinking, API integration, conversational UX, and practical student outcomes.',
        },
        {
            title: 'Smart Resume Analyzer',
            difficulty: level || 'Intermediate',
            time: '10-14 days',
            stack,
            problem: 'Candidates struggle to translate experience into ATS-friendly, impact-focused resume bullets.',
            features: ['Resume upload', 'ATS scoring', 'Bullet rewrites', 'Skills gap report'],
            architecture: ['Document parser', 'Feedback service', 'Preview panel', 'Text export'],
            folderStructure: ['app/resume/', 'components/student/', 'services/', 'backend/knowledge_base/'],
            githubPlan: ['Add sample resumes', 'Document scoring logic', 'Record demo walkthrough'],
            steps: ['Build upload UI', 'Create scoring rubric', 'Generate rewrites', 'Export feedback'],
            impact: 'Demonstrates document processing, scoring logic, and actionable recommendation design.',
        },
    ]
}

function normalizeText(value: unknown) {
    if (!value) return ''
    if (typeof value === 'string') return value
    return JSON.stringify(value, null, 2)
}

function asList(value: unknown, fallback: string[] = []) {
    if (Array.isArray(value)) return value.map(item => String(item)).filter(Boolean)
    if (typeof value === 'string') return value.split(/\n|,/).map(item => item.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean)
    return fallback
}

function clampPercent(value: unknown, fallback = 0) {
    const number = Number(value)
    if (!Number.isFinite(number)) return fallback
    return Math.max(0, Math.min(100, Math.round(number)))
}

function resumeFeedback(profile: string, targetRole: string) {
    return {
        score: profile.trim() ? 78 : 64,
        summary: `Your resume is directionally strong for ${targetRole || 'your target role'}, but it should show clearer outcomes, stronger keywords, and more project impact.`,
        bullets: [
            'Built a full-stack student AI platform that converts career goals into weekly roadmaps, project plans, resume feedback, and interview prep.',
            'Integrated Next.js and FastAPI APIs with timeout handling and local fallbacks to keep AI workflows responsive during backend outages.',
            'Designed student-focused workflows for resume review, project building, knowledge search, and mentor guidance.',
        ],
        skills: ['React', 'Next.js', 'FastAPI', 'Python', 'AI product design', 'API integration', 'Prompt design'],
        improvements: ['Add measurable outcomes to every project bullet', 'Mirror keywords from target job descriptions', 'Move strongest technical projects above older coursework', 'Keep each bullet to one clear impact statement'],
    }
}

export function HomePage({ onPrompt }: { onPrompt: (prompt: string) => void }) {
    const [input, setInput] = useState('')
    const featureCards: Array<{ icon: typeof MessageCircle; title: string; description: string; href: Route; tone: 'violet' | 'cyan' | 'emerald' | 'amber' | 'blue' | 'pink'; actionLabel: string }> = [
        { icon: MessageCircle, title: 'AI Chat', description: 'Ask questions, solve problems, and get detailed explanations across your learning journey.', href: '/chat' as Route, tone: 'violet', actionLabel: 'Start chatting' },
        { icon: Rocket, title: 'Project Builder', description: 'Generate complete applications with architecture, code, debugging, and exportable source files.', href: '/projects' as Route, tone: 'cyan', actionLabel: 'Build a project' },
        { icon: GraduationCap, title: 'Career Roadmap', description: 'Turn a career goal into a personalized plan with milestones, skills, and portfolio proof.', href: '/career-roadmap' as Route, tone: 'emerald', actionLabel: 'Create roadmap' },
        { icon: FileText, title: 'Resume Builder', description: 'Improve resume bullets, match role keywords, and create stronger ATS-friendly career material.', href: '/resume' as Route, tone: 'amber', actionLabel: 'Improve resume' },
        { icon: BookOpen, title: 'Knowledge Base', description: 'Upload PDFs, notes, and documents, then search and learn from your own materials.', href: '/knowledge' as Route, tone: 'blue', actionLabel: 'Open knowledge' },
        { icon: Target, title: 'Progress Tracker', description: 'Plan daily tasks, track weekly progress, and keep momentum across skills and projects.', href: '/progress' as Route, tone: 'pink', actionLabel: 'Track progress' },
    ]
    const steps = [
        { icon: Target, title: 'Tell AI your goal', body: 'Share what you want to learn, build, improve, or prepare for.' },
        { icon: Bot, title: 'Agents plan the best path', body: 'The right workspace tool shapes your goal into a practical next step.' },
        { icon: Rocket, title: 'Build, learn, or improve', body: 'Create projects, roadmaps, resume feedback, study plans, or interview practice.' },
        { icon: CheckCircle2, title: 'Track progress and grow', body: 'Turn guidance into tasks, milestones, and repeatable learning momentum.' },
    ]
    const prompts = [
        'Create my AI/ML roadmap',
        'Build an e-commerce app',
        'Improve my resume',
        'Prepare me for interviews',
        'Explain machine learning',
        'Generate project ideas',
    ]
    const agents = [
        { icon: GraduationCap, title: 'Career Agent', body: 'Maps goals into learning phases, skills, milestones, and portfolio direction.' },
        { icon: Rocket, title: 'Project Agent', body: 'Turns requirements into app ideas, architecture, files, run steps, and iteration plans.' },
        { icon: FileText, title: 'Resume Agent', body: 'Improves bullets, keywords, structure, and role alignment for stronger applications.' },
        { icon: BookOpen, title: 'Knowledge Agent', body: 'Helps you search, summarize, and learn from uploaded notes and documents.' },
        { icon: Bot, title: 'Mentor Agent', body: 'Explains concepts, asks better questions, and guides study or interview practice.' },
        { icon: Bug, title: 'Debug Agent', body: 'Reads logs and error descriptions, then suggests fixes and next diagnostic steps.' },
    ]
    const valueCards = [
        { icon: ShieldCheck, title: 'Private & Local-Friendly', body: 'Designed to work with local AI setups and clear backend status when available.' },
        { icon: GraduationCap, title: 'Built for Students', body: 'Focused on learning goals, career readiness, and practical skill development.' },
        { icon: Rocket, title: 'Project-Based Learning', body: 'Moves beyond advice by helping you build portfolio-worthy applications.' },
        { icon: Briefcase, title: 'Career-Oriented Guidance', body: 'Connects roadmaps, projects, resumes, and interview prep into one workflow.' },
    ]

    function submit(prompt = input) {
        if (!prompt.trim()) return
        onPrompt(prompt.trim())
    }

    return (
        <div className="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-white/10 bg-card px-5 py-16 shadow-2xl shadow-black/10 sm:px-8 lg:px-12 lg:py-24">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(139,92,246,0.25),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.22),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(139,92,246,0.28),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.2),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
                <div className="relative mx-auto max-w-[900px] text-center">
                    <Badge className="border-violet-400/25 bg-violet-500/10 text-violet-300">Student AI Platform</Badge>
                    <h1 className="mx-auto mt-6 text-4xl font-semibold leading-tight text-foreground sm:text-6xl lg:text-7xl">Your AI Workspace for Learning, Building & Career Growth</h1>
                    <p className="mx-auto mt-6 max-w-[880px] text-lg leading-8 text-muted-foreground sm:text-xl">AI agents help you learn new skills, build real projects, improve your resume, plan your career, and achieve your goals - all in one place.</p>

                    <Card className="mx-auto mt-10 max-w-4xl border-white/10 bg-card/90 p-3 shadow-2xl shadow-black/10 backdrop-blur-xl">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <textarea
                                value={input}
                                onChange={event => setInput(event.target.value)}
                                onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() } }}
                                placeholder="What would you like to learn, build, or improve today?"
                                className="min-h-[104px] flex-1 resize-none rounded-2xl border border-border bg-background px-5 py-4 text-lg leading-8 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-cyan-400/20"
                            />
                            <Button onClick={() => submit()} variant="primary" size="lg" className="h-14 bg-cyan-400 text-slate-950 hover:bg-cyan-300" aria-label="Send prompt">
                                <Send size={19} /> Ask AI
                            </Button>
                        </div>
                    </Card>

                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                        {prompts.map(prompt => (
                            <button key={prompt} onClick={() => submit(prompt)} className="rounded-full border border-border bg-background/80 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-cyan-400/50 hover:bg-secondary hover:text-foreground">{prompt}</button>
                        ))}
                    </div>

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link href="/chat" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:opacity-90">
                            <MessageCircle size={18} /> Ask AI
                        </Link>
                        <Link href="/projects" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3 text-base font-semibold text-foreground shadow-xl shadow-black/5 transition hover:-translate-y-0.5 hover:bg-secondary">
                            <Rocket size={18} /> Project Builder
                        </Link>
                        <Link href="/career-roadmap" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 px-6 py-3 text-base font-semibold text-foreground shadow-xl shadow-black/5 transition hover:-translate-y-0.5 hover:bg-secondary">
                            <GraduationCap size={18} /> Career Roadmap
                        </Link>
                    </div>
                </div>
            </motion.section>

            <section>
                <div className="mx-auto max-w-3xl text-center">
                    <Badge>Workspace tools</Badge>
                    <h2 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">Everything students need to learn, build, and prepare</h2>
                    <p className="mt-4 text-base leading-8 text-muted-foreground">Open the exact workflow you need, from quick explanations to complete project generation and progress tracking.</p>
                </div>
                <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {featureCards.map(card => (
                        <FeatureCard key={card.title} icon={card.icon} title={card.title} description={card.description} href={card.href} tone={card.tone} actionLabel={card.actionLabel} />
                    ))}
                </div>
            </section>

            <section>
                <div className="mx-auto max-w-3xl text-center">
                    <Badge>AI agents</Badge>
                    <h2 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">AI Agents Working for You</h2>
                    <p className="mt-4 text-base leading-8 text-muted-foreground">Specialized agents keep each workflow focused, practical, and connected to a real student outcome.</p>
                </div>
                <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {agents.map(agent => {
                        const Icon = agent.icon
                        return (
                            <Card key={agent.title} className="border-white/10 bg-card/80 p-6 backdrop-blur-xl hover:border-violet-400/30 hover:bg-secondary">
                                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-400/15 text-cyan-300 shadow-xl shadow-cyan-400/10">
                                    <Icon size={21} />
                                </span>
                                <h3 className="mt-5 text-xl font-semibold text-foreground">{agent.title}</h3>
                                <p className="mt-3 text-base leading-7 text-muted-foreground">{agent.body}</p>
                            </Card>
                        )
                    })}
                </div>
            </section>

            <section>
                <div className="mx-auto max-w-3xl text-center">
                    <Badge>How it works</Badge>
                    <h2 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">From goal to guided action</h2>
                </div>
                <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-4">
                    {steps.map((step, index) => {
                        const Icon = step.icon
                        return (
                            <Card key={step.title} className="p-6">
                                <div className="flex items-center gap-4">
                                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400 text-zinc-950 shadow-xl shadow-black/20">
                                        <Icon size={22} />
                                    </span>
                                    <span className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Step {index + 1}</span>
                                </div>
                                <h3 className="mt-6 text-xl font-semibold text-foreground">{step.title}</h3>
                                <p className="mt-3 text-base leading-7 text-muted-foreground">{step.body}</p>
                            </Card>
                        )
                    })}
                </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {valueCards.map(card => {
                    const Icon = card.icon
                    return (
                        <Card key={card.title} className="p-6">
                            <Icon className="h-7 w-7 text-cyan-400" />
                            <h3 className="mt-5 text-lg font-semibold text-foreground">{card.title}</h3>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.body}</p>
                        </Card>
                    )
                })}
            </section>
        </div>
    )
}

export function ChatPage() {
    const addMessage = useStore(state => state.addMessage)
    const setMessageComplete = useStore(state => state.setMessageComplete)
    const setMessageError = useStore(state => state.setMessageError)
    const setMessageContent = useStore(state => state.setMessageContent)

    async function sendPrompt(prompt: string) {
        const trimmed = prompt.trim()
        if (!trimmed) return

        const userId = Date.now()
        const assistantId = userId + 1
        addMessage({ id: userId, role: 'user', content: trimmed })
        addMessage({ id: assistantId, role: 'assistant', content: 'Thinking...', pending: true })

        try {
            const result = await api.sendChatMessage(trimmed)
            if (result.error && !result.response) {
                setMessageError(assistantId, result.error)
                return
            }

            const content = normalizeText(result.response)
            setMessageContent(assistantId, content || 'I did not receive a response.')
            setMessageComplete(assistantId)
        } catch (error) {
            setMessageError(assistantId, error instanceof Error ? error.message : String(error))
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:py-8">
            <div className="flex flex-wrap gap-2">
                {['Create my roadmap', 'Review my resume', 'Suggest portfolio projects', 'Mock interview questions'].map(prompt => (
                    <button key={prompt} onClick={() => sendPrompt(prompt)} className="rounded-full border border-border bg-secondary px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                        {prompt}
                    </button>
                ))}
            </div>
            <ChatWindow />
        </div>
    )
}

export function RoadmapPage() {
    const [goal, setGoal] = useState('')
    const [skills, setSkills] = useState('')
    const [timeframe, setTimeframe] = useState('12 weeks')
    const [level, setLevel] = useState('Intermediate')
    const [interests, setInterests] = useState('')
    const [loading, setLoading] = useState(false)
    const [roadmap, setRoadmap] = useState<any>(null)
    const [selectedPhase, setSelectedPhase] = useState(0)
    const [completed, setCompleted] = useState<Record<string, boolean>>({})

    async function generate() {
        setLoading(true)
        const fallback = fallbackRoadmap(goal, skills, timeframe)
        try {
            const result = await api.sendMentorMessage(`Create a career roadmap. Goal: ${goal}. Skills: ${skills}. Timeframe: ${timeframe}. Learning level: ${level}. Interests: ${interests}. Return roadmap phases, weekly plan, required skills, recommended projects, certifications, interview preparation, and progress tracker.`)
            setRoadmap(result.response && typeof result.response === 'object' ? result.response : fallback)
        } catch {
            setRoadmap(fallback)
        } finally {
            setLoading(false)
            setSelectedPhase(0)
        }
    }

    const data = typeof roadmap === 'object' && roadmap ? roadmap : null
    const preview = data || fallbackRoadmap(goal, skills, timeframe)
    const phases = (data?.phases || data?.milestones || preview.phases || []).map((item: any, index: number) => ({
        title: String(item.title || item.name || `Phase ${index + 1}`),
        detail: String(item.detail || item.description || item.summary || 'Complete the recommended learning actions for this phase.'),
        progress: clampPercent(item.progress, Math.min(100, (index + 1) * 20)),
    }))
    const requiredSkills = asList(data?.requiredSkills || data?.required_skills, preview.requiredSkills)
    const recommendedProjects = asList(data?.projects || data?.recommendedProjects || data?.recommended_projects, preview.projects)
    const interviewPrep = asList(data?.interviewPrep || data?.interview_prep, preview.interviewPrep)
    const selected = phases[selectedPhase] || phases[0]
    const checklist = [...requiredSkills.slice(0, 3), ...recommendedProjects.slice(0, 2), ...interviewPrep.slice(0, 2)]
    const completedCount = checklist.filter(item => completed[item]).length
    const roadmapProgress = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0

    return (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
            <Panel>
                <GraduationCap className="mb-4 h-8 w-8 text-cyan-200" />
                <h2 className="text-2xl font-semibold text-foreground">Generate your roadmap</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Tell the mentor your goal, starting point, and timeframe.</p>
                <div className="mt-6 space-y-4">
                    <Field label="Career goal" value={goal} onChange={setGoal} placeholder="Example: AI engineer, frontend developer, data scientist..." />
                    <Field label="Current skills" value={skills} onChange={setSkills} placeholder="Example: Python basics, React, SQL, DSA beginner..." />
                    <label className="block"><span className="text-sm font-medium text-muted-foreground">Timeframe</span><input value={timeframe} onChange={event => setTimeframe(event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background p-4 text-sm text-foreground outline-none focus:border-cyan-300/35" /></label>
                    <label className="block"><span className="text-sm font-medium text-muted-foreground">Learning level</span><input value={level} onChange={event => setLevel(event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background p-4 text-sm text-foreground outline-none focus:border-cyan-300/35" /></label>
                    <Field label="Interests" value={interests} onChange={setInterests} placeholder="Example: AI products, healthcare, fintech, robotics..." />
                    <button onClick={generate} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 px-4 py-4 font-medium text-foreground disabled:opacity-60">{loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}Generate roadmap</button>
                </div>
                <div className="mt-6 rounded-2xl border border-border bg-secondary p-4">
                    <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Your checklist progress</span><span className="text-cyan-100">{roadmapProgress}%</span></div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${roadmapProgress}%` }} /></div>
                    <div className="mt-3 text-xs text-muted-foreground">{completedCount} of {checklist.length || 1} actions completed</div>
                </div>
            </Panel>
            <Panel>
                <div className="mb-6 flex items-center justify-between">
                    <div><h3 className="text-2xl font-semibold text-foreground">{data?.title || preview.title}</h3><p className="mt-2 text-muted-foreground">{data?.summary || preview.summary}</p></div>
                    {data && <CopyButton text={JSON.stringify(data, null, 2)} />}
                </div>
                <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-3">
                    {phases.map((item: any, index: number) => (
                        <button key={item.title || index} onClick={() => setSelectedPhase(index)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedPhase === index ? 'border-cyan-400/40 bg-cyan-300/10' : 'border-border bg-secondary hover:bg-secondary'}`}>
                            <div className="flex items-center justify-between">
                                <div className="font-semibold text-foreground">{item.title}</div>
                                <div className="text-sm text-cyan-200">{item.progress}%</div>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                                <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${item.progress}%` }} />
                            </div>
                        </button>
                    ))}
                    </div>
                    <div className="rounded-3xl border border-border bg-secondary p-5">
                        <div className="text-sm text-muted-foreground">Selected phase</div>
                        <h4 className="mt-2 text-xl font-semibold text-foreground">{selected?.title || 'Generate a roadmap'}</h4>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">{selected?.detail || 'Fill the form and generate a plan to see your current focus.'}</p>
                        <div className="mt-5 space-y-2">
                            {checklist.map(item => (
                                <label key={item} className="flex cursor-pointer items-start gap-3 rounded-2xl bg-secondary p-3 text-sm text-muted-foreground">
                                    <input type="checkbox" checked={Boolean(completed[item])} onChange={event => setCompleted(state => ({ ...state, [item]: event.target.checked }))} className="mt-1" />
                                    <span className={completed[item] ? 'text-muted-foreground line-through' : ''}>{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {[
                        ['Required skills', requiredSkills],
                        ['Recommended projects', recommendedProjects],
                        ['Interview prep', interviewPrep],
                    ].map(([title, items]) => (
                        <div key={String(title)} className="rounded-2xl bg-secondary p-4">
                            <div className="text-sm font-semibold text-foreground">{String(title)}</div>
                            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{(items as string[]).map(item => <li key={item}>- {item}</li>)}</ul>
                        </div>
                    ))}
                </div>
            </Panel>
        </div>
    )
}

export function ProjectsPage() {
    const [techStack, setTechStack] = useState('')
    const [domain, setDomain] = useState('')
    const [targetRole, setTargetRole] = useState('')
    const [level, setLevel] = useState('Intermediate')
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [savedProjects, setSavedProjects] = useState<any[]>([])
    const [activeProject, setActiveProject] = useState(0)
    const [doneSteps, setDoneSteps] = useState<Record<string, boolean>>({})

    useEffect(() => {
        try {
            const saved = localStorage.getItem('student-ai:saved-projects')
            if (saved) setSavedProjects(JSON.parse(saved))
        } catch {
            setSavedProjects([])
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('student-ai:saved-projects', JSON.stringify(savedProjects))
    }, [savedProjects])

    async function generate() {
        setLoading(true)
        try {
            const result = await api.buildProjectWorkflow({ techStack, domain, targetRole, skills: techStack, interests: domain, companies: targetRole, level })
            setProjects(Array.isArray(result.projects) ? result.projects : fallbackProjects(techStack, domain, level))
            setActiveProject(0)
            setDoneSteps({})
        } catch {
            setProjects(fallbackProjects(techStack, domain, level))
        } finally {
            setLoading(false)
        }
    }

    function saveProject(project: any) {
        setSavedProjects(items => items.some(item => item.title === project.title) ? items : [{ ...project, savedAt: new Date().toISOString() }, ...items].slice(0, 8))
    }

    const selectedProject = projects[activeProject]
    const selectedSteps = asList(selectedProject?.steps || selectedProject?.implementationSteps || selectedProject?.implementation_steps, ['Define MVP scope', 'Build core UI', 'Connect backend API', 'Write README and demo'])
    const selectedProgress = selectedSteps.length ? Math.round((selectedSteps.filter(step => doneSteps[`${selectedProject?.title}:${step}`]).length / selectedSteps.length) * 100) : 0

    return (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
            <div className="space-y-5">
                <Panel>
                    <Briefcase className="mb-4 h-8 w-8 text-cyan-200" />
                    <h2 className="text-2xl font-semibold text-foreground">Projects Lab</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Generate portfolio projects, save the strongest ideas, and track the build steps you can show on GitHub.</p>
                    <div className="mt-6 space-y-4">
                        <Field label="Skill level" value={level} onChange={setLevel} placeholder="Beginner, intermediate, advanced..." />
                        <Field label="Domain" value={domain} onChange={setDomain} placeholder="Healthtech, finance, AI, edtech..." />
                        <Field label="Target role" value={targetRole} onChange={setTargetRole} placeholder="AI engineer, frontend developer..." />
                        <Field label="Tech stack" value={techStack} onChange={setTechStack} placeholder="React, Python, FastAPI, SQL..." />
                        <button onClick={generate} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 px-4 py-4 font-medium text-foreground disabled:opacity-60">{loading ? <Loader2 size={17} className="animate-spin" /> : <PlusCircle size={17} />}Generate projects</button>
                    </div>
                </Panel>
                <Panel>
                    <div className="flex items-center justify-between"><div className="text-sm font-semibold text-foreground">Saved projects</div><div className="text-xs text-muted-foreground">{savedProjects.length}</div></div>
                    <div className="mt-4 space-y-2">
                        {savedProjects.length ? savedProjects.map(project => <div key={project.title} className="rounded-2xl bg-secondary p-3 text-sm"><div className="font-medium text-foreground">{project.title}</div><div className="mt-1 text-muted-foreground">{project.difficulty || level} - {project.time || '2 weeks'}</div></div>) : <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Save generated ideas here.</div>}
                    </div>
                </Panel>
            </div>
            <div className="space-y-5">
                {projects.length ? (
                    <>
                        <div className="flex flex-wrap gap-2">{projects.map((project, index) => <button key={project.title || index} onClick={() => setActiveProject(index)} className={`rounded-full border px-4 py-2 text-sm transition ${activeProject === index ? 'border-cyan-400/40 bg-cyan-300/10 text-cyan-100' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'}`}>{project.title || `Project ${index + 1}`}</button>)}</div>
                        <Panel>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div><div className="text-2xl font-semibold text-foreground">{selectedProject.title}</div><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{selectedProject.problem || selectedProject.impact}</p></div>
                                <button onClick={() => saveProject(selectedProject)} className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground hover:bg-secondary">Save project</button>
                            </div>
                            <div className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                                <div className="rounded-2xl bg-secondary p-4"><Clock size={16} className="mb-2 text-cyan-200" />{selectedProject.time || '2-3 weeks'}</div>
                                <div className="rounded-2xl bg-secondary p-4"><GitBranch size={16} className="mb-2 text-cyan-200" />{selectedProject.stack || techStack || 'Student stack'}</div>
                                <div className="rounded-2xl bg-secondary p-4"><Target size={16} className="mb-2 text-cyan-200" />{selectedProgress}% build progress</div>
                            </div>
                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                                {[
                                    ['Features', asList(selectedProject.features)],
                                    ['Architecture', asList(selectedProject.architecture)],
                                    ['Folder structure', asList(selectedProject.folderStructure || selectedProject.folder_structure)],
                                    ['GitHub plan', asList(selectedProject.githubPlan || selectedProject.github_plan)],
                                ].map(([title, items]) => <div key={String(title)} className="rounded-2xl bg-secondary p-4"><div className="text-sm font-semibold text-foreground">{String(title)}</div><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{(items as string[]).map(item => <li key={item}>- {item}</li>)}</ul></div>)}
                            </div>
                            <div className="mt-5 rounded-2xl border border-border p-4">
                                <div className="mb-3 flex items-center justify-between text-sm"><span className="font-semibold text-foreground">Build checklist</span><span className="text-cyan-100">{selectedProgress}%</span></div>
                                <div className="space-y-2">{selectedSteps.map(step => { const key = `${selectedProject?.title}:${step}`; return <label key={step} className="flex cursor-pointer gap-3 rounded-xl bg-secondary p-3 text-sm text-muted-foreground"><input type="checkbox" checked={Boolean(doneSteps[key])} onChange={event => setDoneSteps(state => ({ ...state, [key]: event.target.checked }))} />{step}</label> })}</div>
                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${selectedProgress}%` }} /></div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-border p-4 text-sm leading-6 text-muted-foreground"><span className="text-foreground">Resume impact:</span> {selectedProject.resumeImpact || selectedProject.impact || 'Shows problem solving, implementation depth, and portfolio readiness.'}</div>
                        </Panel>
                    </>
                ) : <Panel className="grid min-h-[420px] place-items-center text-center text-muted-foreground">Generate tailored portfolio projects with architecture, tech stack, implementation plan, and resume impact.</Panel>}
            </div>
        </div>
    )
}

export function ResumePage() {
    const [text, setText] = useState('')
    const [profile, setProfile] = useState('')
    const [targetRole, setTargetRole] = useState('')
    const [jobKeywords, setJobKeywords] = useState('React, Python, APIs, projects, internship')
    const [fileName, setFileName] = useState('')
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [checkedKeywords, setCheckedKeywords] = useState<Record<string, boolean>>({})

    async function analyze() {
        setLoading(true)
        const fallback = resumeFeedback(`${profile}\n${text}`, targetRole)
        try {
            const response = await api.detectSkills({ resume: text, profile, targetRole, jobKeywords, mode: 'resume_ats' })
            setResult({ ...fallback, raw: response })
        } catch {
            setResult(fallback)
        } finally {
            setLoading(false)
        }
    }

    async function handleResumeUpload(file?: File) {
        if (!file) return
        setFileName(file.name)
        try {
            const content = await file.text()
            setText(content.slice(0, 30_000))
        } catch {
            setText(current => current || `Uploaded file: ${file.name}. Paste resume text here if the file cannot be read in browser.`)
        }
    }

    const data = result || resumeFeedback(profile, targetRole)
    const keywords = asList(jobKeywords)
    const matchedKeywords = keywords.filter(keyword => {
        const key = keyword.toLowerCase()
        return checkedKeywords[key] || `${text} ${profile}`.toLowerCase().includes(key)
    })
    const keywordScore = keywords.length ? Math.round((matchedKeywords.length / keywords.length) * 100) : 0
    const exportText = `ATS Score: ${data.score}/100\n\n${data.summary}\n\nImproved bullets:\n${data.bullets.map((bullet: string) => `- ${bullet}`).join('\n')}\n\nSkills:\n${data.skills.join(', ')}\n\nImprovements:\n${data.improvements.map((item: string) => `- ${item}`).join('\n')}`

    function downloadText() {
        const blob = new Blob([exportText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'resume-feedback.txt'
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 xl:grid-cols-[440px_minmax(0,1fr)]">
            <Panel>
                <FileText className="mb-4 h-8 w-8 text-cyan-200" />
                <h2 className="text-2xl font-semibold text-foreground">Resume Builder</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Upload or paste your resume, add your profile, then generate ATS-style feedback, stronger bullets, skills, and a clean text export.</p>
                <label className="mt-6 flex cursor-pointer items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-secondary p-6 text-sm text-muted-foreground hover:border-cyan-400/40">
                    <Upload size={18} />
                    {fileName || 'Upload resume file'}
                    <input type="file" className="hidden" accept=".txt,.md,.csv,.json" onChange={event => handleResumeUpload(event.target.files?.[0])} />
                </label>
                <div className="mt-5 space-y-4">
                    <label className="block"><span className="text-sm font-medium text-muted-foreground">Target role</span><input value={targetRole} onChange={event => setTargetRole(event.target.value)} placeholder="AI engineer intern, frontend developer..." className="mt-2 w-full rounded-2xl border border-border bg-background p-4 text-sm text-foreground outline-none" /></label>
                    <Field label="Job keywords" value={jobKeywords} onChange={setJobKeywords} placeholder="Paste important skills from the job description..." />
                    <Field label="Manual profile" value={profile} onChange={setProfile} placeholder="Education, experience, achievements, strongest projects..." />
                    <Field label="Resume text" value={text} onChange={setText} placeholder="Paste your resume content or project bullets..." />
                    <button onClick={analyze} disabled={loading || (!text.trim() && !profile.trim())} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 px-4 py-4 font-medium text-foreground disabled:opacity-60">{loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}Analyze resume</button>
                </div>
            </Panel>
            <Panel>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><div className="text-sm text-muted-foreground">ATS-style score</div><div className="mt-1 text-4xl font-semibold text-foreground">{data.score}/100</div><div className="mt-1 text-sm text-cyan-100">Keyword fit {keywordScore}%</div></div>
                    <div className="flex gap-2"><CopyButton text={exportText} /><button onClick={downloadText} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"><Download size={15} />Text</button></div>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{data.summary}</p>
                <div className="mt-5 rounded-2xl border border-border bg-secondary p-4">
                    <div className="mb-3 flex items-center justify-between text-sm"><span className="font-semibold text-foreground">Job keyword checklist</span><span className="text-cyan-100">{matchedKeywords.length}/{keywords.length || 1}</span></div>
                    <div className="flex flex-wrap gap-2">
                        {keywords.map(keyword => {
                            const key = keyword.toLowerCase()
                            const present = matchedKeywords.includes(keyword)
                            return <button key={keyword} onClick={() => setCheckedKeywords(state => ({ ...state, [key]: !state[key] }))} className={`rounded-full border px-3 py-1 text-xs ${present ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100' : 'border-border bg-secondary text-muted-foreground'}`}>{keyword}</button>
                        })}
                    </div>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl bg-secondary p-4"><div className="text-sm font-semibold text-foreground">Improved bullet points</div><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{data.bullets.map((bullet: string) => <li key={bullet}>- {bullet}</li>)}</ul></div>
                    <div className="rounded-2xl bg-secondary p-4"><div className="text-sm font-semibold text-foreground">Skills section</div><div className="mt-3 flex flex-wrap gap-2">{data.skills.map((skill: string) => <span key={skill} className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">{skill}</span>)}</div></div>
                </div>
                <div className="mt-4 rounded-2xl border border-border p-4"><div className="text-sm font-semibold text-foreground">Priority improvements</div><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{data.improvements.map((item: string) => <li key={item}>- {item}</li>)}</ul></div>
            </Panel>
        </div>
    )
}

export function MentorPage() {
    const [input, setInput] = useState('')
    const [mode, setMode] = useState('Study plan')
    const [messages, setMessages] = useState<Array<{ role: 'student' | 'mentor'; content: string }>>([
        { role: 'mentor', content: 'Tell me your goal, timeline, and what feels confusing. I will turn it into a clear next step.' },
    ])
    const [loading, setLoading] = useState(false)
    const quickPrompts = ['Create a 7-day study plan', 'Explain DSA roadmap', 'Prepare me for interviews', 'Review my project idea']

    async function run(prompt = input) {
        const question = prompt.trim()
        if (!question) return
        setLoading(true)
        setInput('')
        setMessages(items => [...items, { role: 'student', content: question }])
        try {
            const response = await api.sendMentorMessage(`[${mode}] ${question}`)
            setMessages(items => [...items, { role: 'mentor', content: normalizeText(response.response || response) }])
        } catch {
            setMessages(items => [...items, { role: 'mentor', content: 'Here is a calm plan: choose one skill, one project, and one interview habit for the week. Study for 45 minutes daily, build for 60 minutes, and review one solved problem every evening.' }])
        } finally { setLoading(false) }
    }

    return (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
            <Panel>
                <User className="mb-4 h-8 w-8 text-cyan-200" />
                <h2 className="text-2xl font-semibold text-foreground">AI Mentor</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Get study plans, coding guidance, DSA direction, AI/ML guidance, daily goals, and interview prep.</p>
                <div className="mt-6 grid grid-cols-2 gap-2">
                    {['Study plan', 'Coding help', 'Interview prep', 'Project review'].map(item => <button key={item} onClick={() => setMode(item)} className={`rounded-2xl border px-3 py-3 text-sm ${mode === item ? 'border-cyan-400/40 bg-cyan-300/10 text-cyan-100' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'}`}>{item}</button>)}
                </div>
                <div className="mt-6 space-y-2">
                    {quickPrompts.map(prompt => <button key={prompt} onClick={() => run(prompt)} disabled={loading} className="flex w-full items-center justify-between rounded-2xl bg-secondary p-3 text-left text-sm text-muted-foreground hover:bg-secondary"><span>{prompt}</span><Send size={14} /></button>)}
                </div>
            </Panel>
            <Panel>
                <div className="flex items-center justify-between"><div><h3 className="text-xl font-semibold text-foreground">Mentor session</h3><div className="mt-1 text-sm text-muted-foreground">{mode}</div></div><button onClick={() => setMessages([{ role: 'mentor', content: 'Fresh session started. What should we solve first?' }])} className="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary">New session</button></div>
                <div className="mt-5 max-h-[520px] space-y-4 overflow-y-auto pr-2">
                    {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === 'student' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-7 ${message.role === 'student' ? 'bg-cyan-300 text-black' : 'bg-white/[0.05] text-muted-foreground'}`}>{message.content}</div></div>)}
                    {loading && <div className="rounded-3xl bg-white/[0.05] px-4 py-3 text-sm text-muted-foreground">Mentor is thinking...</div>}
                </div>
                <div className="mt-5 flex gap-3">
                    <textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); run() } }} placeholder="Ask for guidance, a study plan, interview prep, or code explanation..." className="min-h-[72px] flex-1 resize-none rounded-2xl border border-border bg-background p-4 text-sm leading-6 text-foreground outline-none" />
                    <button onClick={() => run()} disabled={loading || !input.trim()} className="grid h-[72px] w-[72px] place-items-center rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 text-foreground disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}</button>
                </div>
            </Panel>
        </div>
    )
}

export function KnowledgePage() {
    const [query, setQuery] = useState('')
    const [collection, setCollection] = useState('default')
    const [documents, setDocuments] = useState<Array<{ name: string; topics: string[]; content: string; status: string; size: number; type: string }>>([])
    const [result, setResult] = useState('')
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadMessage, setUploadMessage] = useState('')
    const [uploadError, setUploadError] = useState('')
    const [isDragging, setIsDragging] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState<string>('')
    const maxUploadBytes = 20 * 1024 * 1024
    const acceptedExtensions = ['.pdf', '.txt', '.md']
    const acceptedMimeTypes = ['application/pdf', 'text/plain', 'text/markdown']

    function validateFile(file: File) {
        const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
        if (!acceptedExtensions.includes(extension) && !acceptedMimeTypes.includes(file.type)) {
            return 'Please upload a PDF, TXT, or Markdown file.'
        }
        if (file.size > maxUploadBytes) {
            return 'This file is too large. Please upload a file under 20 MB.'
        }
        return ''
    }

    async function upload(file?: File) {
        if (!file) return
        const validationError = validateFile(file)
        setUploadError('')
        setUploadMessage('')
        setUploadProgress(0)
        if (validationError) {
            setUploadError(validationError)
            return
        }

        setUploading(true)
        const topics = file.name.replace(/\.[^.]+$/, '').split(/[-_\s]+/).filter(Boolean).slice(0, 5)
        let content = ''
        const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
        if (!isPdf) {
            try { content = (await file.text()).slice(0, 40_000) } catch { content = '' }
        }
        const words = content.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) || []
        const extracted = Array.from(new Set(words.filter(word => !['the', 'and', 'for', 'with', 'this', 'that', 'from'].includes(word)))).slice(0, 6)
        const document = {
            name: file.name,
            topics: topics.length ? topics : extracted.length ? extracted : isPdf ? ['pdf'] : ['notes'],
            content,
            status: isPdf ? 'PDF uploaded. Text extraction is pending.' : 'Ready to search locally.',
            size: file.size,
            type: isPdf ? 'PDF' : 'Document',
        }
        setDocuments(items => [document, ...items.filter(item => item.name !== file.name)])
        setSelectedDoc(file.name)
        try {
            const response = await api.uploadKnowledge(file, collection, setUploadProgress)
            const indexed = Number((response as any)?.result?.indexed_chunks ?? 0)
            const nextStatus = isPdf && indexed === 0 ? 'PDF uploaded. Text extraction is pending.' : 'Uploaded and indexed.'
            setDocuments(items => items.map(item => item.name === file.name ? { ...item, status: nextStatus } : item))
            setUploadMessage(nextStatus)
            setUploadProgress(100)
        } catch (error) {
            setDocuments(items => items.map(item => item.name === file.name ? { ...item, status: 'Saved locally. Backend upload failed.' } : item))
            setUploadError(error instanceof Error ? `Upload failed: ${error.message}` : 'Upload failed. The document was kept locally so you can still search its filename and text preview.')
        } finally {
            setUploading(false)
        }
    }

    function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
        event.preventDefault()
        setIsDragging(false)
        upload(event.dataTransfer.files?.[0])
    }

    async function search() {
        setLoading(true)
        try {
            setResult(normalizeText(await api.searchKnowledge(query, collection)))
        } catch {
            const queryWords = query.toLowerCase().split(/\W+/).filter(Boolean)
            const matches = documents.filter(doc => queryWords.some(word => `${doc.name} ${doc.topics.join(' ')} ${doc.content}`.toLowerCase().includes(word)))
            const snippets = matches.slice(0, 3).map(doc => {
                const firstWord = queryWords.find(word => doc.content.toLowerCase().includes(word))
                const index = firstWord ? doc.content.toLowerCase().indexOf(firstWord) : 0
                return `- ${doc.name}: ${doc.content.slice(Math.max(0, index - 80), index + 260).trim() || doc.topics.join(', ')}`
            }).join('\n')
            setResult(matches.length ? `Found ${matches.length} matching document(s).\n\n${snippets}\n\nNext step: ask a narrower question to extract skills, definitions, or action items.` : 'No exact local match yet. Upload notes, resumes, PDFs, or class documents, then ask grounded questions across your materials.')
        } finally { setLoading(false) }
    }
    const topics = Array.from(new Set(documents.flatMap(doc => doc.topics))).slice(0, 12)
    const activeDocument = documents.find(doc => doc.name === selectedDoc) || documents[0]

    return (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
            <Panel>
                <BookOpen className="mb-4 h-8 w-8 text-cyan-200" />
                <h2 className="text-2xl font-semibold text-foreground">Knowledge Base</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Upload documents, search your learning material, extract topics, and ask retrieval-style questions.</p>
                <label className="mt-6 block"><span className="text-sm font-medium text-muted-foreground">Collection</span><input value={collection} onChange={event => setCollection(event.target.value || 'default')} className="mt-2 w-full rounded-2xl border border-border bg-background p-4 text-sm text-foreground outline-none" /></label>
                <label
                    onDragOver={event => { event.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed p-7 text-center text-base transition ${isDragging ? 'border-cyan-300/60 bg-cyan-300/10 text-cyan-100' : 'border-border bg-secondary text-muted-foreground hover:border-cyan-400/40'}`}
                >
                    <Upload className="mb-3" size={26} />
                    <span className="font-semibold text-foreground">Drop a PDF or document here</span>
                    <span className="mt-2 text-sm text-muted-foreground">or click to choose .pdf, .txt, or .md files up to 20 MB</span>
                    <input type="file" className="hidden" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" onChange={event => upload(event.target.files?.[0])} />
                </label>
                {(uploading || uploadMessage || uploadError) && (
                    <div className={`mt-4 rounded-2xl border p-4 text-sm ${uploadError ? 'border-rose-400/30 bg-rose-400/10 text-rose-100' : 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100'}`}>
                        <div className="flex items-center justify-between gap-3">
                            <span>{uploadError || uploadMessage || 'Uploading document...'}</span>
                            {uploading && <span>{uploadProgress}%</span>}
                        </div>
                        {uploading && <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-cyan-300 transition-[width]" style={{ width: `${uploadProgress}%` }} /></div>}
                    </div>
                )}
                <div className="mt-5 space-y-4">
                    <Field label="Ask your knowledge base" value={query} onChange={setQuery} placeholder="What skills are mentioned in my resume? Summarize my notes..." />
                    <button onClick={search} disabled={loading || !query.trim()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 px-4 py-4 font-medium text-foreground disabled:opacity-60">{loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}Search documents</button>
                </div>
            </Panel>
            <div className="space-y-5">
                <Panel>
                    <div className="flex items-center justify-between"><div className="text-sm font-semibold text-foreground">Documents</div><div className="text-xs text-muted-foreground">{documents.length} uploaded</div></div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {documents.length ? documents.map(doc => <button key={doc.name} onClick={() => setSelectedDoc(doc.name)} className={`rounded-2xl p-4 text-left transition ${activeDocument?.name === doc.name ? 'bg-cyan-300/10' : 'bg-secondary hover:bg-secondary'}`}><div className="flex items-start justify-between gap-3"><div className="font-medium text-foreground">{doc.name}</div><span className="rounded-full bg-secondary px-2 py-1 text-xs text-muted-foreground">{doc.type}</span></div><div className="mt-2 text-xs text-muted-foreground">{(doc.size / 1024 / 1024).toFixed(2)} MB - {doc.status}</div><div className="mt-2 flex flex-wrap gap-2">{doc.topics.map(topic => <span key={topic} className="rounded-full bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">{topic}</span>)}</div><div className="mt-3 line-clamp-2 text-xs text-muted-foreground">{doc.content || doc.status}</div></button>) : <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground md:col-span-2">No documents uploaded yet. Upload a PDF, TXT, or Markdown file to start searching.</div>}
                    </div>
                </Panel>
                <Panel>
                    <div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-semibold text-foreground">AI summary and answer</h3>{result && <CopyButton text={result} />}</div>
                    <pre className="min-h-[260px] whitespace-pre-wrap rounded-3xl border border-border bg-background p-5 text-sm leading-7 text-muted-foreground">{result || 'Upload documents and ask a question to get grounded answers. If embeddings are unavailable, local keyword matching keeps search usable.'}</pre>
                    {activeDocument && <div className="mt-4 rounded-2xl bg-secondary p-4"><div className="text-sm font-semibold text-foreground">Selected document preview</div><p className="mt-2 line-clamp-4 text-sm leading-6 text-muted-foreground">{activeDocument.content || activeDocument.status}</p></div>}
                    <div className="mt-4 flex flex-wrap gap-2">{topics.map(topic => <span key={topic} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">{topic}</span>)}</div>
                </Panel>
            </div>
        </div>
    )
}

function AssistantPage({ icon: Icon, title, subtitle, input, setInput, button, loading, onRun, result, upload = false }: any) {
    return (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 xl:grid-cols-[440px_minmax(0,1fr)]">
            <Panel><Icon className="mb-4 h-8 w-8 text-cyan-200" /><h2 className="text-2xl font-semibold text-foreground">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>{upload && <label className="mt-6 flex cursor-pointer items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-secondary p-6 text-sm text-muted-foreground hover:border-cyan-400/40"><Upload size={18} />Upload document<input type="file" className="hidden" onChange={async event => { const file = event.target.files?.[0]; if (file) { try { setInput(`Uploaded: ${file.name}`); await api.uploadKnowledge(file) } catch { setInput(`Uploaded locally: ${file.name}`) } } }} /></label>}<Field label="What should AI help with?" value={input} onChange={setInput} placeholder="Paste context, ask a question, or describe the output you want..." /><button onClick={onRun} disabled={loading || !input.trim()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 px-4 py-4 font-medium text-foreground disabled:opacity-60">{loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}{button}</button></Panel>
            <Panel><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-semibold text-foreground">AI output</h3>{result && <button onClick={() => navigator.clipboard?.writeText(result)} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground"><Copy size={15} />Copy</button>}</div><pre className="min-h-[420px] whitespace-pre-wrap rounded-3xl border border-border bg-background p-5 text-sm leading-7 text-muted-foreground">{result || 'Your generated answer will appear here with actionable next steps.'}</pre></Panel>
        </div>
    )
}

export function WorkflowsPage() {
    const templates = [
        { name: 'Career Roadmap Generator', steps: ['Collect goal', 'Map skills gap', 'Generate phases', 'Create tracker'] },
        { name: 'Resume Review Workflow', steps: ['Parse resume', 'Score ATS fit', 'Rewrite bullets', 'Export feedback'] },
        { name: 'Interview Prep Workflow', steps: ['Pick role', 'Generate questions', 'Practice answers', 'Review gaps'] },
        { name: 'Project Builder Workflow', steps: ['Choose domain', 'Design features', 'Plan architecture', 'Write GitHub tasks'] },
        { name: 'Study Planner Workflow', steps: ['Set goal', 'Split topics', 'Schedule practice', 'Track progress'] },
    ]
    const [active, setActive] = useState(templates[0])
    const [running, setRunning] = useState(false)
    const [progress, setProgress] = useState(0)
    const [result, setResult] = useState('')

    async function run() {
        setRunning(true)
        setResult('')
        setProgress(25)
        try {
            await new Promise(resolve => setTimeout(resolve, 250))
            setProgress(60)
            const response = await api.sendMentorMessage(`Run this student workflow: ${active.name}. Steps: ${active.steps.join(', ')}. Return concise results and next actions.`)
            setProgress(100)
            setResult(String(response.response || `${active.name} completed. Review the steps and continue with the next recommended action.`))
        } finally {
            setRunning(false)
        }
    }

    return (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Panel>
                <Layers className="mb-4 h-8 w-8 text-cyan-200" />
                <h2 className="text-2xl font-semibold text-foreground">Student Workflows</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose a template and run a student-friendly workflow with progress, results, and retry controls.</p>
                <div className="mt-6 space-y-2">{templates.map(template => <button key={template.name} onClick={() => { setActive(template); setProgress(0); setResult('') }} className={`w-full rounded-2xl p-3 text-left text-sm transition ${active.name === template.name ? 'bg-cyan-300/10 text-cyan-100' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}><GitBranch className="mb-2 h-4 w-4" />{template.name}</button>)}</div>
            </Panel>
            <Panel>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div><h3 className="text-2xl font-semibold text-foreground">{active.name}</h3><p className="mt-2 text-sm text-muted-foreground">Run the steps below without exposing raw engineering DAG details.</p></div>
                    <div className="flex gap-2"><button onClick={run} disabled={running} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 px-4 py-3 font-medium text-foreground disabled:opacity-60">{running ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}Run</button><button onClick={run} className="grid h-12 w-12 place-items-center rounded-2xl border border-border text-muted-foreground hover:bg-secondary" aria-label="Retry workflow"><RefreshCw size={17} /></button></div>
                </div>
                <div className="mt-6 space-y-3">{active.steps.map((step, index) => { const threshold = ((index + 1) / active.steps.length) * 100; const done = progress >= threshold; return <div key={step} className="flex items-center gap-3 rounded-2xl border border-border bg-secondary p-4"><span className={`grid h-8 w-8 place-items-center rounded-xl ${done ? 'bg-emerald-300/10 text-emerald-200' : 'bg-secondary text-muted-foreground'}`}>{done ? <CheckCircle2 size={17} /> : index + 1}</span><div><div className="text-sm font-medium text-foreground">{step}</div><div className="text-xs text-muted-foreground">{done ? 'Done' : running ? 'Waiting' : 'Ready'}</div></div></div> })}</div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500 transition-[width]" style={{ width: `${progress}%` }} /></div>
                <pre className="mt-5 min-h-[220px] whitespace-pre-wrap rounded-3xl border border-border bg-background p-5 text-sm leading-7 text-muted-foreground">{result || 'Run the workflow to generate student-focused results and next actions.'}</pre>
            </Panel>
        </div>
    )
}

export function AnalyticsPage() {
    type LearningTask = { id: number; title: string; area: string; minutes: number; priority: 'High' | 'Medium' | 'Low'; done: boolean }
    const defaultTasks: LearningTask[] = [
        { id: 1, title: 'Review today\'s AI/ML roadmap milestone', area: 'AI/ML', minutes: 35, priority: 'High', done: false },
        { id: 2, title: 'Practice 2 Python or DSA problems', area: 'DSA', minutes: 45, priority: 'High', done: false },
        { id: 3, title: 'Improve one project README section', area: 'Projects', minutes: 30, priority: 'Medium', done: false },
        { id: 4, title: 'Rewrite one resume bullet with impact', area: 'Resume', minutes: 20, priority: 'Medium', done: false },
    ]
    const [tasks, setTasks] = useState<LearningTask[]>(defaultTasks)
    const [newTask, setNewTask] = useState('')
    const [newArea, setNewArea] = useState('AI/ML')
    const [newMinutes, setNewMinutes] = useState(30)
    const [hydrated, setHydrated] = useState(false)
    const completedTasks = tasks.filter(task => task.done).length
    const pendingTasks = tasks.length - completedTasks
    const weeklyProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
    const streak = Math.max(1, Math.min(14, 3 + completedTasks))
    const totalMinutes = tasks.reduce((sum, task) => sum + task.minutes, 0)
    const doneMinutes = tasks.filter(task => task.done).reduce((sum, task) => sum + task.minutes, 0)
    const message = weeklyProgress >= 80 ? 'Excellent momentum. Keep the streak alive.' : weeklyProgress >= 50 ? 'Solid progress. One focused block can finish the day strong.' : 'Start small. Complete one high-priority task first.'

    useEffect(() => {
        try {
            const saved = localStorage.getItem('student-ai:progress-tasks')
            if (saved) setTasks(JSON.parse(saved))
        } catch {
            setTasks(defaultTasks)
        } finally {
            setHydrated(true)
        }
    }, [])

    useEffect(() => {
        if (hydrated) localStorage.setItem('student-ai:progress-tasks', JSON.stringify(tasks))
    }, [hydrated, tasks])

    function addTask() {
        if (!newTask.trim()) return
        setTasks(items => [{ id: Date.now(), title: newTask.trim(), area: newArea, minutes: newMinutes, priority: 'Medium', done: false }, ...items])
        setNewTask('')
    }

    const skills = [
        ['AI/ML', 68],
        ['Python', 74],
        ['DSA', 52],
        ['Projects', 61],
        ['Resume', 70],
        ['Interview Prep', 48],
    ] as Array<[string, number]>
    const roadmapPercent = Math.max(weeklyProgress, 42)
    const achievements = [
        { title: 'Learning streak', body: `${streak} days active`, active: streak >= 3 },
        { title: 'Project builder', body: '1 portfolio project in progress', active: tasks.some(task => task.area === 'Projects' && task.done) },
        { title: 'Resume ready', body: 'Resume practice started', active: tasks.some(task => task.area === 'Resume' && task.done) },
    ]

    return (
        <div className="mx-auto max-w-7xl space-y-5">
            <Panel>
                <div className="flex items-center gap-2 text-base text-cyan-200"><BarChart3 size={19} /> Progress Tracker</div>
                <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">Today&apos;s Learning Plan</h2>
                <p className="mt-3 max-w-3xl text-base leading-8 text-muted-foreground">{message}</p>
            </Panel>

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <Panel>
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="text-xl font-semibold text-foreground">Today&apos;s tasks</div>
                            <div className="mt-1 text-sm text-muted-foreground">{doneMinutes}/{totalMinutes} minutes completed</div>
                        </div>
                        <div className="rounded-full bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">{completedTasks}/{tasks.length} complete</div>
                    </div>
                    <div className="space-y-3">
                        {tasks.length ? tasks.map(task => (
                            <div key={task.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary p-4 sm:flex-row sm:items-center">
                                <label className="flex flex-1 cursor-pointer items-start gap-3">
                                    <input type="checkbox" checked={task.done} onChange={event => setTasks(items => items.map(item => item.id === task.id ? { ...item, done: event.target.checked } : item))} className="mt-1 h-5 w-5" />
                                    <span>
                                        <span className={`block text-base font-medium ${task.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</span>
                                        <span className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                                            <span>{task.minutes} min</span>
                                            <span>{task.priority} priority</span>
                                            <span>{task.area}</span>
                                        </span>
                                    </span>
                                </label>
                                <button onClick={() => setTasks(items => items.filter(item => item.id !== task.id))} aria-label="Delete task" className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"><X size={18} /></button>
                            </div>
                        )) : <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">No tasks yet. Add one learning task to start your day.</div>}
                    </div>
                </Panel>

                <Panel>
                    <div className="text-xl font-semibold text-foreground">Add Task</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Add one practical action you can complete today.</p>
                    <div className="mt-5 space-y-3">
                        <input value={newTask} onChange={event => setNewTask(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') addTask() }} placeholder="Example: revise logistic regression notes" className="min-h-12 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground outline-none" />
                        <div className="grid grid-cols-2 gap-3">
                            <select value={newArea} onChange={event => setNewArea(event.target.value)} className="min-h-12 rounded-2xl border border-border bg-background px-4 text-base text-foreground outline-none">
                                {['AI/ML', 'Python', 'DSA', 'Projects', 'Resume', 'Interview Prep'].map(item => <option key={item}>{item}</option>)}
                            </select>
                            <input type="number" min={5} max={180} value={newMinutes} onChange={event => setNewMinutes(Number(event.target.value) || 30)} className="min-h-12 rounded-2xl border border-border bg-background px-4 text-base text-foreground outline-none" />
                        </div>
                        <button onClick={addTask} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-base font-semibold text-black"><PlusCircle size={18} />Add task</button>
                    </div>
                    <div className="mt-6 rounded-2xl bg-secondary p-4">
                        <div className="mb-3 flex items-center justify-between text-sm"><span className="font-semibold text-foreground">Weekly Progress</span><span className="text-cyan-100">{weeklyProgress}%</span></div>
                        <div className="h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${weeklyProgress}%` }} /></div>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                            <div className="rounded-xl bg-secondary p-3"><div className="text-lg font-semibold text-foreground">{completedTasks}</div><div className="text-muted-foreground">Done</div></div>
                            <div className="rounded-xl bg-secondary p-3"><div className="text-lg font-semibold text-foreground">{pendingTasks}</div><div className="text-muted-foreground">Pending</div></div>
                            <div className="rounded-xl bg-secondary p-3"><div className="text-lg font-semibold text-foreground">{streak}</div><div className="text-muted-foreground">Streak</div></div>
                        </div>
                    </div>
                </Panel>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <Panel className="xl:col-span-1">
                    <div className="mb-4 text-xl font-semibold text-foreground">Skills Progress</div>
                    <div className="space-y-4">{skills.map(([skill, value]) => <div key={skill}><div className="mb-2 flex justify-between text-base"><span className="text-muted-foreground">{skill}</span><span className="text-muted-foreground">{value}%</span></div><div className="h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${value}%` }} /></div></div>)}</div>
                </Panel>

                <Panel>
                    <div className="text-xl font-semibold text-foreground">Roadmap Progress</div>
                    <div className="mt-5 rounded-2xl border border-border bg-secondary p-4">
                        <div className="text-sm text-muted-foreground">Current phase</div>
                        <div className="mt-1 text-2xl font-semibold text-foreground">Portfolio Build</div>
                        <div className="mt-4 text-sm text-muted-foreground">Next milestone: publish one project README with screenshots and architecture notes.</div>
                        <div className="mt-5 flex items-center justify-between text-sm"><span className="text-muted-foreground">Completion</span><span className="text-cyan-100">{roadmapPercent}%</span></div>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${roadmapPercent}%` }} /></div>
                    </div>
                </Panel>

                <Panel>
                    <div className="text-xl font-semibold text-foreground">Achievements</div>
                    <div className="mt-5 space-y-3">
                        {achievements.map(item => <div key={item.title} className={`flex items-center gap-3 rounded-2xl p-4 ${item.active ? 'bg-emerald-300/10 text-emerald-100' : 'bg-secondary text-muted-foreground'}`}><CheckCircle2 size={20} /><div><div className="font-semibold">{item.title}</div><div className="text-sm opacity-80">{item.body}</div></div></div>)}
                    </div>
                    <div className="mt-5 rounded-2xl border border-border p-4 text-base leading-7 text-muted-foreground">{message}</div>
                </Panel>
            </div>
        </div>
    )
}

export function SettingsPage() {
    const [advanced, setAdvanced] = useState(false)
    return <div className="mx-auto max-w-7xl space-y-5"><Panel><h2 className="text-2xl font-semibold text-foreground">Settings</h2><p className="mt-2 text-muted-foreground">Manage preferences, model behavior, session persistence, and developer diagnostics.</p><div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">{['Calm guidance', 'Career focused', 'Markdown responses'].map(item => <div key={item} className="flex items-center gap-3 rounded-2xl bg-secondary p-4"><CheckCircle2 className="text-emerald-300" size={18} />{item}</div>)}</div><button onClick={() => setAdvanced(value => !value)} className="mt-6 rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground hover:bg-secondary">Advanced / Developer Mode</button></Panel><AnimatePresence>{advanced && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-5 overflow-hidden"><RealtimeModelMonitor /><WorkflowPanel /><Timeline sessionId="default" /><AgentActivityPanel /></motion.div>}</AnimatePresence></div>
}

export function renderStudentView(view: StudentView, onPrompt: (prompt: string) => void) {
    switch (view) {
        case 'chat': return <ChatPage />
        case 'roadmap': return <RoadmapPage />
        case 'projects': return <ProjectsPage />
        case 'resume': return <ResumePage />
        case 'mentor': return <MentorPage />
        case 'knowledge': return <KnowledgePage />
        case 'workflows': return <WorkflowsPage />
        case 'settings': return <SettingsPage />
        default: return <HomePage onPrompt={onPrompt} />
    }
}

