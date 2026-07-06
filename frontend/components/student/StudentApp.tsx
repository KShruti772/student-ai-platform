'use client'

import React, { useMemo, useState } from 'react'
import CommandPalette from '../ui/CommandPalette'
import { useRealtime } from '../../hooks/useRealtime'
import { useStore } from '../../lib/store'
import * as api from '../../lib/api'
import StudentSidebar from './StudentSidebar'
import StudentTopbar from './StudentTopbar'
import { renderStudentView } from './StudentPages'
import { StudentView } from './types'

export default function StudentApp() {
    const [active, setActive] = useState<StudentView>('home')
    const [commandOpen, setCommandOpen] = useState(false)
    useRealtime('default')

    const addMessage = useStore(s => s.addMessage)
    const setMessageComplete = useStore(s => s.setMessageComplete)
    const setMessageError = useStore(s => s.setMessageError)
    const setMessageContent = useStore(s => s.setMessageContent)

    const commands = useMemo(() => [
        { id: 'home', title: 'Go to Home', action: () => setActive('home') },
        { id: 'chat', title: 'Open AI Chat', action: () => setActive('chat') },
        { id: 'roadmap', title: 'Generate Career Roadmap', action: () => setActive('roadmap') },
        { id: 'projects', title: 'Generate Portfolio Projects', action: () => setActive('projects') },
        { id: 'resume', title: 'Analyze Resume', action: () => setActive('resume') },
        { id: 'mentor', title: 'Ask AI Mentor', action: () => setActive('mentor') },
        { id: 'knowledge', title: 'Search Knowledge Base', action: () => setActive('knowledge') },
        { id: 'workflows', title: 'Build AI Workflow', action: () => setActive('workflows') },
    ], [])

    async function sendHomePrompt(prompt: string) {
        const userId = Date.now()
        const assistantId = userId + 1
        setActive('chat')
        addMessage({ id: userId, role: 'user', content: prompt })
        addMessage({ id: assistantId, role: 'assistant', content: 'Thinking...', pending: true })
        try {
            const result = await api.sendChatMessage(prompt)
            if (result.error) {
                setMessageError(assistantId, result.error)
            } else if (result.response) {
                setMessageContent(assistantId, typeof result.response === 'string' ? result.response : JSON.stringify(result.response, null, 2))
                setMessageComplete(assistantId)
            } else {
                setMessageComplete(assistantId)
            }
        } catch (error) {
            setMessageError(assistantId, String(error))
        }
    }

    return (
        <div className="flex min-h-screen">
            <StudentSidebar active={active} onSelect={setActive} />
            <CommandPalette commands={commands} open={commandOpen} onOpenChange={setCommandOpen} />
            <main className="min-w-0 flex-1 px-4 pb-8 pt-4 lg:px-0 lg:pr-4">
                <StudentTopbar active={active} onOpenCommand={() => setCommandOpen(true)} />
                {renderStudentView(active, sendHomePrompt)}
            </main>
        </div>
    )
}
