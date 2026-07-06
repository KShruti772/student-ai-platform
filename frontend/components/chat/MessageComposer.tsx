'use client'

import React, { useState, useRef, useEffect } from 'react'
import { SendHorizonal, Sparkles } from 'lucide-react'

export default function MessageComposer({ disabled = false, onSend }: { disabled?: boolean; onSend: (m: string) => void }) {
    const [value, setValue] = useState('')
    const ref = useRef<HTMLTextAreaElement | null>(null)

    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = '0px'
            ref.current.style.height = ref.current.scrollHeight + 'px'
        }
    }, [value])

    function send() {
        if (!disabled && value.trim()) {
            onSend(value.trim())
            setValue('')
        }
    }

    return (
        <div className="flex items-end gap-3">
            <div className="hidden rounded-md border border-border bg-secondary p-3 text-cyan-500 sm:block">
                <Sparkles size={18} />
            </div>
            <textarea
                ref={ref}
                value={value}
                disabled={disabled}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        send()
                    }
                }}
                placeholder="Ask about your roadmap, resume, projects, interviews, or study plan..."
                className="max-h-36 min-h-[48px] flex-1 resize-none rounded-md border border-border bg-card p-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent disabled:opacity-60"
                rows={1}
            />
            <button
                disabled={disabled || !value.trim()}
                onClick={send}
                className="flex h-12 items-center gap-2 rounded-md bg-gradient-to-r from-cyan-400 to-violet-500 px-4 text-sm font-medium text-white shadow-lg shadow-cyan-500/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <SendHorizonal size={16} />
                Send
            </button>
        </div>
    )
}
