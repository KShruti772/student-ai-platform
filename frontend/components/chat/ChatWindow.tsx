'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Bot, Radio } from 'lucide-react'
import MessageComposer from './MessageComposer'
import MessageFeed from './MessageFeed'
import * as api from '../../lib/api'
import { useStore } from '../../lib/store'

type ChatMessage = {
    id: number
    role: 'user' | 'assistant'
    content: string
    pending?: boolean
    error?: boolean
}

function formatMentorResponse(response: unknown): string {
    if (typeof response === 'string') {
        return response
    }

    if (!response || typeof response !== 'object') {
        return 'I received an empty response from the mentor agent.'
    }

    const data = response as Record<string, unknown>
    const sections = [
        ['Simple', data.simple],
        ['Technical', data.technical],
        ['Why', data.why],
        ['Analogy', data.analogy],
        ['Best practices', data.best_practices],
        ['Common mistakes', data.common_mistakes],
        ['Learning points', data.learning_points],
        ['Raw', data.raw],
    ]

    return sections
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([label, value]) => {
            const body = Array.isArray(value) ? value.map(item => `- ${item}`).join('\n') : String(value)
            return `**${label}**\n${body}`
        })
        .join('\n\n')
}

export default function ChatWindow() {
    const messages = useStore(s => s.chatMessages)
    const addMessage = useStore(s => s.addMessage)
    const setChatMessages = useStore(s => s.setChatMessages)
    const setMessageComplete = useStore(s => s.setMessageComplete)
    const setMessageError = useStore(s => s.setMessageError)
    const setMessageContent = useStore(s => s.setMessageContent)
    const [isSending, setIsSending] = useState(false)
    const sessionId = 'default'
    const scrollRef = useRef<HTMLDivElement | null>(null)

    // restore optimistic UI from localStorage, then reconcile with backend session
    useEffect(() => {
        try {
            const raw = localStorage.getItem(`session:${sessionId}:chat`)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed)) {
                    setChatMessages(parsed)
                }
            }
        } catch (err) {
            console.error('restore local chat failed', err)
        }

        // fetch server session and prefer authoritative messages if present
        let mounted = true
            ; (async () => {
                try {
                    const s = await api.getSession(sessionId)
                    if (!mounted) return
                    const srvMsgs = (s.messages || []).map((m: any, i: number) => ({ id: m.ts || Date.now() + i, role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content || JSON.stringify(m) }))
                    if (srvMsgs.length) setChatMessages(srvMsgs)
                } catch (err) {
                    // ignore
                }
            })()
        return () => { mounted = false }
    }, [])

    async function handleSend(message: string) {
        const now = Date.now()
        const assistantId = now + 1
        setIsSending(true)
        addMessage({ id: now, role: 'user', content: message })
        addMessage({ id: assistantId, role: 'assistant', content: 'Thinking...', pending: true })

        try {
            const result = await api.sendChatMessage(message)
            if (result.error && !result.response) {
                setMessageError(assistantId, result.error)
            } else {
                // finalize content if provided; streaming likely already populated content
                if ((result as any).response) {
                    const prefix = result.offline || result.error ? `> ${result.error || 'Using local fallback'}\n\n` : ''
                    setMessageContent(assistantId, `${prefix}${formatMentorResponse((result as any).response)}`)
                }
                setMessageComplete(assistantId)
            }
        } catch (err) {
            setMessageError(assistantId, String(err))
        } finally {
            setIsSending(false)
        }
    }

    // persist chat messages locally for optimistic restore
    useEffect(() => {
        try {
            localStorage.setItem(`session:${sessionId}:chat`, JSON.stringify(messages))
        } catch (err) {
            console.error('failed to persist chat to localStorage', err)
        }
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages])

    // streaming tokens are appended centrally via useEventBus -> store.appendToLastAssistant

    return (
        <div className="flex h-[640px] flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-xl shadow-black/5">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Bot size={18} className="text-cyan-200" />
                        AI Career Session
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">Markdown responses, code blocks, retry, and local session recovery</div>
                </div>
                <div className="status-pill status-pill--connected text-xs">
                    <Radio size={12} className={isSending ? 'animate-pulse' : ''} />
                    {isSending ? 'Streaming' : 'Ready'}
                </div>
            </div>
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto p-5">
                <MessageFeed messages={messages} onRetry={(message) => handleSend(message)} />
            </div>
            <div className="border-t border-border bg-secondary p-5">
                <MessageComposer disabled={isSending} onSend={handleSend} />
            </div>
        </div>
    )
}
