'use client'

import { type DragEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowRight, BookOpen, BrainCircuit, Check, FileText, FileUp, GraduationCap, Layers, Loader2, Search, Sparkles, Zap } from 'lucide-react'
import * as api from '../../lib/api'

function Heading({ kicker, title, description }: { kicker: string; title: string; description: string }) {
    return <div className="page-heading"><div className="page-kicker">{kicker}</div><h2 className="page-title">{title}</h2><p className="page-description">{description}</p></div>
}

function format(value: unknown) {
    if (typeof value === 'string') return value
    if (!value) return ''
    const record = value as Record<string, unknown>
    return Object.entries(record).filter(([, item]) => item !== null && item !== undefined).map(([key, item]) => `### ${key.replaceAll('_', ' ')}\n${Array.isArray(item) ? item.map((entry) => `- ${entry}`).join('\n') : typeof item === 'object' ? `\`\`\`json\n${JSON.stringify(item, null, 2)}\n\`\`\`` : String(item)}`).join('\n\n')
}

function SampleSkeleton() {
    return <div className="space-y-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/70" />)}
    </div>
}

export function MentorContent() {
    const [prompt, setPrompt] = useState('')
    const [answer, setAnswer] = useState('')
    const [loading, setLoading] = useState(false)
    const [activePrompt, setActivePrompt] = useState<string | null>(null)
    const suggestions = [
        'Explain the realtime architecture in simple terms.',
        'What are the tradeoffs in this workflow design?',
        'Give me a learning plan for building an AI agent.',
    ]

    const submit = async (event: FormEvent) => {
        event.preventDefault()
        if (!prompt.trim()) return
        setLoading(true)
        setActivePrompt(prompt.trim())
        try {
            const result = await api.sendMentorMessage(prompt.trim())
            setAnswer(result.error ? `Unable to answer: ${result.error}` : format(result.response))
        } catch (error) {
            setAnswer(error instanceof Error ? error.message : 'Mentor request failed')
        } finally { setLoading(false) }
    }

    return (
        <div className="page-shell">
            <Heading kicker="Guided learning" title="AI Mentor" description="Ask for a concept map, analogy, tutorial, or walkthrough grounded in your current task and workspace context." />
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="workspace-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                        <div>
                            <div className="text-sm font-semibold">Learning console</div>
                            <div className="mt-1 text-xs text-[var(--muted)]">Calm guidance, reusable explanations, and guided next steps.</div>
                        </div>
                        <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">Interactive</div>
                    </div>
                    <div className="min-h-[360px] p-5 sm:p-7">
                        {loading ? (
                            <div className="space-y-4">
                                <SampleSkeleton />
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/70 p-4 text-sm text-[var(--muted)]">Preparing a rationale-aware explanation for your request…</div>
                            </div>
                        ) : answer ? (
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="prose max-w-none text-sm leading-7">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
                            </motion.div>
                        ) : (
                            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]"><GraduationCap size={23} /></span>
                                <div className="mt-4 font-medium">Learn through conversation</div>
                                <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">Ask about architecture, model behavior, code quality, or why a workflow pattern works.</p>
                            </div>
                        )}
                    </div>
                    <form onSubmit={submit} className="border-t border-[var(--border)] p-3">
                        <div className="flex gap-2 rounded-xl bg-[var(--surface-2)] p-2">
                            <textarea rows={2} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="What would you like to understand?" className="min-w-0 flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none" />
                            <button disabled={loading || !prompt.trim()} className="self-end rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Ask'}
                            </button>
                        </div>
                    </form>
                </div>
                <aside className="space-y-3">
                    {suggestions.map((item) => (
                        <button key={item} onClick={() => { setPrompt(item); setActivePrompt(item) }} className={`workspace-card workspace-card-hover w-full p-4 text-left text-sm ${activePrompt === item ? 'border-[var(--accent-strong)]' : ''}`}>
                            <Sparkles size={15} className="mb-2 text-[var(--accent-strong)]" />
                            {item}
                        </button>
                    ))}
                    <div className="workspace-card p-4 text-sm text-[var(--muted)]">
                        <div className="flex items-center gap-2 font-semibold text-[var(--text)]"><Layers size={15} className="text-[var(--accent-strong)]" /> Suggested learning path</div>
                        <ul className="mt-3 space-y-2">
                            <li>• Start with the current workflow concept.</li>
                            <li>• Break it into steps with a practical analogy.</li>
                            <li>• Capture a short checklist for follow-up.</li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export function KnowledgeContent() {
    const [query, setQuery] = useState('')
    const [collection, setCollection] = useState('default')
    const [results, setResults] = useState<any[]>([])
    const [status, setStatus] = useState('')
    const [loading, setLoading] = useState(false)
    const [dropActive, setDropActive] = useState(false)
    const [documents, setDocuments] = useState([{ name: 'System architecture', collection: 'default', summary: 'Platform blueprint and flow overview', updated: '2m ago' }, { name: 'Workflow playbook', collection: 'default', summary: 'Operational runbooks and retry guidance', updated: '11m ago' }])
    const fileRef = useRef<HTMLInputElement>(null)

    const search = async (event: FormEvent) => {
        event.preventDefault()
        if (!query.trim()) {
            setResults([])
            return
        }
        setLoading(true)
        setStatus('')
        try {
            const response = await api.searchKnowledge(query.trim(), collection)
            setResults(Array.isArray(response.result) ? response.result : [])
        } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Search failed')
        } finally {
            setLoading(false)
        }
    }

    const upload = async (file?: File) => {
        if (!file) return
        setLoading(true)
        try {
            await api.uploadKnowledge(file, collection)
            setDocuments((current) => [{ name: file.name, collection, summary: 'New document indexed for retrieval', updated: 'just now' }, ...current].slice(0, 4))
            setStatus(`${file.name} indexed successfully.`)
        } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Upload failed')
        } finally {
            setLoading(false)
        }
    }

    const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setDropActive(false)
        const file = event.dataTransfer.files?.[0]
        await upload(file)
    }

    return (
        <div className="page-shell">
            <Heading kicker="Retrieval" title="Knowledge" description="Ground the workspace in indexed documents, semantic search, and retrieval previews that feel like a modern research surface." />
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <form onSubmit={search} className="flex min-w-0 flex-1 gap-2">
                    <div className="relative min-w-0 flex-1">
                        <Search size={15} className="absolute left-3 top-3.5 text-[var(--muted)]" />
                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search indexed knowledge…" className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm outline-none focus:border-[var(--accent-strong)]" />
                    </div>
                    <button disabled={loading} className="rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-white">{loading ? 'Working…' : 'Search'}</button>
                </form>
                <input value={collection} onChange={(event) => setCollection(event.target.value)} aria-label="Collection" className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none" />
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={(event) => { upload(event.target.files?.[0]); event.target.value = '' }} />
            <div onDragOver={(event) => { event.preventDefault(); setDropActive(true) }} onDragLeave={() => setDropActive(false)} onDrop={handleDrop} className={`mb-4 flex h-28 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed px-4 text-sm transition ${dropActive ? 'border-[var(--accent-strong)] bg-[var(--accent-soft)]/20 text-[var(--text)]' : 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent-strong)] hover:text-[var(--text)]'}`} onClick={() => fileRef.current?.click()}>
                <FileUp size={20} /> Drop or browse documents into <strong className="ml-1">{collection}</strong>
            </div>
            {status && <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/70 p-3 text-sm">{status}</div>}
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-3">
                    {loading && !results.length ? <SampleSkeleton /> : results.length ? results.map((result, index) => <article key={result.id ?? index} className="workspace-card p-5"><div className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--accent-strong)]"><BookOpen size={14} /> Result {index + 1}{result.score !== undefined ? ` · ${Number(result.score).toFixed(3)}` : ''}</div><p className="whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{String(result.text ?? result.content ?? result.document ?? JSON.stringify(result))}</p></article>) : <div className="workspace-card p-10 text-center text-sm text-[var(--muted)]">Search results and retrieval previews will appear here.</div>}
                </div>
                <aside className="space-y-3">
                    <div className="workspace-card p-4">
                        <div className="text-sm font-semibold">Indexed documents</div>
                        <div className="mt-3 space-y-2">
                            {documents.map((document) => <button key={document.name} className="flex w-full items-start justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/70 px-3 py-3 text-left text-sm" onClick={() => setStatus(`${document.name} ready for retrieval in ${document.collection}.`)}><div><div className="font-medium text-[var(--text)]">{document.name}</div><div className="mt-1 text-xs text-[var(--muted)]">{document.summary}</div></div><div className="text-[11px] text-[var(--muted)]">{document.updated}</div></button>)}
                        </div>
                    </div>
                    <div className="workspace-card p-4 text-sm text-[var(--muted)]">
                        <div className="flex items-center gap-2 font-semibold text-[var(--text)]"><FileText size={15} className="text-[var(--accent-strong)]" /> Retrieval preview</div>
                        <p className="mt-3 leading-6">Use the knowledge surface to ground chat, mentor, and workflow actions with context-rich excerpts and index metadata.</p>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export function SkillsContent() {
    const [skills, setSkills] = useState<any[]>([])
    const [intent, setIntent] = useState('')
    const [matches, setMatches] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [active, setActive] = useState<string | null>(null)
    useEffect(() => { api.listSkills().then((data) => setSkills(Array.isArray(data.skills) ? data.skills : [])).catch(() => setSkills([])).finally(() => setLoading(false)) }, [])
    const detect = async (event: FormEvent) => {
        event.preventDefault()
        if (!intent.trim()) return
        setLoading(true)
        try { const data = await api.detectSkills(intent); setMatches(Array.isArray(data.detected) ? data.detected : []) } finally { setLoading(false) }
    }
    const activate = async (name: string) => {
        setActive(name)
        try { await api.activateSkill(name) } catch { setActive(null) }
    }
    const shown = matches.length ? matches : skills
    return (
        <div className="page-shell">
            <Heading kicker="Capability routing" title="Skills engine" description="Discover registered capabilities, match them to an intent, and activate the right skill through the backend registry." />
            <form onSubmit={detect} className="mb-5 flex max-w-2xl gap-2"><input value={intent} onChange={(event) => setIntent(event.target.value)} placeholder="Describe what you want the platform to do…" className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm outline-none focus:border-[var(--accent-strong)]" /><button disabled={loading || !intent.trim()} className="rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-white">Detect</button></form>
            {loading && !shown.length ? <div className="grid h-48 place-items-center"><Loader2 className="animate-spin text-[var(--accent-strong)]" /></div> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{shown.map((skill, index) => { const name = String(skill.name ?? skill.skill ?? `Skill ${index + 1}`); return <article key={`${name}-${index}`} className="workspace-card p-5"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]"><BrainCircuit size={17} /></span>{skill.score !== undefined && <span className="text-xs text-[var(--muted)]">{Math.round(Number(skill.score) * 100)}% match</span>}</div><h3 className="mt-4 font-medium">{name}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{String(skill.description ?? skill.mentor_explanation ?? skill.path ?? 'Registered platform capability')}</p><button onClick={() => activate(name)} className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[var(--accent-strong)]">{active === name ? <><Check size={13} /> Activated</> : <><Zap size={13} /> Activate</>}</button></article> })}</div>}
        </div>
    )
}
