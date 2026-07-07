import React from 'react'
import { ChatMessage } from '../../lib/types'
import AIResponseRenderer from '../ai/AIResponseRenderer'

export default function MessageFeed({ messages, onRetry }: { messages: ChatMessage[]; onRetry?: (message: string) => void }) {
    return (
        <div className="flex h-full flex-col gap-4">
            {messages.length === 0 ? (
                <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                    <div className="max-w-xs">
                        <div className="mb-3 text-lg font-semibold text-foreground">No session messages yet</div>
                        <div className="text-sm leading-6 text-muted-foreground">Ask about careers, roadmaps, projects, resumes, interviews, or your uploaded knowledge.</div>
                    </div>
                </div>
            ) : (
                messages.map((message) => {
                    const isAssistant = message.role === 'assistant'
                    const cardClass = isAssistant ? 'bg-secondary self-start' : 'bg-cyan-400/10 self-end'
                    return (
                        <div key={message.id} className={`max-w-[85%] rounded-[1.5rem] border border-border p-4 ${cardClass} ${message.error ? 'border-rose-400/30' : ''}`}>
                            <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                <span>{isAssistant ? 'Assistant' : 'You'}</span>
                                {message.pending ? <span className="text-cyan-200">Streaming…</span> : message.error ? <span className="text-rose-300">Error</span> : <span>Complete</span>}
                            </div>
                            <AIResponseRenderer content={message.content} compact={!isAssistant} maxChars={isAssistant ? 3600 : 1200} />
                        </div>
                    )
                })
            )}
        </div>
    )
}
