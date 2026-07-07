import React from 'react'
import { ChatMessage } from '../../lib/types'
import AIResponseRenderer from '../ai/AIResponseRenderer'

export default function MessageList({ messages }: { messages: ChatMessage[] }) {
    return (
        <div className="flex flex-col gap-4">
            {messages.map(m => (
                <div key={m.id} className={`max-w-[85%] p-3 rounded-md ${m.role === 'assistant' ? 'bg-white/5 self-start' : 'bg-accent/30 self-end'} ${m.error ? 'border border-red-400/40' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted">{m.role === 'assistant' ? 'Assistant' : 'You'}</div>
                        {m.pending ? <div className="text-xs text-muted">Streaming…</div> : null}
                    </div>
                    <AIResponseRenderer content={m.content} compact={m.role !== 'assistant'} maxChars={m.role === 'assistant' ? 3600 : 1200} />
                </div>
            ))}
        </div>
    )
}
