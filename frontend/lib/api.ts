import client from './client'
import { AgentActivity, WorkflowNode, WorkflowEdge, MentorResponse, ModelMetricPoint, ProjectAnalytics } from './types'

const API_PREFIX = '/api'

export async function getAgentActivity(): Promise<AgentActivity[]> {
    const res = await client.get(`${API_PREFIX}/agents/activity`)
    return res.data as AgentActivity[]
}

export async function getWorkflow(): Promise<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }> {
    const res = await client.get(`${API_PREFIX}/workflow`)
    return res.data as { nodes: WorkflowNode[]; edges: WorkflowEdge[] }
}

export type WorkflowStep = {
    id: string
    agent: string
    task: string
    status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying'
    progress: number
    message?: string
}

export type WorkflowTemplate = {
    id: string
    name: string
    description: string
    required_input: string
    steps: Array<{ id: string; agent: string; task: string }>
}

export type WorkflowRun = {
    workflow_id: string
    template_id: string
    workflow_name: string
    description: string
    required_input: string
    goal: string
    status: 'queued' | 'running' | 'completed' | 'failed' | 'not_found'
    progress: number
    current_step: string
    steps: WorkflowStep[]
    result?: string
    error?: string
    nodes?: WorkflowNode[]
    edges?: WorkflowEdge[]
}

export async function getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    const res = await client.get(`${API_PREFIX}/workflow/templates`)
    return res.data.templates as WorkflowTemplate[]
}

export async function getMentorExplanation(prompt: string): Promise<MentorResponse> {
    const res = await client.post(`${API_PREFIX}/mentor`, { prompt })
    return res.data as MentorResponse
}

export async function getModelMetrics(): Promise<ModelMetricPoint[]> {
    const res = await client.get(`${API_PREFIX}/model/metrics`)
    return res.data as ModelMetricPoint[]
}

export type ModelStatus = {
    provider?: string
    base_url?: string
    model?: string
    connected?: boolean
    model_loaded?: boolean
    available_models?: string[]
    error?: string | null
}

export async function getModelStatus(): Promise<ModelStatus> {
    const res = await client.get(`${API_PREFIX}/model/status`, { timeout: 15_000 })
    return res.data as ModelStatus
}

export async function getSession(sessionId: string) {
    const res = await client.get(`${API_PREFIX}/session/${encodeURIComponent(sessionId)}`)
    return res.data
}

export async function getSessionTimeline(sessionId: string) {
    const res = await client.get(`${API_PREFIX}/session/${encodeURIComponent(sessionId)}/timeline`)
    return res.data
}

export async function getSessionMetrics(sessionId: string) {
    const res = await client.get(`${API_PREFIX}/session/${encodeURIComponent(sessionId)}/metrics`)
    return res.data
}

export async function getSessionReplay(sessionId: string) {
    const res = await client.get(`${API_PREFIX}/session/${encodeURIComponent(sessionId)}/replay`)
    return res.data
}

export async function getProjectAnalytics(): Promise<ProjectAnalytics> {
    const res = await client.get(`${API_PREFIX}/projects/analytics`)
    return res.data as ProjectAnalytics
}

export async function executeWorkflow(goal: string, sessionId = 'default', templateId = 'project_builder'): Promise<{ workflow_id?: string; workflow?: WorkflowRun; error?: string }> {
    const res = await client.post(`${API_PREFIX}/workflow/execute`, { goal, session_id: sessionId, template_id: templateId }, { timeout: 120_000 })
    return res.data
}

export async function getWorkflowStatus(workflowId: string): Promise<WorkflowRun> {
    const res = await client.get(`${API_PREFIX}/workflow/status/${encodeURIComponent(workflowId)}`)
    return res.data
}

export async function retryWorkflowNode(workflowId: string, nodeId: string, sessionId = 'default') {
    const res = await client.post(`${API_PREFIX}/workflow/status/${encodeURIComponent(workflowId)}/node/${encodeURIComponent(nodeId)}/retry`, { session_id: sessionId })
    return res.data
}

export async function listSkills() {
    const res = await client.get(`${API_PREFIX}/skills/list`)
    return res.data
}

export async function detectSkills(input: string | Record<string, unknown>) {
    const payload = typeof input === 'string' ? { text: input } : input
    const res = await client.post('/skills/detect', payload).catch(() => client.post(`${API_PREFIX}/skills/detect`, payload))
    return res.data
}

export async function activateSkill(name: string) {
    const res = await client.post(`${API_PREFIX}/skills/activate`, { name })
    return res.data
}

export async function searchKnowledge(query: string, collection = 'default') {
    const res = await client.post('/knowledge/search', { query, collection }).catch(() => client.get(`${API_PREFIX}/knowledge/search`, { params: { q: query, collection } }))
    return res.data
}

export async function uploadKnowledge(file: File, collection = 'default', onProgress?: (percent: number) => void) {
    const body = new FormData()
    body.append('file', file)
    const config = {
        params: { collection },
        onUploadProgress: (event: any) => {
            if (!event.total || !onProgress) return
            onProgress(Math.round((event.loaded / event.total) * 100))
        },
    }
    const res = await client.post('/knowledge/upload', body, config).catch(() => client.post(`${API_PREFIX}/knowledge/upload`, body, config))
    return res.data
}

export type ChatResponse = {
    response?: unknown
    error?: string
    offline?: boolean
    debug?: unknown
}

function textFromPayload(payload: unknown) {
    if (typeof payload === 'string') return payload
    if (!payload || typeof payload !== 'object') return ''
    return Object.entries(payload as Record<string, unknown>)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value ?? '')}`)
        .join('\n')
}

function backendError(error: unknown) {
    const anyError = error as any
    if (anyError?.response?.data?.detail) return String(anyError.response.data.detail)
    if (anyError?.response?.data?.error) return String(anyError.response.data.error)
    if (anyError?.response?.data) return JSON.stringify(anyError.response.data)
    if (anyError?.message) return String(anyError.message)
    return String(error)
}

function unavailableError(error: unknown, timeoutSeconds = 90) {
    const anyError = error as any
    if (anyError?.code === 'ECONNABORTED') return `The AI request timed out after ${timeoutSeconds} seconds, so I generated a local fallback to keep you moving.`
    if (anyError?.code === 'ERR_NETWORK' || !anyError?.response) return 'I could not reach the backend, so I generated a local fallback to keep you moving.'
    return ''
}

function chatError(data: ChatResponse, fallbackMessage = 'The backend returned an empty AI response.') {
    if (data.error) return String(data.error)
    if (!data.response) return fallbackMessage
    return ''
}

function localAssistantReply(message: string) {
    const lower = message.toLowerCase()
    if (lower.includes('roadmap') || lower.includes('career')) {
        return `## Career Roadmap\n\n**Phase 1: Foundation**\n- Clarify your target role and list required skills.\n- Spend 60-90 minutes daily on one core skill.\n\n**Phase 2: Portfolio**\n- Build two resume-ready projects with READMEs, screenshots, and measurable impact.\n- Add tests, deployment notes, and a short architecture diagram.\n\n**Phase 3: Interview Prep**\n- Practice role-specific questions, DSA basics, and project explanations.\n- Run one mock interview per week.\n\n**Next step:** share your current skills, target role, and timeframe and I will turn this into a weekly plan.`
    }
    if (lower.includes('resume')) {
        return `## Resume Improvement Plan\n\n- Lead with a 2-3 line summary tied to the role you want.\n- Rewrite bullets as: **action + technology + outcome + metric**.\n- Move core technical skills near the top.\n- Add 2-3 project bullets that show ownership, architecture, and impact.\n\nExample bullet: **Built** a student AI planning app with Next.js and FastAPI that converts career goals into weekly milestones and reusable portfolio artifacts.`
    }
    if (lower.includes('interview')) {
        return `## Interview Prep Plan\n\n1. Prepare a 60-second intro focused on your target role.\n2. Pick three projects and practice explaining problem, architecture, tradeoffs, and impact.\n3. Solve 3-5 DSA problems per week and write down patterns.\n4. Practice behavioral answers using situation, action, result, reflection.\n\nStart with: tell me your target role and interview date.`
    }
    if (lower.includes('project')) {
        return `## Project Ideas\n\n**AI Career Coach**\n- Inputs: skills, goal, timeframe.\n- Features: roadmap generation, progress tracking, resume bullets.\n- Stack: Next.js, FastAPI, local storage, optional LLM API.\n\n**Smart Resume Analyzer**\n- Inputs: resume text and target role.\n- Features: ATS feedback, bullet rewrites, skills gap report.\n- Resume impact: shows NLP-style analysis, product thinking, and clear UX.`
    }
    return `I can help with career planning, learning roadmaps, portfolio projects, resumes, interviews, and study workflows.\n\nA strong next step is to give me three details:\n- your current skills\n- your target role\n- your timeframe\n\nThen I can turn it into an actionable plan.`
}

function localRoadmap(goal = 'AI Engineer', skills = 'beginner fundamentals', timeframe = '12 weeks', level = 'Intermediate', interests = 'AI products') {
    return {
        title: `${goal || 'Career'} Roadmap`,
        summary: `A ${timeframe || '12 week'} ${level || 'focused'} plan using your current skills (${skills || 'fundamentals'}) and interests (${interests || 'student-focused products'}).`,
        requiredSkills: ['Core programming', 'Git/GitHub', 'APIs', 'Data structures', 'Project communication'],
        certifications: ['FreeCodeCamp or equivalent portfolio proof', 'Cloud fundamentals badge', 'Role-specific course certificate'],
        phases: [
            { title: 'Weeks 1-2: Foundation', detail: 'Refresh fundamentals, set up tools, create a daily practice rhythm.', progress: 20 },
            { title: 'Weeks 3-6: Build', detail: 'Ship one guided project and one independent project with documentation.', progress: 45 },
            { title: 'Weeks 7-10: Specialize', detail: 'Add role-specific depth, tests, deployment, and measurable outcomes.', progress: 70 },
            { title: 'Weeks 11-12: Interview + Apply', detail: 'Polish resume, prepare project stories, and run mock interviews.', progress: 90 },
        ],
        projects: ['AI study planner', 'Resume analyzer', 'Interview practice assistant'],
        interviewPrep: ['Explain each project in 2 minutes', 'Practice common role questions', 'Prepare STAR stories'],
    }
}

function localProjects(payload: Record<string, unknown>) {
    const domain = String(payload.domain || payload.interests || 'AI learning')
    const role = String(payload.targetRole || payload.companies || 'software/AI role')
    const stack = String(payload.techStack || payload.skills || 'Next.js, FastAPI, Python')
    const level = String(payload.level || 'Intermediate')
    return {
        projects: [
            {
                title: `${domain} Career Copilot`,
                difficulty: level,
                time: '2-3 weeks',
                stack,
                problem: `Students targeting ${role} need a guided way to convert goals into weekly execution.`,
                features: ['Goal intake', 'Roadmap generation', 'Progress tracker', 'Resume bullet export'],
                architecture: ['Next.js UI', 'FastAPI planning endpoint', 'Local persistence', 'Optional LLM provider'],
                folderStructure: ['app/', 'components/student/', 'lib/api.ts', 'backend/api/routers/'],
                githubPlan: ['Create issue list', 'Ship MVP branch', 'Add screenshots and demo video', 'Write deployment notes'],
                resumeImpact: 'Shows product thinking, full-stack integration, AI UX, and student outcome design.',
                steps: ['Design intake form', 'Build generator', 'Store progress', 'Polish README'],
            },
            {
                title: `Smart ${role} Interview Lab`,
                difficulty: level,
                time: '10-14 days',
                stack,
                problem: 'Candidates struggle to connect projects, DSA practice, and behavioral answers.',
                features: ['Question bank', 'Mock interview timer', 'Answer feedback', 'Readiness score'],
                architecture: ['Question templates', 'Feedback service', 'Session history', 'Analytics view'],
                folderStructure: ['app/mentor/', 'components/chat/', 'services/', 'data/prompts.ts'],
                githubPlan: ['Add seed questions', 'Record sample run', 'Document scoring logic'],
                resumeImpact: 'Demonstrates conversational UX, evaluation logic, and interview domain knowledge.',
                steps: ['Create prompt templates', 'Build chat flow', 'Add scoring rubric', 'Test with sample answers'],
            },
        ],
    }
}

export async function sendMentorMessage(message: string, sessionId = 'default'): Promise<ChatResponse> {
    try {
        const res = await client.post(`${API_PREFIX}/mentor`, { message, session_id: sessionId })
        const data = res.data as ChatResponse
        const error = chatError(data, 'The mentor endpoint returned an empty AI response.')
        if (error) return { error }
        return data
    } catch (error) {
        const offline = unavailableError(error)
        if (offline) return { response: localAssistantReply(message), error: offline, offline: true }
        return { error: backendError(error) }
    }
}

export async function sendChatMessage(message: string, sessionId = 'default'): Promise<ChatResponse> {
    try {
        const res = await client.post(`${API_PREFIX}/chat`, { message, session_id: sessionId }, { timeout: 120_000 })
        const data = res.data as ChatResponse
        const error = chatError(data)
        if (error) return { error }
        return data
    } catch (error) {
        const offline = unavailableError(error, 120)
        if (offline) return { response: localAssistantReply(message), error: offline, offline: true }
        return { error: backendError(error) }
    }
}

export async function buildProjectWorkflow(payload: Record<string, unknown>) {
    try {
        const message = textFromPayload(payload)
        const res = await client.post('/workflow/project-build', { message, session_id: 'default' })
        if (res.data?.projects) return res.data
        return localProjects(payload)
    } catch {
        return localProjects(payload)
    }
}

export async function debugWorkflow(payload: Record<string, unknown>) {
    const res = await client.post('/workflow/debug', payload)
    return res.data
}

export async function explainWorkflow(payload: Record<string, unknown>) {
    const res = await client.post('/workflow/explain', payload)
    return res.data
}

export async function injectSkills(payload: Record<string, unknown>) {
    const res = await client.post('/skills/inject', payload)
    return res.data
}

export async function getApiSession(sessionId = 'default') {
    const res = await client.get(`${API_PREFIX}/session/${encodeURIComponent(sessionId)}`)
    return res.data
}

export default {
    getAgentActivity,
    getWorkflow,
    getMentorExplanation,
    getModelMetrics,
    getProjectAnalytics,
    sendMentorMessage,
    sendChatMessage,
    buildProjectWorkflow,
    debugWorkflow,
    explainWorkflow,
    uploadKnowledge,
    searchKnowledge,
    detectSkills,
    injectSkills,
    getApiSession,
}
