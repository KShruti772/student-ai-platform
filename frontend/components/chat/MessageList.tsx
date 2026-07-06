import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { ChatMessage } from '../../lib/types'

export default function MessageList({ messages }: { messages: ChatMessage[] }) {
    return (
        <div className="flex flex-col gap-4">
            {messages.map(m => (
                <div key={m.id} className={`max-w-[85%] p-3 rounded-md ${m.role === 'assistant' ? 'bg-white/5 self-start' : 'bg-accent/30 self-end'} ${m.error ? 'border border-red-400/40' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted">{m.role === 'assistant' ? 'Assistant' : 'You'}</div>
                        {m.pending ? <div className="text-xs text-muted">Streaming…</div> : null}
                    </div>
                    <div className="prose prose-invert text-sm leading-6 max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{m.content}</ReactMarkdown>
                    </div>
                </div>
            ))}
        </div>
    )
}
