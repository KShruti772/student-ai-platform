import client from '../lib/client'

async function withRetry(fn: () => Promise<any>, retries = 2, delay = 300) {
    try {
        return await fn()
    } catch (err) {
        if (retries <= 0) throw err
        await new Promise(r => setTimeout(r, delay))
        return withRetry(fn, retries - 1, delay * 2)
    }
}

export async function fetchAgentsActivity() {
    return withRetry(() => client.get('/api/agents/activity').then(r => r.data))
}

export async function fetchWorkflow() {
    return withRetry(() => client.get('/api/workflow').then(r => r.data))
}

export async function fetchModelMetrics() {
    return withRetry(() => client.get('/api/model/metrics').then(r => r.data))
}

export async function fetchProjectAnalytics() {
    return withRetry(() => client.get('/api/projects/analytics').then(r => r.data))
}

export async function postChat(message: string, sessionId = 'default') {
    return withRetry(() => client.post('/api/chat', { message, session_id: sessionId }).then(r => r.data), 1, 200)
}

export default {
    fetchAgentsActivity,
    fetchWorkflow,
    fetchModelMetrics,
    fetchProjectAnalytics,
    postChat,
}
