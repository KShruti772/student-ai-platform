'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { ArrowUp, Bot, Check, ChevronDown, Clipboard, Clock3, Edit3, FileText, Paperclip, RefreshCw, Sparkles, User, X } from 'lucide-react'
import { motion } from 'framer-motion'
import * as api from '../../lib/api'
import { useStore } from '../../lib/store'
import type { ChatMessage } from '../../lib/types'

const SUGGESTIONS = [
    { title: 'Create a roadmap', prompt: 'Create an AI/ML learning roadmap for my current level.' },
    { title: 'Improve my resume', prompt: 'Review my resume bullets and suggest stronger project-focused improvements.' },
    { title: 'Suggest projects', prompt: 'Suggest portfolio projects I can build for an AI/ML internship.' },
    { title: 'Mock interview', prompt: 'Ask me mock interview questions for my target software role.' },
]

function normalizeResponse(value: unknown): string {
    if (typeof value === 'string') return value
    if (value === null || value === undefined) return ''
    if (typeof value !== 'object') return String(value)
    const record = value as Record<string, unknown>
    const sections = [
        ['Simple explanation', record.simple],
        ['Technical detail', record.technical],
        ['Why it matters', record.why],
        ['Analogy', record.analogy],
        ['Best practices', record.best_practices],
        ['Common mistakes', record.common_mistakes],
        ['Learning points', record.learning_points],
    ].filter(([, content]) => content !== undefined && content !== null)
    if (!sections.length) return JSON.stringify(value, null, 2)
    return sections.map(([title, content]) => `### ${title}\n${Array.isArray(content) ? content.map((item) => `- ${item}`).join('\n') : String(content)}`).join('\n\n')
}

function CodeBlock({ inline, className, children, ...props }: any) {
    const [copied, setCopied] = useState(false)
    const text = String(children).replace(/\n$/, '')
    if (inline) return <code className={className} {...props}>{children}</code>
    return (
        <div className="group relative my-4">
            <button type="button" aria-label="Copy code" onClick={() => {
                navigator.clipboard.writeText(text)
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1500)
            }} className="absolute right-2 top-2 z-10 flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card/90 px-2.5 text-[11px] text-muted-foreground opacity-0 backdrop-blur transition group-hover:opacity-100 focus:opacity-100">
                {copied ? <Check size={13} /> : <Clipboard size={13} />} {copied ? 'Copied' : 'Copy'}
            </button>
            <code className={className} {...props}>{children}</code>
        </div>
    )
}

function Message({ message, onRetry }: { message: ChatMessage; onRetry: () => void }) {
    const assistant = message.role === 'assistant'
    const [traceOpen, setTraceOpen] = useState(false)
    const timestamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    return (
        <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className={`group mx-auto flex w-full max-w-3xl gap-3 px-4 py-4 sm:gap-4 sm:px-6 ${assistant ? '' : 'justify-end'}`}>
            {assistant && (
                <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-white">
                    <Sparkles size={16} />
                </div>
            )}
            <div className={`min-w-0 ${assistant ? 'flex-1' : 'max-w-[82%] sm:max-w-[72%]'}`}>
                <div className={`mb-1 flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--muted)] ${assistant ? '' : 'justify-end'}`}>
                    <span>{assistant ? 'Student AI' : 'You'}</span>
                    <span className="flex items-center gap-1 text-[11px]">
                        <Clock3 size={11} /> {timestamp}
                    </span>
                </div>
                <div className={`${assistant ? 'prose max-w-none bg-transparent text-[15px] leading-7' : 'rounded-2xl rounded-tr-sm bg-[var(--surface-2)] px-4 py-3 text-[15px] leading-7 text-[var(--text)]'} ${message.error ? 'border border-rose-500/25 bg-rose-500/10 text-rose-200' : ''}`}>
                    {message.pending && !message.content ? (
                        <div className="flex items-center gap-2 text-[var(--muted)]">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-strong)] [animation-delay:-0.2s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-strong)] [animation-delay:-0.1s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-strong)]" />
                            <span className="ml-1">Thinking through your request...</span>
                        </div>
                    ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{ code: CodeBlock }}>{message.content}</ReactMarkdown>
                    )}
                    {message.pending && message.content && <span aria-label="Generating response" className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-full bg-[var(--accent-strong)] align-middle" />}
                </div>
                {assistant && !message.pending && (
                    <div className="mt-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                        <button type="button" title="Copy response" onClick={() => navigator.clipboard.writeText(message.content)} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-2)]"><Clipboard size={14} /></button>
                        <button type="button" title="Retry response" onClick={onRetry} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-2)]"><RefreshCw size={14} /></button>
                        <button type="button" onClick={() => setTraceOpen((value) => !value)} className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-[var(--muted)] hover:bg-[var(--surface-2)]"><ChevronDown size={13} className={traceOpen ? 'rotate-180' : ''} /> Details</button>
                    </div>
                )}
                {traceOpen && <div className="mt-2 rounded-xl bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">Sent to backend endpoint /api/chat with session default. Local fallback appears only when the backend request fails or times out.</div>}
            </div>
            {!assistant && (
                <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--muted)]">
                    <User size={15} />
                </div>
            )}
        </motion.article>
    )
}

export default function ChatWorkspace() {
    const messages = useStore((state) => state.chatMessages)
    const addMessage = useStore((state) => state.addMessage)
    const setChatMessages = useStore((state) => state.setChatMessages)
    const setMessageComplete = useStore((state) => state.setMessageComplete)
    const setMessageError = useStore((state) => state.setMessageError)
    const setMessageContent = useStore((state) => state.setMessageContent)
    const connection = useStore((state) => state.connection)
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [attachment, setAttachment] = useState<{ name: string; content: string } | null>(null)
    const [hydrated, setHydrated] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const sessionId = 'default'

    useEffect(() => {
        let mounted = true
        const saved = localStorage.getItem(`session:${sessionId}:chat`)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (Array.isArray(parsed) && parsed.length) setChatMessages(parsed)
            } catch {
                localStorage.removeItem(`session:${sessionId}:chat`)
            }
        }
        api.getSession(sessionId).then((session) => {
            if (!mounted || !Array.isArray(session?.messages) || !session.messages.length) return
            setChatMessages(session.messages.map((message: any, index: number) => ({
                id: Number(message.ts) || index + 10,
                role: message.role === 'assistant' ? 'assistant' : 'user',
                content: String(message.content ?? ''),
            })))
        }).catch(() => undefined).finally(() => mounted && setHydrated(true))
        return () => { mounted = false }
    }, [setChatMessages])

    useEffect(() => {
        if (hydrated) localStorage.setItem(`session:${sessionId}:chat`, JSON.stringify(messages))
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [hydrated, messages])

    useEffect(() => {
        const field = textareaRef.current
        if (!field) return
        field.style.height = '0px'
        field.style.height = `${Math.min(field.scrollHeight, 180)}px`
    }, [input])

    const send = useCallback(async (raw: string) => {
        const prompt = raw.trim()
        if ((!prompt && !attachment) || sending) return
        const now = Date.now()
        const fullPrompt = attachment ? `${prompt}\n\nAttached file: ${attachment.name}\n\`\`\`\n${attachment.content}\n\`\`\`` : prompt
        setSending(true)
        setInput('')
        setAttachment(null)
        addMessage({ id: now, role: 'user', content: prompt })
        addMessage({ id: now + 1, role: 'assistant', content: '', pending: true })
        try {
            const result = await api.sendChatMessage(fullPrompt, sessionId)
            const final = normalizeResponse(result.response)
            if (result.error && !final) {
                setMessageError(now + 1, `I could not reach the AI backend. ${result.error}`)
                return
            }

            const fallbackNote = result.error ? `> ${result.error}\n\n` : ''
            const content = final ? `${fallbackNote}${final}` : 'I did not receive a response from the backend.'
            setMessageContent(now + 1, content)
            setMessageComplete(now + 1, content)
        } catch (error) {
            setMessageError(now + 1, error instanceof Error ? `I could not reach the AI backend. ${error.message}` : 'I could not reach the AI backend. Please try again.')
        } finally {
            setSending(false)
            requestAnimationFrame(() => textareaRef.current?.focus())
        }
    }, [addMessage, attachment, sending, setMessageComplete, setMessageContent, setMessageError])

    const retry = (index: number) => {
        const userMessage = [...messages.slice(0, index)].reverse().find((message) => message.role === 'user')
        if (userMessage) send(userMessage.content)
    }

    return (
        <div className="flex h-[calc(100vh-72px)] min-h-[560px] flex-col bg-[var(--background)]">
            <div className="flex min-h-14 shrink-0 items-center justify-between border-b border-[var(--border)] px-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold"><Bot size={16} className="text-[var(--accent-strong)]" /> <span className="truncate">AI Chat</span></div>
                    <div className="hidden flex-wrap items-center gap-2 text-[11px] text-[var(--muted)] sm:flex">
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1">/api/chat</span>
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1">{sending ? 'Generating' : 'Ready'}</span>
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1">{connection.status === 'connected' ? 'Realtime connected' : connection.status}</span>
                    </div>
                </div>
                <button type="button" onClick={() => { setChatMessages([]); localStorage.removeItem(`session:${sessionId}:chat`) }} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-2)]"><Edit3 size={14} /> New chat</button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-5 py-12 text-center">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent)] text-white"><Sparkles size={23} /></div>
                        <h2 className="mt-5 text-2xl font-semibold tracking-tight">What would you like to work on?</h2>
                        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Ask for roadmaps, resume feedback, project ideas, interview prep, or a study plan.</p>
                        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-[var(--muted)]">
                            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">Roadmaps</span>
                            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">Projects</span>
                            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">Resume</span>
                            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">Interview prep</span>
                        </div>
                        <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
                            {SUGGESTIONS.map((item, index) => (
                                <motion.button key={item.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -2, scale: 1.01 }} onClick={() => send(item.prompt)} className="workspace-card workspace-card-hover p-4 text-left">
                                    <div className="text-sm font-medium">{item.title}</div>
                                    <div className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">{item.prompt}</div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                ) : messages.map((message, index) => <Message key={message.id} message={message} onRetry={() => retry(index)} />)}
                <div ref={bottomRef} />
            </div>

            <div className="shrink-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent px-3 pb-4 pt-6 sm:px-6">
                <div className="mx-auto max-w-3xl">
                    {attachment && <div className="mb-2 flex w-fit items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs"><FileText size={14} className="text-[var(--accent-strong)]" /><span className="max-w-[220px] truncate">{attachment.name}</span><button aria-label="Remove attachment" onClick={() => setAttachment(null)} className="text-[var(--muted)]"><X size={14} /></button></div>}
                    {sending && <div className="mb-2 text-center text-xs text-[var(--muted)]">Student AI is writing. Longer local model responses can take up to 120 seconds.</div>}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="composer-surface rounded-[1.4rem] border border-[var(--border-strong)] bg-[var(--surface)] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)] focus-within:border-[var(--accent-strong)]">
                        <textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault()
                                send(input)
                            }
                        }} rows={1} placeholder="Message Student AI..." className="max-h-[180px] min-h-[52px] w-full resize-none bg-transparent px-3 py-3 text-base leading-7 outline-none placeholder:text-[var(--muted-2)]" />
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <input ref={fileRef} type="file" className="hidden" accept=".txt,.md,.json,.csv,.py,.js,.ts,.tsx" onChange={async (event) => {
                                    const file = event.target.files?.[0]
                                    if (file) setAttachment({ name: file.name, content: (await file.text()).slice(0, 30_000) })
                                    event.target.value = ''
                                }} />
                                <button type="button" title="Attach a text file" onClick={() => fileRef.current?.click()} className="grid h-9 w-9 place-items-center rounded-xl text-[var(--muted)] hover:bg-[var(--surface-2)]"><Paperclip size={17} /></button>
                                <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] text-[var(--muted)] sm:flex">
                                    <Sparkles size={12} className="text-[var(--accent-strong)]" /> Backend /api/chat
                                </div>
                            </div>
                            <button type="button" aria-label="Send message" disabled={(!input.trim() && !attachment) || sending} onClick={() => send(input)} className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--text)] text-[var(--background)] transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp size={18} /></button>
                        </div>
                    </motion.div>
                    <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-[var(--muted-2)]">
                        <motion.span animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }} className={`h-1.5 w-1.5 rounded-full ${connection.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span>{sending ? 'Generating reply...' : 'Enter to send · Shift+Enter for a new line'}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
