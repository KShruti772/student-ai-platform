'use client'

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
    BarChart3,
    BookOpen,
    BrainCircuit,
    Briefcase,
    CheckCircle2,
    ChevronDown,
    Clock,
    Code2,
    Download,
    FileJson,
    FileText,
    GitBranch,
    GraduationCap,
    Layers,
    Link as LinkIcon,
    Loader2,
    Network,
    PanelRightOpen,
    RefreshCw,
    Sparkles,
    Target,
    Upload,
    Wand2,
} from 'lucide-react'
import * as api from '../../lib/api'

type Intake = {
    targetCareer: string
    educationLevel: string
    currentSkills: string
    experienceLevel: string
    learningStyle: string
    dailyStudyHours: string
    weeklyAvailability: string
    targetTimeline: string
    interests: string
    preferredLanguages: string
    currentProjects: string
    githubProfile: string
    linkedInProfile: string
    resumeSummary: string
}

type RoadmapTopic = {
    title: string
    explanation?: string
    whyItMatters?: string
    resources?: Record<string, string[]>
}

type RoadmapProject = {
    title: string
    difficulty?: string
    estimatedHours?: string
    techStack?: string[]
    architecture?: string
    resumeValue?: string
}

type RoadmapPhase = {
    title: string
    duration?: string
    objective?: string
    learningOutcomes?: string[]
    concepts?: RoadmapTopic[]
    prerequisites?: string[]
    estimatedStudyHours?: string
    difficulty?: string
    milestone?: string
    realWorldExplanation?: string
    careerRelevance?: string
    expectedSalaryImpact?: string
    practice?: string[]
    interviewQuestions?: string[]
    labs?: string[]
    githubExercises?: string[]
    projects?: RoadmapProject[]
    careerInsights?: string[]
    commonMistakes?: string[]
    companiesHiring?: string[]
    skillsUnlocked?: string[]
}

type Roadmap = {
    title?: string
    summary?: string
    jobReadySignal?: string
    phases?: RoadmapPhase[]
    skillTree?: Array<{ skill: string; dependsOn?: string[]; why?: string }>
    analytics?: {
        weeklyReport?: string
        monthlyReport?: string
    }
}

const EMPTY_INTAKE: Intake = {
    targetCareer: '',
    educationLevel: '',
    currentSkills: '',
    experienceLevel: '',
    learningStyle: '',
    dailyStudyHours: '',
    weeklyAvailability: '',
    targetTimeline: '',
    interests: '',
    preferredLanguages: '',
    currentProjects: '',
    githubProfile: '',
    linkedInProfile: '',
    resumeSummary: '',
}

const STEPS = [
    'Goal',
    'Background',
    'Learning Fit',
    'Portfolio',
]

function splitList(value: unknown): string[] {
    if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
    if (typeof value === 'string') return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean)
    return []
}

function normalizeTopic(value: unknown): RoadmapTopic {
    const item: Record<string, unknown> = value && typeof value === 'object' ? value as Record<string, unknown> : { title: value }
    return {
        title: String(item.title ?? item.name ?? item.topic ?? 'Topic'),
        explanation: item.explanation ? String(item.explanation) : undefined,
        whyItMatters: item.whyItMatters || item.why_it_matters || item.why ? String(item.whyItMatters ?? item.why_it_matters ?? item.why) : undefined,
        resources: item.resources && typeof item.resources === 'object' ? item.resources as Record<string, string[]> : undefined,
    }
}

function normalizeProject(value: unknown): RoadmapProject {
    const item: Record<string, unknown> = value && typeof value === 'object' ? value as Record<string, unknown> : { title: value }
    return {
        title: String(item.title ?? item.name ?? 'Project'),
        difficulty: item.difficulty ? String(item.difficulty) : undefined,
        estimatedHours: item.estimatedHours || item.estimated_hours || item.hours ? String(item.estimatedHours ?? item.estimated_hours ?? item.hours) : undefined,
        techStack: splitList(item.techStack ?? item.tech_stack ?? item.stack),
        architecture: item.architecture ? String(item.architecture) : undefined,
        resumeValue: item.resumeValue || item.resume_value ? String(item.resumeValue ?? item.resume_value) : undefined,
    }
}

function normalizeRoadmap(value: unknown): Roadmap | null {
    if (!value || typeof value !== 'object') return null
    const input = value as Record<string, unknown>
    const phases: RoadmapPhase[] = []
    const rawPhases = Array.isArray(input.phases) ? input.phases : Array.isArray(input.modules) ? input.modules : []

    for (const raw of rawPhases) {
        const item: Record<string, unknown> = raw && typeof raw === 'object' ? raw as Record<string, unknown> : { title: raw }
        const rawConcepts = Array.isArray(item.concepts) ? item.concepts : Array.isArray(item.topics) ? item.topics : []
        phases.push({
            title: String(item.title ?? item.name ?? 'Learning phase'),
            duration: item.duration ? String(item.duration) : undefined,
            objective: item.objective ? String(item.objective) : undefined,
            learningOutcomes: splitList(item.learningOutcomes ?? item.learning_outcomes ?? item.outcomes),
            concepts: rawConcepts.map(normalizeTopic),
            prerequisites: splitList(item.prerequisites),
            estimatedStudyHours: item.estimatedStudyHours || item.estimated_study_hours || item.hours ? String(item.estimatedStudyHours ?? item.estimated_study_hours ?? item.hours) : undefined,
            difficulty: item.difficulty ? String(item.difficulty) : undefined,
            milestone: item.milestone ? String(item.milestone) : undefined,
            realWorldExplanation: item.realWorldExplanation || item.real_world_explanation ? String(item.realWorldExplanation ?? item.real_world_explanation) : undefined,
            careerRelevance: item.careerRelevance || item.career_relevance ? String(item.careerRelevance ?? item.career_relevance) : undefined,
            expectedSalaryImpact: item.expectedSalaryImpact || item.expected_salary_impact ? String(item.expectedSalaryImpact ?? item.expected_salary_impact) : undefined,
            practice: splitList(item.practice ?? item.codingExercises ?? item.coding_exercises ?? item.practiceProblems),
            interviewQuestions: splitList(item.interviewQuestions ?? item.interview_questions),
            labs: splitList(item.labs ?? item.handsOnLabs ?? item.hands_on_labs),
            githubExercises: splitList(item.githubExercises ?? item.github_exercises),
            projects: Array.isArray(item.projects) ? item.projects.map(normalizeProject) : [],
            careerInsights: splitList(item.careerInsights ?? item.career_insights ?? item.companiesUse),
            commonMistakes: splitList(item.commonMistakes ?? item.common_mistakes),
            companiesHiring: splitList(item.companiesHiring ?? item.companies_hiring),
            skillsUnlocked: splitList(item.skillsUnlocked ?? item.skills_unlocked),
        })
    }

    if (!phases.length) return null

    return {
        title: input.title ? String(input.title) : undefined,
        summary: input.summary ? String(input.summary) : undefined,
        jobReadySignal: input.jobReadySignal || input.job_ready_signal ? String(input.jobReadySignal ?? input.job_ready_signal) : undefined,
        phases,
        skillTree: Array.isArray(input.skillTree) ? input.skillTree.map((item: any) => ({
            skill: String(item.skill ?? item.name ?? item.title ?? 'Skill'),
            dependsOn: splitList(item.dependsOn ?? item.depends_on),
            why: item.why ? String(item.why) : undefined,
        })) : [],
        analytics: input.analytics && typeof input.analytics === 'object' ? input.analytics as Roadmap['analytics'] : undefined,
    }
}

function extractJson(payload: unknown): unknown {
    if (payload && typeof payload === 'object') return payload
    if (typeof payload !== 'string') return null
    const fenced = payload.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
    const raw = fenced || payload
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start < 0 || end <= start) return null
    try {
        return JSON.parse(raw.slice(start, end + 1))
    } catch {
        return null
    }
}

function buildPrompt(intake: Intake) {
    return `You are an expert AI Career Mentor. Generate a personalized career roadmap as STRICT JSON only. Do not return Markdown.

Learner profile:
${JSON.stringify(intake, null, 2)}

Return this schema:
{
  "title": "string",
  "summary": "string",
  "jobReadySignal": "string",
  "skillTree": [{"skill":"string","dependsOn":["string"],"why":"string"}],
  "analytics": {"weeklyReport":"string","monthlyReport":"string"},
  "phases": [
    {
      "title": "string",
      "duration": "string",
      "objective": "string",
      "learningOutcomes": ["string"],
      "concepts": [
        {
          "title": "string",
          "explanation": "string",
          "whyItMatters": "string",
          "resources": {
            "officialDocumentation": ["string"],
            "youtubePlaylist": ["string"],
            "freeCourse": ["string"],
            "paidCourse": ["string"],
            "articles": ["string"],
            "books": ["string"],
            "practiceWebsites": ["string"],
            "cheatSheets": ["string"]
          }
        }
      ],
      "prerequisites": ["string"],
      "estimatedStudyHours": "string",
      "difficulty": "string",
      "milestone": "string",
      "realWorldExplanation": "string",
      "careerRelevance": "string",
      "expectedSalaryImpact": "string",
      "practice": ["coding exercises, mini assignments, practice problems"],
      "interviewQuestions": ["string"],
      "labs": ["string"],
      "githubExercises": ["string"],
      "projects": [{"title":"string","difficulty":"string","estimatedHours":"string","techStack":["string"],"architecture":"string","resumeValue":"string"}],
      "careerInsights": ["why companies ask this, where used, companies hiring"],
      "commonMistakes": ["string"],
      "companiesHiring": ["string"],
      "skillsUnlocked": ["string"]
    }
  ]
}

Generate phases based on the target timeline and learner profile. Do not use generic week templates unless the user's timeline requires them.`
}

function downloadFile(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}

function roadmapToMarkdown(roadmap: Roadmap) {
    return [
        `# ${roadmap.title || 'AI Career Roadmap'}`,
        roadmap.summary || '',
        roadmap.jobReadySignal ? `\n## Job-ready signal\n${roadmap.jobReadySignal}` : '',
        ...(roadmap.phases || []).map((phase, index) => [
            `\n## Phase ${index + 1}: ${phase.title}`,
            phase.duration ? `**Duration:** ${phase.duration}` : '',
            phase.objective ? `**Objective:** ${phase.objective}` : '',
            phase.learningOutcomes?.length ? `\n### Outcomes\n${phase.learningOutcomes.map((item) => `- ${item}`).join('\n')}` : '',
            phase.concepts?.length ? `\n### Topics\n${phase.concepts.map((topic) => `- **${topic.title}:** ${topic.explanation || ''} ${topic.whyItMatters ? `Why it matters: ${topic.whyItMatters}` : ''}`).join('\n')}` : '',
            phase.projects?.length ? `\n### Projects\n${phase.projects.map((project) => `- **${project.title}** (${project.difficulty || 'planned'}, ${project.estimatedHours || 'estimate TBD'})`).join('\n')}` : '',
        ].filter(Boolean).join('\n\n')),
    ].filter(Boolean).join('\n\n')
}

function ProgressRing({ value }: { value: number }) {
    return (
        <div className="relative grid h-24 w-24 place-items-center">
            <svg viewBox="0 0 100 100" className="h-24 w-24 rotate-[-90deg]">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10" className="text-secondary" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="url(#roadmapProgress)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${value * 2.64} 264`} />
                <defs>
                    <linearGradient id="roadmapProgress" x1="0" x2="1" y1="0" y2="1">
                        <stop stopColor="#22d3ee" />
                        <stop offset="1" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
            </svg>
            <span className="absolute text-xl font-semibold text-foreground">{value}%</span>
        </div>
    )
}

export default function CareerRoadmapMentor() {
    const [intake, setIntake] = useState<Intake>(EMPTY_INTAKE)
    const [step, setStep] = useState(0)
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
    const [rawResponse, setRawResponse] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedPhase, setSelectedPhase] = useState(0)
    const [openPhase, setOpenPhase] = useState(0)
    const [completed, setCompleted] = useState<Record<string, boolean>>({})
    const [mentorNote, setMentorNote] = useState('')
    const [autoAdapt, setAutoAdapt] = useState(true)
    const generatedOnce = useRef(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const phases = useMemo(() => roadmap?.phases || [], [roadmap])
    const selected = phases[selectedPhase] || phases[0]
    const checklistItems = useMemo(() => phases.flatMap((phase, phaseIndex) => [
        ...(phase.concepts || []).map((topic, index) => ({ id: `p${phaseIndex}-topic-${index}`, label: topic.title, hours: 2 })),
        ...(phase.projects || []).map((project, index) => ({ id: `p${phaseIndex}-project-${index}`, label: project.title, hours: Number.parseInt(project.estimatedHours || '6', 10) || 6 })),
        ...(phase.practice || []).map((item, index) => ({ id: `p${phaseIndex}-practice-${index}`, label: item, hours: 1 })),
    ]), [phases])
    const completedCount = checklistItems.filter((item) => completed[item.id]).length
    const completion = checklistItems.length ? Math.round((completedCount / checklistItems.length) * 100) : 0
    const totalHours = checklistItems.reduce((sum, item) => sum + item.hours, 0)
    const completedHours = checklistItems.filter((item) => completed[item.id]).reduce((sum, item) => sum + item.hours, 0)
    const projectCount = phases.reduce((sum, phase) => sum + (phase.projects?.length || 0), 0)
    const topicCount = phases.reduce((sum, phase) => sum + (phase.concepts?.length || 0), 0)

    function update(key: keyof Intake, value: string) {
        setIntake((current) => ({ ...current, [key]: value }))
    }

    const generate = useCallback(async (reason = 'manual') => {
        if (!intake.targetCareer.trim()) {
            setError('Add a target career so the AI mentor can personalize the roadmap.')
            return
        }
        setLoading(true)
        setError('')
        setRawResponse('')
        try {
            const result = await api.sendMentorMessage(buildPrompt(intake))
            const parsed = extractJson(result.response)
            const normalized = normalizeRoadmap(parsed)
            if (!normalized) {
                setRawResponse(typeof result.response === 'string' ? result.response : JSON.stringify(result.response, null, 2))
                setError('The backend responded, but not with roadmap JSON. Ask the mentor to regenerate structured JSON.')
                return
            }
            setRoadmap(normalized)
            setSelectedPhase(0)
            setOpenPhase(0)
            generatedOnce.current = true
            setMentorNote(reason === 'auto' ? 'Roadmap adapted to your latest profile changes.' : 'Roadmap generated from your learner profile.')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not reach the AI backend.')
        } finally {
            setLoading(false)
        }
    }, [intake])

    useEffect(() => {
        if (!autoAdapt || !generatedOnce.current) return
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => generate('auto'), 1200)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [autoAdapt, generate, intake])

    async function readResume(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return
        const text = await file.text().catch(() => '')
        update('resumeSummary', text.slice(0, 6000) || `Uploaded resume file: ${file.name}`)
    }

    function mentorAction(action: string, context?: string) {
        const phase = context || selected?.title || intake.targetCareer || 'this roadmap'
        setMentorNote(`${action}: ask the mentor to focus on "${phase}". This action will use the generated roadmap context.`)
    }

    function exportJson() {
        if (!roadmap) return
        downloadFile('career-roadmap.json', JSON.stringify(roadmap, null, 2), 'application/json')
    }

    function exportMarkdown() {
        if (!roadmap) return
        downloadFile('career-roadmap.md', roadmapToMarkdown(roadmap), 'text/markdown')
    }

    function shareLink() {
        const payload = encodeURIComponent(JSON.stringify({ intake, roadmap }).slice(0, 4000))
        navigator.clipboard?.writeText(`${window.location.origin}/career-roadmap?plan=${payload}`)
        setMentorNote('Shareable link copied to clipboard.')
    }

    const stepProgress = Math.round(((step + 1) / STEPS.length) * 100)

    return (
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10">
                <div className="relative grid gap-6 p-5 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:p-7">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(139,92,246,0.16),transparent_26%)]" />
                    <div className="relative">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
                            <BrainCircuit size={14} /> AI Career Mentor
                        </div>
                        <h1 className="mt-4 max-w-4xl text-3xl font-semibold text-foreground sm:text-5xl">Build a roadmap that explains what to learn, why it matters, and when you are job-ready.</h1>
                        <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">Complete the guided profile, then the backend AI generates a structured learning plan with phases, topics, resources, practice, projects, career insights, and progress tracking.</p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <button onClick={() => generate()} disabled={loading} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 px-5 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60">
                                {loading ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />} Generate personalized roadmap
                            </button>
                            <label className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-2xl border border-border bg-background/70 px-5 text-sm font-medium text-foreground transition hover:bg-secondary">
                                <Upload size={17} /> Upload resume
                                <input type="file" className="hidden" accept=".txt,.md,.pdf,.doc,.docx" onChange={readResume} />
                            </label>
                        </div>
                    </div>
                    <div className="relative rounded-2xl border border-border bg-background/70 p-4 backdrop-blur">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold text-foreground">Profile readiness</div>
                                <div className="mt-1 text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}: {STEPS[step]}</div>
                            </div>
                            <div className="text-sm text-cyan-100">{stepProgress}%</div>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500 transition-[width]" style={{ width: `${stepProgress}%` }} />
                        </div>
                        <div className="mt-4 flex items-center justify-between rounded-2xl bg-secondary p-3 text-sm">
                            <span className="text-muted-foreground">Smart adaptation</span>
                            <button onClick={() => setAutoAdapt((value) => !value)} className={`rounded-full px-3 py-1 text-xs font-medium ${autoAdapt ? 'bg-emerald-400/15 text-emerald-200' : 'bg-secondary text-muted-foreground'}`}>{autoAdapt ? 'On' : 'Off'}</button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[400px_minmax(0,1fr)_300px]">
                <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xl shadow-black/5">
                        <div className="mb-4 flex gap-2">
                            {STEPS.map((label, index) => (
                                <button key={label} onClick={() => setStep(index)} className={`flex-1 rounded-xl px-2 py-2 text-xs font-medium transition ${step === index ? 'bg-cyan-300/15 text-cyan-100' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{label}</button>
                            ))}
                        </div>
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div key={step} initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                {step === 0 && (
                                    <>
                                        <Input label="Target career" value={intake.targetCareer} onChange={(value) => update('targetCareer', value)} placeholder="AI engineer, data scientist, product designer..." />
                                        <Input label="Target timeline" value={intake.targetTimeline} onChange={(value) => update('targetTimeline', value)} placeholder="6 months, 12 weeks, before campus placements..." />
                                        <Input label="Interests" value={intake.interests} onChange={(value) => update('interests', value)} placeholder="LLMs, robotics, fintech, SaaS, healthcare..." multiline />
                                    </>
                                )}
                                {step === 1 && (
                                    <>
                                        <Input label="Current education level" value={intake.educationLevel} onChange={(value) => update('educationLevel', value)} placeholder="B.Tech 2nd year, bootcamp, self-taught..." />
                                        <Input label="Experience level" value={intake.experienceLevel} onChange={(value) => update('experienceLevel', value)} placeholder="Beginner, intermediate, internship experience..." />
                                        <Input label="Current skills" value={intake.currentSkills} onChange={(value) => update('currentSkills', value)} placeholder="Python, React, SQL, DSA basics..." multiline />
                                    </>
                                )}
                                {step === 2 && (
                                    <>
                                        <Input label="Preferred learning style" value={intake.learningStyle} onChange={(value) => update('learningStyle', value)} placeholder="Projects, videos, docs, quizzes, pair learning..." />
                                        <Input label="Daily study hours" value={intake.dailyStudyHours} onChange={(value) => update('dailyStudyHours', value)} placeholder="2 hours/day" />
                                        <Input label="Weekly availability" value={intake.weeklyAvailability} onChange={(value) => update('weeklyAvailability', value)} placeholder="Weekdays evenings, weekends..." />
                                        <Input label="Preferred programming languages" value={intake.preferredLanguages} onChange={(value) => update('preferredLanguages', value)} placeholder="Python, JavaScript, Java, C++..." />
                                    </>
                                )}
                                {step === 3 && (
                                    <>
                                        <Input label="Current projects" value={intake.currentProjects} onChange={(value) => update('currentProjects', value)} placeholder="Portfolio site, chatbot, ML classifier..." multiline />
                                        <Input label="GitHub profile" value={intake.githubProfile} onChange={(value) => update('githubProfile', value)} placeholder="https://github.com/you" />
                                        <Input label="LinkedIn profile" value={intake.linkedInProfile} onChange={(value) => update('linkedInProfile', value)} placeholder="https://linkedin.com/in/you" />
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                        <div className="mt-4 flex gap-2">
                            <button onClick={() => setStep((value) => Math.max(0, value - 1))} className="h-11 flex-1 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary">Back</button>
                            <button onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))} className="h-11 flex-1 rounded-xl bg-secondary text-sm font-medium text-foreground hover:bg-secondary">Next</button>
                        </div>
                        {error && <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>}
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="font-semibold text-foreground">Progress analytics</div>
                            <BarChart3 size={17} className="text-cyan-200" />
                        </div>
                        <div className="mt-4 grid place-items-center"><ProgressRing value={completion} /></div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <Metric label="Study streak" value={completedCount ? 'Active' : 'Not started'} />
                            <Metric label="Hours invested" value={`${completedHours}/${totalHours}`} />
                            <Metric label="Topics" value={`${completedCount}/${topicCount || 0}`} />
                            <Metric label="Projects" value={`${projectCount}`} />
                        </div>
                    </div>
                </aside>

                <main className="min-w-0 space-y-5">
                    {!roadmap ? (
                        <div className="grid min-h-[520px] place-items-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                            <div className="max-w-xl">
                                <GraduationCap className="mx-auto h-12 w-12 text-cyan-200" />
                                <h2 className="mt-4 text-2xl font-semibold text-foreground">Your AI-generated roadmap will appear here.</h2>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">The UI is ready to render phases, dependency graphs, resources, projects, checklists, milestones, and interview preparation from backend roadmap JSON.</p>
                                {rawResponse && <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-secondary p-3 text-left text-xs text-muted-foreground">{rawResponse}</pre>}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-2xl border border-border bg-card p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <div className="text-sm text-cyan-100">Personalized plan</div>
                                        <h2 className="mt-2 text-3xl font-semibold text-foreground">{roadmap.title || `${intake.targetCareer} Roadmap`}</h2>
                                        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{roadmap.summary}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <ExportButton icon={FileJson} label="JSON" onClick={exportJson} />
                                        <ExportButton icon={FileText} label="Markdown" onClick={exportMarkdown} />
                                        <ExportButton icon={Download} label="PDF" onClick={() => window.print()} />
                                        <ExportButton icon={LinkIcon} label="Share" onClick={shareLink} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {phases.map((phase, phaseIndex) => {
                                    const phaseItems = checklistItems.filter((item) => item.id.startsWith(`p${phaseIndex}-`))
                                    const phaseDone = phaseItems.filter((item) => completed[item.id]).length
                                    const phaseProgress = phaseItems.length ? Math.round((phaseDone / phaseItems.length) * 100) : 0
                                    const open = openPhase === phaseIndex
                                    return (
                                        <motion.article key={`${phase.title}-${phaseIndex}`} layout initial={false} className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/5">
                                            <button onClick={() => { setOpenPhase(open ? -1 : phaseIndex); setSelectedPhase(phaseIndex) }} className="flex w-full flex-col gap-4 p-5 text-left lg:flex-row lg:items-center">
                                                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-100"><Layers size={20} /></div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                        {phase.duration && <span className="rounded-full bg-secondary px-2 py-1"><Clock size={12} className="mr-1 inline" />{phase.duration}</span>}
                                                        {phase.difficulty && <span className="rounded-full bg-secondary px-2 py-1">{phase.difficulty}</span>}
                                                        {phase.estimatedStudyHours && <span className="rounded-full bg-secondary px-2 py-1">{phase.estimatedStudyHours}</span>}
                                                    </div>
                                                    <h3 className="mt-2 text-xl font-semibold text-foreground">{phase.title}</h3>
                                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{phase.objective}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-28">
                                                        <div className="mb-1 text-right text-xs text-cyan-100">{phaseProgress}%</div>
                                                        <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${phaseProgress}%` }} /></div>
                                                    </div>
                                                    <ChevronDown className={`text-muted-foreground transition ${open ? 'rotate-180' : ''}`} size={18} />
                                                </div>
                                            </button>
                                            <AnimatePresence initial={false}>
                                                {open && (
                                                    <motion.div initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-border p-5">
                                                        <PhaseDetails phase={phase} phaseIndex={phaseIndex} completed={completed} setCompleted={setCompleted} onMentorAction={mentorAction} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.article>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </main>

                <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center gap-2 font-semibold text-foreground"><Network size={17} className="text-cyan-200" /> Skill tree</div>
                        <div className="mt-4 space-y-3">
                            {(roadmap?.skillTree || []).length ? roadmap?.skillTree?.map((node, index) => (
                                <div key={`${node.skill}-${index}`} className="relative rounded-2xl border border-border bg-secondary p-3">
                                    {index > 0 && <div className="absolute -top-3 left-5 h-3 w-px bg-cyan-300/40" />}
                                    <div className="flex items-center gap-2 text-sm font-medium text-foreground"><GitBranch size={14} className="text-cyan-200" />{node.skill}</div>
                                    {node.dependsOn?.length ? <div className="mt-1 text-xs text-muted-foreground">Depends on {node.dependsOn.join(', ')}</div> : null}
                                    {node.why && <div className="mt-2 text-xs leading-5 text-muted-foreground">{node.why}</div>}
                                </div>
                            )) : <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">Generated skill dependencies will appear after the AI returns roadmap JSON.</div>}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center gap-2 font-semibold text-foreground"><PanelRightOpen size={17} className="text-cyan-200" /> AI mentor actions</div>
                        <div className="mt-4 grid gap-2">
                            {['Ask Mentor', 'Explain Topic', 'Generate Notes', 'Quiz Me', 'Generate Flashcards', 'Interview Questions', 'Revision Plan'].map((action) => (
                                <button key={action} onClick={() => mentorAction(action)} className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-left text-sm text-muted-foreground transition hover:text-foreground">
                                    <Wand2 size={14} className="text-cyan-200" /> {action}
                                </button>
                            ))}
                        </div>
                        {mentorNote && <div className="mt-4 rounded-xl bg-cyan-300/10 p-3 text-sm leading-6 text-cyan-50">{mentorNote}</div>}
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4">
                        <div className="font-semibold text-foreground">Weekly report</div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{roadmap?.analytics?.weeklyReport || 'Complete roadmap actions to unlock a weekly consistency report.'}</p>
                        <div className="mt-4 font-semibold text-foreground">Monthly report</div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{roadmap?.analytics?.monthlyReport || 'The AI mentor will summarize skill growth, portfolio readiness, and interview focus.'}</p>
                    </div>
                </aside>
            </div>
        </div>
    )
}

function Input({ label, value, onChange, placeholder, multiline = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; multiline?: boolean }) {
    const className = "mt-2 w-full rounded-2xl border border-border bg-background p-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cyan-300/40"
    return (
        <label className="block">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            {multiline ? (
                <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} className={className} />
            ) : (
                <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={className} />
            )}
        </label>
    )
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-secondary p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
        </div>
    )
}

function ExportButton({ icon: Icon, label, onClick }: { icon: typeof Download; label: string; onClick: () => void }) {
    return <button onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-secondary px-3 text-sm text-muted-foreground transition hover:text-foreground"><Icon size={15} />{label}</button>
}

function PhaseDetails({ phase, phaseIndex, completed, setCompleted, onMentorAction }: { phase: RoadmapPhase; phaseIndex: number; completed: Record<string, boolean>; setCompleted: React.Dispatch<React.SetStateAction<Record<string, boolean>>>; onMentorAction: (action: string, context?: string) => void }) {
    const checkItems = [
        ...(phase.concepts || []).map((topic, index) => ({ id: `p${phaseIndex}-topic-${index}`, label: topic.title })),
        ...(phase.projects || []).map((project, index) => ({ id: `p${phaseIndex}-project-${index}`, label: project.title })),
        ...(phase.practice || []).map((item, index) => ({ id: `p${phaseIndex}-practice-${index}`, label: item })),
    ]

    return (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
                <InfoGrid phase={phase} />
                <Section title="Topics" icon={BookOpen}>
                    <div className="grid gap-3">
                        {(phase.concepts || []).map((topic) => (
                            <div key={topic.title} className="rounded-2xl border border-border bg-secondary p-4">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <div className="font-semibold text-foreground">{topic.title}</div>
                                        {topic.explanation && <p className="mt-2 text-sm leading-6 text-muted-foreground">{topic.explanation}</p>}
                                        {topic.whyItMatters && <p className="mt-2 text-sm leading-6 text-cyan-50">Why it matters: {topic.whyItMatters}</p>}
                                    </div>
                                    <button onClick={() => onMentorAction('Explain Topic', topic.title)} className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground">Explain</button>
                                </div>
                                {topic.resources && <ResourceGrid resources={topic.resources} />}
                            </div>
                        ))}
                    </div>
                </Section>
                <Section title="Practice and interview prep" icon={Code2}>
                    <ListBlock title="Coding exercises and assignments" items={phase.practice} />
                    <ListBlock title="Hands-on labs" items={phase.labs} />
                    <ListBlock title="GitHub exercises" items={phase.githubExercises} />
                    <ListBlock title="Real interview questions" items={phase.interviewQuestions} />
                </Section>
                <Section title="Projects" icon={Briefcase}>
                    <div className="grid gap-3 md:grid-cols-2">
                        {(phase.projects || []).map((project) => (
                            <div key={project.title} className="rounded-2xl border border-border bg-secondary p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="font-semibold text-foreground">{project.title}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">{project.difficulty || 'Difficulty TBD'} · {project.estimatedHours || 'Hours TBD'}</div>
                                    </div>
                                    <Target size={17} className="text-cyan-200" />
                                </div>
                                {project.techStack?.length ? <div className="mt-3 flex flex-wrap gap-2">{project.techStack.map((tech) => <span key={tech} className="rounded-full bg-background px-2 py-1 text-xs text-muted-foreground">{tech}</span>)}</div> : null}
                                {project.architecture && <p className="mt-3 text-sm leading-6 text-muted-foreground">{project.architecture}</p>}
                                {project.resumeValue && <p className="mt-3 text-sm leading-6 text-cyan-50">Resume value: {project.resumeValue}</p>}
                            </div>
                        ))}
                    </div>
                </Section>
                <Section title="Career insights and milestone" icon={CheckCircle2}>
                    <ListBlock title="Why companies care" items={phase.careerInsights} />
                    <ListBlock title="Companies hiring" items={phase.companiesHiring} />
                    <ListBlock title="Common mistakes" items={phase.commonMistakes} />
                    <div className="rounded-2xl bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-50">
                        <div className="font-semibold">Congratulations milestone</div>
                        <p className="mt-2">{phase.milestone || 'Finish this phase to unlock the next level of the roadmap.'}</p>
                        {phase.skillsUnlocked?.length ? <p className="mt-2">Skills unlocked: {phase.skillsUnlocked.join(', ')}</p> : null}
                    </div>
                </Section>
            </div>
            <aside className="space-y-3">
                <div className="rounded-2xl border border-border bg-secondary p-4">
                    <div className="font-semibold text-foreground">Interactive checklist</div>
                    <div className="mt-3 space-y-2">
                        {checkItems.map((item) => (
                            <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-xl bg-background/70 p-3 text-sm text-muted-foreground">
                                <input type="checkbox" checked={Boolean(completed[item.id])} onChange={(event) => setCompleted((state) => ({ ...state, [item.id]: event.target.checked }))} className="mt-1" />
                                <span className={completed[item.id] ? 'line-through' : ''}>{item.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    )
}

function InfoGrid({ phase }: { phase: RoadmapPhase }) {
    const items = [
        ['Prerequisites', phase.prerequisites?.join(', ')],
        ['Learning outcomes', phase.learningOutcomes?.join(', ')],
        ['Real-world use', phase.realWorldExplanation],
        ['Career relevance', phase.careerRelevance],
        ['Salary impact', phase.expectedSalaryImpact],
    ].filter(([, value]) => value)

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {items.map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-secondary p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
                    <div className="mt-2 text-sm leading-6 text-foreground">{value}</div>
                </div>
            ))}
        </div>
    )
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof BookOpen; children: React.ReactNode }) {
    return (
        <section>
            <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground"><Icon size={18} className="text-cyan-200" />{title}</div>
            {children}
        </section>
    )
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
    if (!items?.length) return null
    return (
        <div className="mb-3 rounded-2xl bg-secondary p-4">
            <div className="text-sm font-semibold text-foreground">{title}</div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                {items.map((item) => <li key={item}>- {item}</li>)}
            </ul>
        </div>
    )
}

function ResourceGrid({ resources }: { resources: Record<string, string[]> }) {
    const entries = Object.entries(resources).filter(([, values]) => Array.isArray(values) && values.length)
    if (!entries.length) return null
    return (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
            {entries.map(([label, values]) => (
                <div key={label} className="rounded-xl bg-background/70 p-3">
                    <div className="text-xs font-semibold capitalize text-cyan-100">{label.replace(/([A-Z])/g, ' $1')}</div>
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
                        {values.map((value) => <li key={value}>{value}</li>)}
                    </ul>
                </div>
            ))}
        </div>
    )
}
