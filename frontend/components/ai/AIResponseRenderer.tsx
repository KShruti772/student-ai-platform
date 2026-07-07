'use client'

import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Check, ChevronDown, Clipboard, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'

type AIResponseRendererProps = {
    content: unknown
    compact?: boolean
    maxChars?: number
    className?: string
}

function toMarkdown(value: unknown): string {
    if (typeof value === 'string') return value
    if (value === null || value === undefined) return ''
    if (typeof value !== 'object') return String(value)
    const data = value as Record<string, unknown>
    const knownSections = [
        ['Summary', data.summary],
        ['Simple explanation', data.simple],
        ['Technical detail', data.technical],
        ['Why it matters', data.why],
        ['Analogy', data.analogy],
        ['Best practices', data.best_practices],
        ['Common mistakes', data.common_mistakes],
        ['Learning points', data.learning_points],
        ['Next steps', data.next_steps],
        ['Raw', data.raw],
    ].filter(([, body]) => body !== undefined && body !== null && body !== '')

    if (knownSections.length) {
        return knownSections.map(([title, body]) => `## ${title}\n\n${formatBody(body)}`).join('\n\n')
    }
    return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``
}

function formatBody(value: unknown): string {
    if (Array.isArray(value)) return value.map((item) => `- ${String(item)}`).join('\n')
    if (value && typeof value === 'object') return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``
    return String(value)
}

function tryParseJson(markdown: string): unknown | null {
    const fenced = markdown.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
    const raw = fenced || markdown
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start < 0 || end <= start) return null
    try {
        return JSON.parse(raw.slice(start, end + 1))
    } catch {
        return null
    }
}

function classify(markdown: string, parsed: unknown) {
    const lower = markdown.toLowerCase()
    const record = parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null
    if (record && Array.isArray(record.phases)) return 'roadmap'
    if (lower.includes('ats') || lower.includes('resume')) return 'resume'
    if (lower.includes('folder') || lower.includes('architecture') || lower.includes('project')) return 'project'
    if (lower.includes('interview')) return 'interview'
    if (lower.includes('```')) return 'code'
    return 'general'
}

function CodeBlock({ inline, className, children, ...props }: any) {
    const [copied, setCopied] = useState(false)
    const text = String(children).replace(/\n$/, '')
    if (inline) return <code className={className} {...props}>{children}</code>
    return (
        <div className="group relative my-4 overflow-hidden rounded-2xl border border-border bg-background">
            <button
                type="button"
                onClick={() => {
                    navigator.clipboard?.writeText(text)
                    setCopied(true)
                    window.setTimeout(() => setCopied(false), 1400)
                }}
                className="absolute right-2 top-2 z-10 inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card/90 px-2 text-[11px] text-muted-foreground opacity-0 backdrop-blur transition group-hover:opacity-100 focus:opacity-100"
            >
                {copied ? <Check size={13} /> : <Clipboard size={13} />}
                {copied ? 'Copied' : 'Copy'}
            </button>
            <code className={className} {...props}>{children}</code>
        </div>
    )
}

function RoadmapCards({ value }: { value: any }) {
    const phases = Array.isArray(value?.phases) ? value.phases : []
    if (!phases.length) return null
    return (
        <div className="mb-5 space-y-3">
            {phases.slice(0, 8).map((phase: any, index: number) => (
                <details key={`${phase.title || phase.name || index}`} className="rounded-2xl border border-border bg-secondary p-4" open={index === 0}>
                    <summary className="cursor-pointer list-none">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-medium uppercase tracking-[0.12em] text-cyan-200">Phase {index + 1}</div>
                                <div className="mt-1 text-base font-semibold text-foreground">{phase.title || phase.name || 'Learning phase'}</div>
                            </div>
                            <ChevronDown size={16} className="text-muted-foreground" />
                        </div>
                    </summary>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <MiniSection title="Duration" body={phase.duration || phase.estimatedTime || phase.estimated_time} />
                        <MiniSection title="Goals" body={phase.objective || phase.goals || phase.learningGoals} />
                        <MiniSection title="Topics" body={phase.topics || phase.concepts} />
                        <MiniSection title="Projects" body={phase.projects} />
                        <MiniSection title="Deliverables" body={phase.deliverables || phase.milestone} />
                        <MiniSection title="Estimated hours" body={phase.estimatedHours || phase.estimatedStudyHours || phase.hours} />
                    </div>
                </details>
            ))}
        </div>
    )
}

function MiniSection({ title, body }: { title: string; body: unknown }) {
    if (!body || (Array.isArray(body) && !body.length)) return null
    const text = Array.isArray(body)
        ? body.map((item: any) => typeof item === 'object' ? item.title || item.name || JSON.stringify(item) : String(item)).join(', ')
        : String(body)
    return (
        <div className="rounded-xl bg-background/70 p-3">
            <div className="text-xs font-semibold text-muted-foreground">{title}</div>
            <div className="mt-1 text-sm leading-6 text-foreground">{text}</div>
        </div>
    )
}

function TypeBanner({ type }: { type: string }) {
    const label = {
        roadmap: 'Structured Roadmap',
        resume: 'Resume Analysis',
        project: 'Project Plan',
        interview: 'Interview Prep',
        code: 'Code Response',
        general: 'AI Response',
    }[type] || 'AI Response'
    return (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            {label}
        </div>
    )
}

export default function AIResponseRenderer({ content, compact = false, maxChars = 3200, className = '' }: AIResponseRendererProps) {
    const markdown = useMemo(() => toMarkdown(content), [content])
    const parsed = useMemo(() => tryParseJson(markdown), [markdown])
    const type = useMemo(() => classify(markdown, parsed), [markdown, parsed])
    const [expanded, setExpanded] = useState(markdown.length <= maxChars)
    const visible = expanded ? markdown : `${markdown.slice(0, maxChars).trim()}\n\n...`

    return (
        <div className={`ai-response ${className}`}>
            {!compact && <TypeBanner type={type} />}
            {type === 'roadmap' && parsed !== null ? <RoadmapCards value={parsed} /> : null}
            <motion.div initial={false} animate={{ opacity: 1 }} className="prose max-w-none text-[15px] leading-7">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                        code: CodeBlock,
                        a: ({ children, href, ...props }) => <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-300 underline-offset-4 hover:underline" {...props}>{children}<ExternalLink size={12} /></a>,
                    }}
                >
                    {visible}
                </ReactMarkdown>
            </motion.div>
            {!expanded && (
                <button onClick={() => setExpanded(true)} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
                    Continue Reading
                    <ChevronDown size={14} />
                </button>
            )}
        </div>
    )
}
