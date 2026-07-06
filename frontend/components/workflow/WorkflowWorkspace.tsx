'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, GitBranch, Play, RefreshCw, RotateCcw, Sparkles } from 'lucide-react'
import RealtimeWorkflowView from './RealtimeWorkflowView'
import { useStore } from '../../lib/store'
import * as api from '../../lib/api'
import { Badge, Button, Input } from '../ui'

const TEMPLATES = [
    { title: 'Research synthesis', prompt: 'Gather fresh context, summarize findings, and produce next steps.', detail: 'Research + synthesis + handoff' },
    { title: 'Delivery review', prompt: 'Inspect recent workflow events, flag failures, and outline recovery steps.', detail: 'Monitor + retry + report' },
    { title: 'Learning path', prompt: 'Build a step-by-step learning roadmap from the current workspace context.', detail: 'Mentor + knowledge + plan' },
]

export default function WorkflowWorkspace() {
    const nodes = useStore((state) => state.workflowNodes)
    const logs = useStore((state) => state.logs)
    const [goal, setGoal] = useState('')
    const [workflowId, setWorkflowId] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [notice, setNotice] = useState<string | null>(null)
    const counts = useMemo(() => ({
        running: nodes.filter((node) => node.data.status === 'running').length,
        done: nodes.filter((node) => node.data.status === 'done').length,
        failed: nodes.filter((node) => node.data.status === 'failed').length,
    }), [nodes])

    async function execute(event: FormEvent) {
        event.preventDefault()
        if (!goal.trim()) return
        setSubmitting(true)
        setNotice(null)
        try {
            const result = await api.executeWorkflow(goal.trim())
            if (result.error) throw new Error(result.error)
            setWorkflowId(result.workflow_id ?? '')
            setNotice(result.workflow_id ? `Workflow ${result.workflow_id} queued.` : 'Workflow queued.')
            setGoal('')
        } catch (error) {
            setNotice(error instanceof Error ? error.message : 'Unable to start workflow')
        } finally {
            setSubmitting(false)
        }
    }

    async function retry(nodeId: string) {
        if (!workflowId) {
            setNotice('Start a workflow in this view before retrying a node.')
            return
        }
        try {
            await api.retryWorkflowNode(workflowId, nodeId)
            setNotice(`Retry requested for ${nodeId}.`)
        } catch (error) {
            setNotice(error instanceof Error ? error.message : 'Retry failed')
        }
    }

    return (
        <div className="page-shell">
            <div className="page-heading flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="page-kicker">Orchestration</div>
                    <h2 className="page-title">Workflow orchestration</h2>
                    <p className="page-description">Guide the orchestrator with a goal, inspect the live DAG, and recover failed steps without losing the execution trail.</p>
                </div>
                <form onSubmit={execute} className="flex w-full max-w-xl gap-2 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)]/80 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
                    <Input value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Describe a workflow goal…" className="min-w-0 flex-1 border-0 bg-transparent px-3 shadow-none" />
                    <Button type="submit" variant="primary" size="md" disabled={submitting || !goal.trim()}>
                        {submitting ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />} Run
                    </Button>
                </form>
            </div>

            {notice && <div role="status" className="mb-4 rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface-2)]/70 px-4 py-3 text-sm">{notice}</div>}

            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="workspace-card soft-ring flex items-center gap-3 p-4"><Activity size={18} className="text-amber-500" /><div><div className="text-xl font-semibold">{counts.running}</div><div className="text-xs text-[var(--muted)]">Running</div></div></div>
                <div className="workspace-card soft-ring flex items-center gap-3 p-4"><CheckCircle2 size={18} className="text-emerald-500" /><div><div className="text-xl font-semibold">{counts.done}</div><div className="text-xs text-[var(--muted)]">Complete</div></div></div>
                <div className="workspace-card soft-ring flex items-center gap-3 p-4"><AlertTriangle size={18} className="text-rose-500" /><div><div className="text-xl font-semibold">{counts.failed}</div><div className="text-xs text-[var(--muted)]">Needs attention</div></div></div>
            </div>

            <div className="mb-4 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)]/80 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <Sparkles size={15} className="text-[var(--accent-strong)]" /> Workflow studio
                </div>
                <div className="mt-2 text-sm leading-6 text-[var(--muted)]">Use templates to launch structured runs, then monitor execution in real time as the node graph updates.</div>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-3">
                {TEMPLATES.map((template) => <button key={template.title} onClick={() => setGoal(template.prompt)} className="workspace-card workspace-card-hover p-4 text-left"><div className="text-sm font-semibold">{template.title}</div><div className="mt-1 text-sm text-[var(--muted)]">{template.detail}</div></button>)}
            </div>

            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
                <RealtimeWorkflowView />
                <aside className="workspace-card soft-ring overflow-hidden">
                    <div className="border-b border-[var(--border)] p-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-semibold"><GitBranch size={16} className="text-[var(--accent-strong)]" /> Execution log</div>
                            <Badge>Realtime</Badge>
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted)]">{workflowId ? `Run ${workflowId}` : 'Current event stream'}</div>
                    </div>
                    <div className="max-h-[360px] space-y-1 overflow-y-auto p-3">
                        {nodes.filter((node) => node.data.status === 'failed').map((node) => (
                            <div key={node.id} className="mb-2 rounded-[1rem] border border-rose-500/20 bg-rose-500/5 p-3 text-xs">
                                <div className="font-medium">{node.data.label}</div>
                                <button onClick={() => retry(node.id)} className="mt-2 flex items-center gap-1 text-rose-500"><RotateCcw size={12} /> Retry node</button>
                            </div>
                        ))}
                        {logs.slice(0, 18).map((log) => (
                            <div key={log.id} className="flex gap-2 rounded-lg px-2 py-2 text-xs hover:bg-[var(--surface-2)]">
                                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${log.severity === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                <div className="min-w-0"><div className="break-words">{log.message}</div><div className="mt-0.5 text-[var(--muted)]">{log.source}</div></div>
                            </div>
                        ))}
                        {!logs.length && <div className="p-6 text-center text-xs text-[var(--muted)]">Execution events will appear here.</div>}
                    </div>
                </aside>
            </div>
        </div>
    )
}
