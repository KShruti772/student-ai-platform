'use client'

import { useRouter } from 'next/navigation'
import { HomePage } from './StudentPages'
import { useStore } from '../../lib/store'
import * as api from '../../lib/api'

export default function HomeRoute() {
    const router = useRouter()
    const addMessage = useStore(s => s.addMessage)
    const setMessageComplete = useStore(s => s.setMessageComplete)
    const setMessageError = useStore(s => s.setMessageError)
    const setMessageContent = useStore(s => s.setMessageContent)

    async function sendPrompt(prompt: string) {
        const userId = Date.now()
        const assistantId = userId + 1
        addMessage({ id: userId, role: 'user', content: prompt })
        addMessage({ id: assistantId, role: 'assistant', content: 'Thinking...', pending: true })
        router.push('/chat')
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

    return <HomePage onPrompt={sendPrompt} />
}
