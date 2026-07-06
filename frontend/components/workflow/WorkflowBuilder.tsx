'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    AlertTriangle,
    BookOpen,
    Bot,
    Briefcase,
    CheckCircle2,
    ClipboardCheck,
    Download,
    FileText,
    GitBranch,
    GraduationCap,
    Loader2,
    Play,
    RefreshCw,
    RotateCcw,
    Save,
    Sparkles,
} from 'lucide-react'
import AgentActivityPanel from '../AgentActivityPanel'
import { Badge, Button, Card } from '../ui'
import * as api from '../../lib/api'
import { useStore } from '../../lib/store'
import type { AgentActivity, RealtimeLogEvent } from '../../lib/types'

const templateIcons: Record<string, typeof GraduationCap> = {
    career_roadmap: GraduationCap,
    resume_review: FileText,
    project_builder: Briefcase,
    interview_prep: ClipboardCheck,
    knowledge_summary: BookOpen,
    debugging: GitBranch,
}

const localTemplates: api.WorkflowTemplate[] = [
    {
        id: 'career_roadmap',
        name: 'Career Roadmap Workflow',
        description: 'Turn a goal into phases, milestones, projects, and interview preparation.',
        required_input: 'Target role, current skills, and timeframe',
        steps: [
            { id: 'goal-agent', agent: 'Requirement Agent', task: 'Clarify goals and constraints.' },
            { id: 'career-agent', agent: 'Career Agent', task: 'Map skill gaps and role expectations.' },
            { id: 'mentor-agent', agent: 'Mentor Agent', task: 'Create milestones and next actions.' },
        ],
    },
    {
        id: 'resume_review',
        name: 'Resume Review Workflow',
        description: 'Improve ATS fit, missing keywords, bullets, and summary positioning.',
        required_input: 'Resume text or profile summary plus target role',
        steps: [
            { id: 'requirement-agent', agent: 'Requirement Agent', task: 'Understand the target role.' },
            { id: 'resume-agent', agent: 'Resume Agent', task: 'Review ATS alignment.' },
            { id: 'mentor-agent', agent: 'Mentor Agent', task: 'Rewrite bullets and next actions.' },
        ],
    },
    {
        id: 'project_builder',
        name: 'Project Builder Workflow',
        description: 'Generate project requirements, architecture, implementation plan, debugging, and run guide.',
        required_input: 'Project idea, target users, stack, and must-have features',
        steps: [
            { id: 'requirement-agent', agent: 'Requirement Agent', task: 'Collect project requirements.' },
            { id: 'architecture-agent', agent: 'Architecture Agent', task: 'Design architecture and data flow.' },
            { id: 'frontend-agent', agent: 'Frontend Agent', task: 'Plan screens and states.' },
            { id: 'backend-agent', agent: 'Backend Agent', task: 'Plan APIs and storage.' },
            { id: 'debug-agent', agent: 'Debug Agent', task: 'Prepare debugging strategy.' },
            { id: 'mentor-agent', agent: 'Mentor Agent', task: 'Explain run and presentation steps.' },
        ],
    },
    {
        id: 'interview_prep',
        name: 'Interview Prep Workflow',
        description: 'Practice technical and behavioral interviews with focused feedback.',
        required_input: 'Target role, interview date, strengths, and weak areas',
        steps: [
            { id: 'requirement-agent', agent: 'Requirement Agent', task: 'Collect interview context.' },
            { id: 'mentor-agent', agent: 'Mentor Agent', task: 'Generate practice plan.' },
            { id: 'debug-agent', agent: 'Debug Agent', task: 'Identify weak spots.' },
        ],
    },
    {
        id: 'knowledge_summary',
        name: 'Knowledge Summary Workflow',
        description: 'Summarize documents and notes into study actions and recall questions.',
        required_input: 'Topic, document summary, notes, or learning material',
        steps: [
            { id: 'knowledge-agent', agent: 'Knowledge Agent', task: 'Extract concepts.' },
            { id: 'planning-agent', agent: 'Planning Agent', task: 'Create study plan.' },
            { id: 'mentor-agent', agent: 'Mentor Agent', task: 'Explain the material.' },
        ],
    },
    {
        id: 'debugging',
        name: 'Debugging Workflow',
        description: 'Analyze logs, identify causes, and produce a fix plan.',
        required_input: 'Error message, relevant code, and what you tried',
        steps: [
            { id: 'requirement-agent', agent: 'Requirement Agent', task: 'Understand failure context.' },
            { id: 'debug-agent', agent: 'Debug Agent', task: 'Find root cause and fix.' },
            { id: 'mentor-agent', agent: 'Mentor Agent', task: 'Explain prevention steps.' },
        ],
    },
]

function statusLabel(status?: string) {
    if (status === 'completed') return 'completed'
    if (status === 'running') return 'running'
    if (status === 'retrying') return 'retrying'
    if (status === 'failed') return 'failed'
    return 'pending'
}

function statusClasses(status?: string) {
    const value = statusLabel(status)
    if (value === 'completed') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-200'
    if (value === 'running' || value === 'retrying') return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-600 dark:text-cyan-200'
    if (value === 'failed') return 'border-rose-400/30 bg-rose-400/10 text-rose-600 dark:text-rose-200'
    return 'border-border bg-secondary text-muted-foreground'
}

function defaultGoal(templateId: string) {
    if (templateId === 'project_builder') return 'Build an e-commerce web application'
    if (templateId === 'career_roadmap') return 'Create my AI/ML roadmap for the next 12 weeks'
    if (templateId === 'resume_review') return 'Review my resume for an entry-level AI engineer role'
    if (templateId === 'interview_prep') return 'Prepare me for a full-stack developer interview'
    if (templateId === 'knowledge_summary') return 'Summarize my machine learning notes into a study plan'
    return 'Debug this error and explain how to fix it'
}

function downloadText(filename: string, text: string) {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}

export default function WorkflowBuilder() {
    const params = useSearchParams()
    const requestedTemplate = params.get('template')
    const [templates, setTemplates] = useState<api.WorkflowTemplate[]>(localTemplates)
    const [selectedId, setSelectedId] = useState(requestedTemplate || 'project_builder')
    const selectedTemplate = templates.find(template => template.id === selectedId) || templates[0]
    const [goal, setGoal] = useState(defaultGoal(selectedTemplate.id))
    const [run, setRun] = useState<api.WorkflowRun | null>(null)
    const [running, setRunning] = useState(false)
    const [notice, setNotice] = useState('')
    const [saved, setSaved] = useState(false)
    const connection = useStore(state => state.connection)
    const logs = useStore(state => state.logs)
    const setWorkflow = useStore(state => state.setWorkflow)

    useEffect(() => {
        api.getWorkflowTemplates()
            .then(data => {
                if (Array.isArray(data) && data.length) setTemplates(data)
            })
            .catch(() => setNotice('Live updates are temporarily unavailable. Your workflow will continue using standard updates.'))
    }, [])

    useEffect(() => {
        if (!requestedTemplate) return
        setSelectedId(requestedTemplate)
    }, [requestedTemplate])

    useEffect(() => {
        if (!selectedTemplate || run) return
        setGoal(defaultGoal(selectedTemplate.id))
    }, [selectedTemplate, run])

    useEffect(() => {
        if (!run?.workflow_id || run.status === 'completed' || run.status === 'failed') return
        const timer = setInterval(async () => {
            try {
                const next = await api.getWorkflowStatus(run.workflow_id)
                setRun(next)
                if (next.nodes && next.edges) setWorkflow(next.nodes, next.edges)
                if (next.status === 'completed' || next.status === 'failed') {
                    setRunning(false)
                    clearInterval(timer)
                }
            } catch {
                setNotice('Live updates are temporarily unavailable. Your workflow will continue using standard updates.')
            }
        }, 900)
        return () => clearInterval(timer)
    }, [run?.workflow_id, run?.status, setWorkflow])

    const activeSteps: api.WorkflowStep[] = run?.steps?.length
        ? run.steps
        : selectedTemplate.steps.map(step => ({ ...step, status: 'pending', progress: 0, message: step.task }))

    const panelAgents: AgentActivity[] = activeSteps.map(step => ({
        id: step.id,
        name: step.agent,
        state: step.status === 'completed' ? 'completed' : step.status === 'failed' ? 'error' : step.status === 'running' || step.status === 'retrying' ? 'active' : 'idle',
        task: step.message || step.task,
        progress: step.progress || 0,
        updatedAt: new Date().toISOString(),
    }))

    const workflowLogs: RealtimeLogEvent[] = useMemo(() => {
        const workflowId = run?.workflow_id
        return logs
            .filter(log => !workflowId || log.group === workflowId || log.source.includes('Agent') || log.source === 'Workflow')
            .slice(0, 12)
    }, [logs, run?.workflow_id])

    async function runWorkflow() {
        if (!goal.trim()) return
        setRunning(true)
        setSaved(false)
        setNotice('')
        setRun({
            workflow_id: '',
            template_id: selectedTemplate.id,
            workflow_name: selectedTemplate.name,
            description: selectedTemplate.description,
            required_input: selectedTemplate.required_input,
            goal,
            status: 'queued',
            progress: 0,
            current_step: 'Starting',
            steps: selectedTemplate.steps.map(step => ({ ...step, status: 'pending', progress: 0 })),
            result: '',
        })
        try {
            const response = await api.executeWorkflow(goal.trim(), 'default', selectedTemplate.id)
            if (response.error) throw new Error(response.error)
            if (response.workflow) {
                setRun(response.workflow)
                if (response.workflow.nodes && response.workflow.edges) setWorkflow(response.workflow.nodes, response.workflow.edges)
            } else if (response.workflow_id) {
                const status = await api.getWorkflowStatus(response.workflow_id)
                setRun(status)
            }
        } catch (error) {
            setRunning(false)
            const message = error instanceof Error ? error.message : 'Unable to start workflow.'
            setNotice(message.includes('LM Studio') ? 'AI model is not connected. Please start LM Studio and load your model.' : message)
        }
    }

    async function retryStep(stepId: string) {
        if (!run?.workflow_id) return
        setNotice('')
        try {
            const response = await api.retryWorkflowNode(run.workflow_id, stepId)
            if (response.workflow) setRun(response.workflow)
        } catch {
            setNotice('That step could not be retried. Please run the workflow again.')
        }
    }

    function saveResult() {
        if (!run?.result) return
        const savedRuns = JSON.parse(localStorage.getItem('student-ai:saved-workflows') || '[]')
        localStorage.setItem('student-ai:saved-workflows', JSON.stringify([{ id: run.workflow_id, name: run.workflow_name, goal: run.goal, result: run.result, savedAt: Date.now() }, ...savedRuns].slice(0, 12)))
        setSaved(true)
    }

    const progress = run?.progress || 0
    const realtimeOk = connection.status === 'connected'

    return (
        <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/5 md:p-8">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-4xl">
                        <Badge className="border-cyan-400/25 bg-cyan-400/10 text-cyan-500 dark:text-cyan-200">Agentic workflows</Badge>
                        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">Workflow Builder</h1>
                        <p className="mt-4 text-lg leading-8 text-muted-foreground">Create and run student workflows where specialized agents plan careers, build projects, improve resumes, summarize knowledge, prepare interviews, and debug code.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-2 text-sm ${realtimeOk ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-600 dark:text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-600 dark:text-amber-200'}`}>
                            {realtimeOk ? 'Live updates connected' : 'Standard updates active'}
                        </span>
                    </div>
                </div>
            </section>

            {notice && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-700 dark:text-amber-100">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <span>{notice}</span>
                </div>
            )}

            <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)_360px]">
                <aside className="space-y-4">
                    <Card>
                        <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                            <Sparkles size={19} className="text-cyan-400" />
                            Templates
                        </div>
                        <div className="mt-4 space-y-2">
                            {templates.map(template => {
                                const Icon = templateIcons[template.id] || Bot
                                const active = selectedTemplate.id === template.id
                                return (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => { setSelectedId(template.id); setRun(null); setSaved(false); setGoal(defaultGoal(template.id)) }}
                                        className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5 ${active ? 'border-violet-400/35 bg-violet-400/10' : 'border-border bg-secondary/70 hover:border-[var(--border-strong)]'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-background text-cyan-500"><Icon size={18} /></span>
                                            <span className="min-w-0">
                                                <span className="block truncate font-semibold text-foreground">{template.name}</span>
                                                <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.description}</span>
                                            </span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </Card>

                    <Card>
                        <label className="text-sm font-semibold text-foreground" htmlFor="workflow-goal">Goal or request</label>
                        <textarea
                            id="workflow-goal"
                            value={goal}
                            onChange={event => setGoal(event.target.value)}
                            placeholder={selectedTemplate.required_input}
                            className="mt-3 min-h-[150px] w-full resize-none rounded-2xl border border-border bg-background p-4 text-base leading-7 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cyan-400"
                        />
                        <Button onClick={runWorkflow} disabled={running || !goal.trim()} variant="primary" size="lg" className="mt-4 w-full">
                            {running ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                            Run Workflow
                        </Button>
                    </Card>
                </aside>

                <main className="space-y-5">
                    <Card>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <div className="text-sm text-muted-foreground">Selected workflow</div>
                                <h2 className="mt-1 text-3xl font-semibold text-foreground">{run?.workflow_name || selectedTemplate.name}</h2>
                                <p className="mt-2 max-w-3xl text-base leading-7 text-muted-foreground">{run?.description || selectedTemplate.description}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={runWorkflow} disabled={running || !goal.trim()} variant="secondary">
                                    {running ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                    {run?.workflow_id ? 'Run Again' : 'Start'}
                                </Button>
                                <Button onClick={saveResult} disabled={!run?.result} variant="secondary">
                                    <Save size={16} />
                                    {saved ? 'Saved' : 'Save'}
                                </Button>
                                <Button onClick={() => run?.result && downloadText(`${run.workflow_name.replace(/\s+/g, '-').toLowerCase()}.md`, run.result)} disabled={!run?.result} variant="secondary">
                                    <Download size={16} />
                                    Export
                                </Button>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{run?.current_step || 'Ready to run'}</span>
                                <span className="font-semibold text-foreground">{progress}%</span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-secondary">
                                <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-violet-500 transition-[width] duration-500" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-xl font-semibold text-foreground">Agent steps</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Watch each agent move from pending to running to completed.</p>
                            </div>
                            <Badge>{run?.status || 'ready'}</Badge>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-2">
                            {activeSteps.map((step, index) => (
                                <div key={step.id} className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5 ${statusClasses(step.status)}`}>
                                    <div className="flex items-start gap-3">
                                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-background text-foreground">
                                            {step.status === 'completed' ? <CheckCircle2 size={18} className="text-emerald-500" /> : step.status === 'running' || step.status === 'retrying' ? <Loader2 size={18} className="animate-spin text-cyan-500" /> : index + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="font-semibold text-foreground">{step.agent}</div>
                                                <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">{statusLabel(step.status)}</span>
                                            </div>
                                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.message || step.task}</p>
                                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
                                                <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500 transition-[width]" style={{ width: `${step.progress || 0}%` }} />
                                            </div>
                                            {step.status === 'failed' && (
                                                <button onClick={() => retryStep(step.id)} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground hover:bg-background">
                                                    <RotateCcw size={14} />
                                                    Retry failed step
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-xl font-semibold text-foreground">Final result</h3>
                                <p className="mt-1 text-sm text-muted-foreground">A practical output you can save, export, and continue from.</p>
                            </div>
                            {run?.workflow_id && <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">Run {run.workflow_id.slice(0, 8)}</span>}
                        </div>
                        <div className="min-h-[300px] whitespace-pre-wrap rounded-2xl border border-border bg-background p-5 text-base leading-8 text-foreground">
                            {run?.result || 'Select a template, describe your goal, and run the workflow. The final roadmap, project plan, resume review, summary, interview plan, or debugging guide will appear here.'}
                        </div>
                    </Card>
                </main>

                <AgentActivityPanel
                    agents={panelAgents}
                    logs={workflowLogs}
                    title="Agent Activity"
                    subtitle="Current workflow agents and recent live logs"
                    realtime={realtimeOk}
                />
            </div>
        </div>
    )
}
