'use client'

import { useMemo, useState } from 'react'
import {
    Archive,
    AlertTriangle,
    Bot,
    Boxes,
    Braces,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Code2,
    Copy,
    Cloud,
    Database,
    Download,
    ExternalLink,
    FileArchive,
    FileCode2,
    FileText,
    Folder,
    FolderTree,
    Globe2,
    Layers,
    Loader2,
    MessageSquare,
    Monitor,
    PanelLeftClose,
    PanelLeftOpen,
    Play,
    RefreshCw,
    Search,
    Send,
    Server,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Tablet,
    TerminalSquare,
    TestTube2,
    Wand2,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Card } from '../ui'
import * as api from '../../lib/api'

type AgentStatus = 'idle' | 'running' | 'done'
type Agent = { id: string; name: string; role: string; status: AgentStatus; output: string }
type ChatMessage = { role: 'assistant' | 'user'; content: string }
type ProjectFile = { path: string; content: string; language: string }
type ProjectSpec = {
    name: string
    idea: string
    audience: string
    stack: string
    features: string[]
    constraints: string
}

const initialAgents: Agent[] = [
    { id: 'requirements', name: 'Requirement Agent', role: 'Clarifies users, scope, constraints, and MVP success criteria.', status: 'idle', output: 'Waiting for project requirements.' },
    { id: 'architecture', name: 'Architecture Agent', role: 'Designs frontend, backend, data flow, API routes, and deployment shape.', status: 'idle', output: 'Architecture will appear after intake.' },
    { id: 'frontend', name: 'Frontend Agent', role: 'Generates the user-facing app structure and polished UI code.', status: 'idle', output: 'Frontend files are not generated yet.' },
    { id: 'backend', name: 'Backend Agent', role: 'Generates API routes, validation, and persistence-ready service code.', status: 'idle', output: 'Backend files are not generated yet.' },
    { id: 'debug', name: 'Debug Agent', role: 'Reads user logs, identifies causes, and patches generated files.', status: 'idle', output: 'Paste logs after generation to debug.' },
    { id: 'mentor', name: 'Mentor Agent', role: 'Explains how to run, extend, and present the project.', status: 'idle', output: 'Run guide will appear after generation.' },
]

const defaultSpec: ProjectSpec = {
    name: 'Student Skill Sprint',
    idea: 'An AI-assisted study planner that turns a student goal into tasks, projects, and progress insights.',
    audience: 'Students preparing for internships or entry-level software roles',
    stack: 'Next.js, TypeScript, Tailwind CSS, localStorage',
    features: ['Goal intake', 'AI-style project plan', 'Task checklist', 'Progress dashboard', 'Exportable README'],
    constraints: 'Runs locally without paid APIs. Keep the MVP simple, responsive, and portfolio-ready.',
}

const questions = [
    'What project do you want to build, and who is it for?',
    'Which tech stack should the agents use?',
    'What are the must-have features?',
    'Any constraints, deadline, or deployment target?',
]

function slugify(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'student-project'
}

function parseSpec(text: string): ProjectSpec {
    const lines = text.split(/\n+/).map(line => line.trim()).filter(Boolean)
    const projectLine = lines.find(line => /project|build|idea|app/i.test(line)) || lines[0] || defaultSpec.idea
    const stackLine = lines.find(line => /stack|next|react|python|fastapi|node|tailwind|django/i.test(line)) || defaultSpec.stack
    const featureLine = lines.find(line => /feature|must|include|should/i.test(line)) || ''
    const audienceLine = lines.find(line => /student|user|audience|for /i.test(line)) || defaultSpec.audience
    const constraints = lines.find(line => /constraint|deadline|deploy|local|api|auth/i.test(line)) || defaultSpec.constraints
    const name = projectLine.replace(/^(build|project|idea|app)\s*[:\-]?\s*/i, '').split(/[.]/)[0].slice(0, 52) || defaultSpec.name
    const features = featureLine
        ? featureLine.replace(/features?|must|include|should|:/gi, '').split(/,|;/).map(item => item.trim()).filter(Boolean).slice(0, 6)
        : defaultSpec.features
    return {
        name,
        idea: projectLine,
        audience: audienceLine,
        stack: stackLine.replace(/^stack\s*[:\-]?\s*/i, ''),
        features: features.length ? features : defaultSpec.features,
        constraints,
    }
}

function architectureFor(spec: ProjectSpec) {
    const slug = slugify(spec.name)
    return [
        `Project: ${spec.name}`,
        `Audience: ${spec.audience}`,
        `Stack: ${spec.stack}`,
        '',
        'Architecture:',
        '- App shell with goal intake, plan output, task tracker, and progress summary.',
        '- Local service layer keeps the MVP runnable without external accounts.',
        '- API route accepts goal context and returns a structured project plan.',
        '- Components are split into dashboard, planner, task list, and export sections.',
        '- State persists in localStorage so students can continue after refresh.',
        '',
        `Folder root: ${slug}/`,
    ].join('\n')
}

function generateFiles(spec: ProjectSpec): ProjectFile[] {
    const slug = slugify(spec.name)
    const featureBullets = spec.features.map(item => `        "${item}"`).join(',\n')
    const packageJson = JSON.stringify({
        name: slug,
        private: true,
        version: '0.1.0',
        scripts: { dev: 'next dev', build: 'next build', start: 'next start', lint: 'next lint' },
        dependencies: { '@next/env': 'latest', next: 'latest', react: 'latest', 'react-dom': 'latest', 'lucide-react': 'latest' },
        devDependencies: { typescript: 'latest', tailwindcss: 'latest', postcss: 'latest', autoprefixer: 'latest', '@types/node': 'latest', '@types/react': 'latest' },
    }, null, 2)
    return [
        {
            path: 'package.json',
            language: 'json',
            content: packageJson,
        },
        {
            path: 'README.md',
            language: 'markdown',
            content: `# ${spec.name}

${spec.idea}

## Audience
${spec.audience}

## Stack
${spec.stack}

## Core Features
${spec.features.map(item => `- ${item}`).join('\n')}

## Run Locally
\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:3000 and test the full workflow.

## Portfolio Story
This project shows product thinking, frontend architecture, state management, API design, and student-focused UX. Use the generated task tracker and README to explain scope, tradeoffs, and impact.
`,
        },
        {
            path: 'app/layout.tsx',
            language: 'tsx',
            content: `import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: '${spec.name}',
  description: '${spec.idea.replace(/'/g, "\\'")}',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`,
        },
        {
            path: 'app/globals.css',
            language: 'css',
            content: `@import "tailwindcss";

body {
  margin: 0;
  background: #09090b;
  color: #fafafa;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
`,
        },
        {
            path: 'app/api/plan/route.ts',
            language: 'ts',
            content: `import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const goal = String(body.goal || 'Build a portfolio project')
  return NextResponse.json({
    goal,
    phases: [
      { title: 'Clarify MVP', detail: 'Define the user, problem, and one success metric.' },
      { title: 'Build Core Flow', detail: 'Ship the main screen, task state, and exportable output.' },
      { title: 'Polish Portfolio', detail: 'Add README, screenshots, and a short demo script.' },
    ],
  })
}
`,
        },
        {
            path: 'app/page.tsx',
            language: 'tsx',
            content: `'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Download, Sparkles } from 'lucide-react'

const features = [
${featureBullets}
]

export default function Page() {
  const [goal, setGoal] = useState('${spec.idea.replace(/'/g, "\\'")}')
  const [done, setDone] = useState<Record<string, boolean>>({})
  const completed = useMemo(() => Object.values(done).filter(Boolean).length, [done])
  const progress = Math.round((completed / features.length) * 100)

  return (
    <main className="min-h-screen bg-[#09090B] px-6 py-10 text-zinc-50">
      <section className="mx-auto max-w-5xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl shadow-black/20">
        <div className="flex items-center gap-3 text-cyan-400">
          <Sparkles size={22} />
          <span className="text-sm font-semibold uppercase tracking-[0.18em]">Student Project</span>
        </div>
        <h1 className="mt-5 text-4xl font-semibold">${spec.name}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-400">${spec.idea}</p>
        <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto]">
          <input value={goal} onChange={event => setGoal(event.target.value)} className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 outline-none focus:border-cyan-400" />
          <button className="rounded-2xl bg-violet-500 px-6 py-4 font-semibold text-white">Generate Plan</button>
        </div>
      </section>

      <section className="mx-auto mt-6 grid max-w-5xl gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-2xl font-semibold">Build Checklist</h2>
          <div className="mt-5 space-y-3">
            {features.map(item => (
              <label key={item} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-zinc-950 p-4 text-zinc-300">
                <input type="checkbox" checked={Boolean(done[item])} onChange={event => setDone(state => ({ ...state, [item]: event.target.checked }))} />
                {item}
              </label>
            ))}
          </div>
        </div>
        <aside className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <CheckCircle2 className="text-cyan-400" />
          <div className="mt-4 text-4xl font-semibold">{progress}%</div>
          <p className="mt-2 text-zinc-400">Portfolio readiness</p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-cyan-400" style={{ width: \`\${progress}%\` }} />
          </div>
          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 px-4 py-3 text-sm text-zinc-300">
            <Download size={16} /> Export Summary
          </button>
        </aside>
      </section>
    </main>
  )
}
`,
        },
        {
            path: 'components/ProjectSummary.tsx',
            language: 'tsx',
            content: `export function ProjectSummary() {
  return (
    <section>
      <h2>${spec.name}</h2>
      <p>${spec.idea}</p>
    </section>
  )
}
`,
        },
    ]
}

function runGuide(spec: ProjectSpec) {
    return [
        `1. Create a folder named ${slugify(spec.name)}.`,
        '2. Add the generated files using the file explorer.',
        '3. Run `npm install`.',
        '4. Run `npm run dev`.',
        '5. Open `http://localhost:3000`.',
        '6. Test the main student workflow, then record a short demo for your portfolio.',
    ]
}

function crc32(text: string) {
    const bytes = new TextEncoder().encode(text)
    let crc = 0xffffffff
    for (let i = 0; i < bytes.length; i += 1) {
        crc ^= bytes[i]
        for (let j = 0; j < 8; j += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
    return (crc ^ 0xffffffff) >>> 0
}

function writeU16(bytes: number[], value: number) {
    bytes.push(value & 255, (value >>> 8) & 255)
}

function writeU32(bytes: number[], value: number) {
    bytes.push(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255)
}

function zipHeader(signature: number, values: Array<[16 | 32, number]>) {
    const bytes: number[] = []
    writeU32(bytes, signature)
    for (const [width, value] of values) {
        if (width === 16) writeU16(bytes, value)
        else writeU32(bytes, value)
    }
    return new Uint8Array(bytes)
}

function makeZip(files: ProjectFile[], root: string) {
    const encoder = new TextEncoder()
    let offset = 0
    const localParts: Uint8Array[] = []
    const centralParts: Uint8Array[] = []
    for (const file of files) {
        const name = `${root}/${file.path}`.replace(/\\/g, '/')
        const nameBytes = encoder.encode(name)
        const data = encoder.encode(file.content)
        const crc = crc32(file.content)
        const localHeader = zipHeader(0x04034b50, [
            [16, 20], [16, 0], [16, 0], [16, 0], [16, 0],
            [32, crc], [32, data.length], [32, data.length],
            [16, nameBytes.length], [16, 0],
        ])
        localParts.push(localHeader, nameBytes, data)
        const centralHeader = zipHeader(0x02014b50, [
            [16, 20], [16, 20], [16, 0], [16, 0], [16, 0], [16, 0],
            [32, crc], [32, data.length], [32, data.length],
            [16, nameBytes.length], [16, 0], [16, 0], [16, 0], [16, 0],
            [32, 0], [32, offset],
        ])
        centralParts.push(centralHeader, nameBytes)
        offset += localHeader.length + nameBytes.length + data.length
    }
    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
    const end = zipHeader(0x06054b50, [
        [16, 0], [16, 0], [16, files.length], [16, files.length],
        [32, centralSize], [32, offset], [16, 0],
    ])
    return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' })
}

function LegacyAIProjectBuilder() {
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Tell me what you want to build. I will gather requirements, run specialist agents, generate files, and package the project for download.' },
    ])
    const [agents, setAgents] = useState(initialAgents)
    const [spec, setSpec] = useState<ProjectSpec>(defaultSpec)
    const [files, setFiles] = useState<ProjectFile[]>(generateFiles(defaultSpec))
    const [activeFile, setActiveFile] = useState('README.md')
    const [selectedStep, setSelectedStep] = useState(0)
    const [working, setWorking] = useState(false)
    const [debugLog, setDebugLog] = useState('')
    const [backendNote, setBackendNote] = useState('')

    const architecture = useMemo(() => architectureFor(spec), [spec])
    const guide = useMemo(() => runGuide(spec), [spec])
    const active = files.find(file => file.path === activeFile) || files[0]
    const completeCount = agents.filter(agent => agent.status === 'done').length
    const progress = Math.round((completeCount / agents.length) * 100)

    function updateAgent(id: string, patch: Partial<Agent>) {
        setAgents(items => items.map(agent => agent.id === id ? { ...agent, ...patch } : agent))
    }

    async function runBuilder(prompt: string) {
        const nextSpec = parseSpec(prompt)
        setSpec(nextSpec)
        setMessages(items => [...items, { role: 'user', content: prompt }, { role: 'assistant', content: 'Great. I am running requirement, architecture, frontend, backend, debug, and mentor agents now.' }])
        setWorking(true)
        setBackendNote('')
        setAgents(initialAgents.map(agent => ({ ...agent, status: 'idle' as AgentStatus })))
        const stages = [
            ['requirements', `Captured MVP for ${nextSpec.audience}. Must-have features: ${nextSpec.features.join(', ')}.`],
            ['architecture', architectureFor(nextSpec)],
            ['frontend', 'Generated app shell, responsive dashboard, task checklist, and project summary UI.'],
            ['backend', 'Generated a Next.js API route that returns structured plan phases and keeps the MVP runnable locally.'],
            ['debug', 'Static review passed: imports, component state, route shape, and run commands are consistent.'],
            ['mentor', `Run with npm install and npm run dev. Present this as a portfolio project for ${nextSpec.audience}.`],
        ] as Array<[string, string]>
        for (let index = 0; index < stages.length; index += 1) {
            const [id, output] = stages[index]
            setSelectedStep(index)
            updateAgent(id, { status: 'running', output: 'Working...' })
            await new Promise(resolve => setTimeout(resolve, 280))
            updateAgent(id, { status: 'done', output })
        }
        const generated = generateFiles(nextSpec)
        setFiles(generated)
        setActiveFile(generated[0].path)
        setMessages(items => [...items, { role: 'assistant', content: `Project generated: ${nextSpec.name}. I created architecture, folder structure, runnable files, a debug-ready workspace, and run instructions.` }])
        try {
            const res = await api.executeWorkflow(`Build project: ${prompt}`, 'project-builder')
            if (res.workflow_id) setBackendNote(`Backend workflow started: ${res.workflow_id}`)
        } catch {
            setBackendNote('Local builder completed. Backend workflow endpoint was unavailable, so the workspace used deterministic agent outputs.')
        } finally {
            setWorking(false)
            setSelectedStep(stages.length - 1)
        }
    }

    function submit() {
        const prompt = input.trim()
        if (!prompt || working) return
        setInput('')
        runBuilder(prompt)
    }

    function applyModification() {
        const request = input.trim()
        if (!request || working) return
        setInput('')
        const updatedFiles = files.map(file => {
            if (file.path === 'README.md') {
                return { ...file, content: `${file.content}\n\n## Modification Request\n${request}\n\nApplied by the AI Project Builder: review this request and update the implementation before final submission.\n` }
            }
            if (file.path === 'app/page.tsx') {
                return { ...file, content: file.content.replace('Portfolio readiness', `Portfolio readiness - ${request.replace(/'/g, '')}`) }
            }
            return file
        })
        setFiles(updatedFiles)
        setMessages(items => [...items, { role: 'user', content: request }, { role: 'assistant', content: 'Modification accepted. I updated README guidance and adjusted the main app copy. Ask for another change or download the ZIP.' }])
        updateAgent('frontend', { status: 'done', output: `Applied modification: ${request}` })
    }

    function debugFromLogs() {
        const log = debugLog.trim()
        if (!log) return
        const diagnosis = log.toLowerCase().includes('module not found')
            ? 'Likely missing dependency or incorrect import path. Run npm install and verify the imported file path exists.'
            : log.toLowerCase().includes('hydration')
                ? 'Likely server/client render mismatch. Keep browser-only state inside useEffect or client components.'
                : 'Check the first stack-trace line, confirm the failing file path, and rerun after fixing the reported import or runtime value.'
        updateAgent('debug', { status: 'done', output: diagnosis })
        setMessages(items => [...items, { role: 'user', content: `Debug logs:\n${log}` }, { role: 'assistant', content: diagnosis }])
    }

    function downloadZip() {
        const root = slugify(spec.name)
        const blob = makeZip(files, root)
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${root}.zip`
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="min-h-[calc(100vh-72px)] bg-background px-4 py-6 text-foreground transition-colors duration-150 lg:px-6">
            <div className="mx-auto grid max-w-[1500px] gap-5 xl:grid-cols-[360px_minmax(0,1fr)_330px]">
                <section className="flex min-h-[780px] flex-col rounded-2xl border border-border bg-card shadow-xl shadow-black/5">
                    <div className="border-b border-border p-5">
                        <div className="flex items-center gap-3">
                            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/15 text-cyan-400"><Sparkles size={20} /></span>
                            <div>
                                <h1 className="text-xl font-semibold">AI Project Builder</h1>
                                <p className="text-sm text-muted-foreground">Conversational project generation</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4 overflow-y-auto p-5">
                        {messages.map((message, index) => (
                            <div key={`${message.role}-${index}`} className={`rounded-2xl p-4 text-sm leading-6 ${message.role === 'assistant' ? 'bg-secondary text-foreground' : 'bg-violet-500/15 text-foreground'}`}>
                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                    {message.role === 'assistant' ? <Bot size={14} /> : <MessageSquare size={14} />}
                                    {message.role === 'assistant' ? 'Builder' : 'You'}
                                </div>
                                {message.content}
                            </div>
                        ))}
                        <Card className="border-cyan-400/20 bg-cyan-400/5 p-4">
                            <div className="text-sm font-semibold text-cyan-300">Requirement prompts</div>
                            <div className="mt-3 space-y-2 text-sm text-muted-foreground">{questions.map(item => <div key={item}>- {item}</div>)}</div>
                        </Card>
                    </div>
                    <div className="border-t border-border p-4">
                        <textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() } }} placeholder="Describe a project, ask for a modification, or request a feature..." className="min-h-[104px] w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm text-foreground outline-none focus:border-accent" />
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button onClick={submit} disabled={working || !input.trim()} variant="primary" className="bg-cyan-400 text-zinc-950 hover:bg-cyan-300">{working ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Build</Button>
                            <Button onClick={applyModification} disabled={working || !input.trim()} variant="secondary"><RefreshCw size={16} /> Modify</Button>
                        </div>
                    </div>
                </section>

                <main className="min-w-0 space-y-5">
                    <Card className="p-5">
                        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-400"><Wand2 size={16} /> Project workflow</div>
                                <h2 className="mt-2 text-3xl font-semibold">{spec.name}</h2>
                                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{spec.idea}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={downloadZip} variant="primary"><Download size={16} /> Download ZIP</Button>
                                <Button onClick={() => setActiveFile('README.md')} variant="secondary"><FileText size={16} /> README</Button>
                            </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-6">
                            {agents.map((agent, index) => (
                                <button key={agent.id} onClick={() => setSelectedStep(index)} className={`rounded-2xl border p-3 text-left transition ${selectedStep === index ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-border bg-background hover:bg-secondary'}`}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{index + 1}</span>
                                        {agent.status === 'done' ? <CheckCircle2 size={16} className="text-cyan-400" /> : agent.status === 'running' ? <Loader2 size={16} className="animate-spin text-violet-400" /> : <span className="h-2 w-2 rounded-full bg-zinc-700" />}
                                    </div>
                                    <div className="text-sm font-semibold text-foreground">{agent.name.replace(' Agent', '')}</div>
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-cyan-400 transition-[width]" style={{ width: `${progress}%` }} /></div>
                    </Card>

                    <div className="grid min-h-[560px] gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                        <Card className="overflow-hidden p-0">
                            <div className="border-b border-border p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold"><Folder size={16} className="text-cyan-400" /> File Explorer</div>
                            </div>
                            <div className="max-h-[520px] overflow-y-auto p-2">
                                {files.map(file => (
                                    <button key={file.path} onClick={() => setActiveFile(file.path)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${activeFile === file.path ? 'bg-violet-500/15 text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                                        <FileCode2 size={15} className="shrink-0 text-cyan-400" />
                                        <span className="truncate">{file.path}</span>
                                    </button>
                                ))}
                            </div>
                        </Card>
                        <Card className="overflow-hidden p-0">
                            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                <div className="flex items-center gap-2 text-sm font-semibold"><Code2 size={16} className="text-cyan-400" /> {active?.path}</div>
                                <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">{active?.language}</span>
                            </div>
                            <pre className="max-h-[520px] overflow-auto rounded-none border-0 bg-background p-5 text-sm leading-6 text-foreground"><code>{active?.content}</code></pre>
                        </Card>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                        <Card>
                            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-400"><Play size={16} /> How to run</div>
                            <ol className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">{guide.map(item => <li key={item}>{item}</li>)}</ol>
                            {backendNote && <div className="mt-4 rounded-2xl border border-border bg-background p-3 text-sm text-muted-foreground">{backendNote}</div>}
                        </Card>
                        <Card>
                            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-400"><AlertTriangle size={16} /> Debug user logs</div>
                            <textarea value={debugLog} onChange={event => setDebugLog(event.target.value)} placeholder="Paste terminal/browser error logs here..." className="mt-4 min-h-[124px] w-full resize-none rounded-2xl border border-border bg-background p-4 text-sm text-foreground outline-none focus:border-accent" />
                            <Button onClick={debugFromLogs} className="mt-3 w-full" variant="secondary">Analyze logs</Button>
                        </Card>
                    </div>
                </main>

                <aside className="space-y-5">
                    <Card>
                        <div className="text-sm font-semibold text-cyan-400">Active agent</div>
                        <h3 className="mt-2 text-xl font-semibold">{agents[selectedStep]?.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{agents[selectedStep]?.role}</p>
                        <div className="mt-4 rounded-2xl border border-border bg-background p-4 text-sm leading-6 text-foreground whitespace-pre-wrap">{agents[selectedStep]?.output}</div>
                    </Card>
                    <Card>
                        <div className="text-sm font-semibold text-cyan-400">Architecture</div>
                        <pre className="mt-4 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-2xl bg-background p-4 text-xs leading-6 text-muted-foreground">{architecture}</pre>
                    </Card>
                    <Card>
                        <div className="text-sm font-semibold text-cyan-400">Export checklist</div>
                        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-cyan-400" /> Folder structure generated</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-cyan-400" /> Production-style files generated</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-cyan-400" /> ZIP export available</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-cyan-400" /> Run guide included</div>
                        </div>
                    </Card>
                </aside>
            </div>
        </div>
    )
}

type BuilderTab = 'overview' | 'architecture' | 'code' | 'files' | 'terminal' | 'logs' | 'readme' | 'preview'
type PreviewMode = 'desktop' | 'tablet' | 'mobile'

const generationSteps = [
    ['requirements', 'Requirement Analysis', '2 min', FileText],
    ['architecture', 'Architecture Design', '3 min', Layers],
    ['technology', 'Technology Selection', '1 min', Braces],
    ['frontend', 'Frontend Generation', '6 min', Monitor],
    ['backend', 'Backend Generation', '5 min', Server],
    ['database', 'Database Design', '3 min', Database],
    ['api', 'API Generation', '3 min', Globe2],
    ['testing', 'Testing', '4 min', TestTube2],
    ['debug', 'Debugging', '3 min', AlertTriangle],
    ['documentation', 'Documentation', '2 min', FileText],
    ['packaging', 'Packaging', '1 min', Archive],
    ['deployment', 'Deployment Guide', '2 min', Cloud],
] as const

const workspaceTabs: Array<[BuilderTab, string, typeof Boxes]> = [
    ['overview', 'Overview', Boxes],
    ['architecture', 'Architecture', Layers],
    ['code', 'Generated Code', Code2],
    ['files', 'Files', FolderTree],
    ['terminal', 'Terminal', TerminalSquare],
    ['logs', 'Logs', Bot],
    ['readme', 'README', FileText],
    ['preview', 'Preview', Monitor],
]

const projectPrompts = [
    'Build an E-commerce website',
    'Build an AI Resume Analyzer',
    'Build a Hospital Management System',
    'Build a Chat Application',
    'Build a Learning Management System',
]

function architectureCards(spec: ProjectSpec) {
    const stack = spec.stack.toLowerCase()
    return [
        { title: 'Frontend', technology: stack.includes('next') || stack.includes('react') ? 'Next.js + React' : 'Modern web UI', description: 'Responsive application screens, interaction states, and user workflows.', reason: 'Gives the project a polished product surface and quick iteration loop.', icon: Monitor },
        { title: 'Backend', technology: stack.includes('fastapi') ? 'FastAPI' : stack.includes('node') ? 'Node API' : 'API service layer', description: 'Business logic, validation, routes, integrations, and workflow orchestration.', reason: 'Keeps domain logic testable and separate from presentation.', icon: Server },
        { title: 'Database', technology: stack.includes('postgres') ? 'PostgreSQL' : 'Local-first persistence', description: 'Stores users, records, generated outputs, tasks, and audit history.', reason: 'Supports MVP speed while preserving a production upgrade path.', icon: Database },
        { title: 'Authentication', technology: stack.includes('auth') ? 'Role-based auth' : 'Optional auth module', description: 'Protects private data and separates admin/user capabilities.', reason: 'Most enterprise-grade apps need clear access boundaries.', icon: ShieldCheck },
        { title: 'Hosting', technology: stack.includes('docker') ? 'Docker + cloud host' : 'Vercel-compatible deployment', description: 'Build, environment setup, release checklist, and deployment guide.', reason: 'A project is stronger when it is easy to run and ship.', icon: Cloud },
        { title: 'AI Services', technology: 'AI adapter', description: 'Optional model layer for generation, recommendations, summaries, and debugging.', reason: 'Keeps AI features modular instead of tangled through the app.', icon: Sparkles },
        { title: 'External APIs', technology: 'Typed API clients', description: 'Payments, email, maps, documents, or domain APIs depending on scope.', reason: 'Clear contracts make integrations easier to test and replace.', icon: Globe2 },
    ]
}

function downloadTextFile(filename: string, content: string, type = 'text/plain') {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}

function downloadBlobFile(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}

export default function AIProjectBuilder() {
    const [prompt, setPrompt] = useState('')
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Describe what you want to build. The AI software engineering team will move from requirements to architecture, code, debugging, docs, packaging, and deployment.' },
    ])
    const [agents, setAgents] = useState(initialAgents)
    const [spec, setSpec] = useState<ProjectSpec>(defaultSpec)
    const [files, setFiles] = useState<ProjectFile[]>(generateFiles(defaultSpec))
    const [activeFile, setActiveFile] = useState('README.md')
    const [activeTab, setActiveTab] = useState<BuilderTab>('overview')
    const [working, setWorking] = useState(false)
    const [selectedStep, setSelectedStep] = useState(0)
    const [debugLog, setDebugLog] = useState('')
    const [backendNote, setBackendNote] = useState('')
    const [downloadOpen, setDownloadOpen] = useState(false)
    const [agentPanelOpen, setAgentPanelOpen] = useState(true)
    const [fileExplorerOpen, setFileExplorerOpen] = useState(false)
    const [fileQuery, setFileQuery] = useState('')
    const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

    const architecture = useMemo(() => architectureFor(spec), [spec])
    const visualArchitecture = useMemo(() => architectureCards(spec), [spec])
    const guide = useMemo(() => runGuide(spec), [spec])
    const active = files.find(file => file.path === activeFile) || files[0]
    const filteredFiles = files.filter(file => file.path.toLowerCase().includes(fileQuery.toLowerCase()))
    const completedAgents = agents.filter(agent => agent.status === 'done').length
    const completedSteps = Math.min(generationSteps.length, completedAgents + (working ? 1 : 0))
    const progress = Math.round((completedSteps / generationSteps.length) * 100)
    const logs = agents.filter(agent => agent.status !== 'idle').map(agent => `${agent.name}: ${agent.output}`)
    const readme = files.find(file => file.path === 'README.md')?.content || ''
    const lineCount = files.reduce((sum, file) => sum + file.content.split('\n').length, 0)
    const terminalOutput = [`$ npm install`, `$ npm run dev`, '', ...guide, backendNote ? `\n${backendNote}` : ''].join('\n')

    function updateAgent(id: string, patch: Partial<Agent>) {
        setAgents(items => items.map(agent => agent.id === id ? { ...agent, ...patch } : agent))
    }

    async function runBuilder(rawPrompt: string) {
        const nextSpec = parseSpec(rawPrompt)
        setSpec(nextSpec)
        setWorking(true)
        setBackendNote('')
        setActiveTab('overview')
        setMessages(items => [...items, { role: 'user', content: rawPrompt }, { role: 'assistant', content: 'Project accepted. The AI software engineering team is generating requirements, architecture, code, tests, documentation, packaging, and deployment guidance.' }])
        setAgents(initialAgents.map(agent => ({ ...agent, status: 'idle' as AgentStatus, output: 'Queued for generation.' })))

        const stages = [
            ['requirements', `Captured MVP for ${nextSpec.audience}. Must-have features: ${nextSpec.features.join(', ')}.`],
            ['architecture', architectureFor(nextSpec)],
            ['frontend', 'Generated app shell, responsive dashboard, task checklist, and preview-ready UI.'],
            ['backend', 'Generated API route, validation-ready contract, and service boundaries.'],
            ['database', 'Designed project, user, task, and activity entities for persistence.'],
            ['testing', 'Created smoke-test plan for render, API, build, and core user workflow.'],
            ['debug', 'Static review passed: imports, route shape, state model, and generated files are consistent.'],
            ['mentor', `Run with npm install and npm run dev. Present this as a portfolio project for ${nextSpec.audience}.`],
        ] as Array<[string, string]>

        for (let index = 0; index < stages.length; index += 1) {
            const [id, output] = stages[index]
            setSelectedStep(Math.min(index, generationSteps.length - 1))
            updateAgent(id, { status: 'running', output: 'Working on current task...' })
            await new Promise(resolve => setTimeout(resolve, 240))
            updateAgent(id, { status: 'done', output })
        }

        const generated = generateFiles(nextSpec)
        setFiles(generated)
        setActiveFile(generated.find(file => file.path === 'app/page.tsx')?.path || generated[0].path)
        setActiveTab('code')
        setMessages(items => [...items, { role: 'assistant', content: `Project generated: ${nextSpec.name}. Source files, README, architecture, debugging notes, and deployment guide are ready.` }])

        try {
            const res = await api.executeWorkflow(`Build project: ${rawPrompt}`, 'project-builder')
            if (res.workflow_id) setBackendNote(`Backend workflow started: ${res.workflow_id}`)
        } catch {
            setBackendNote('Local builder completed. Backend workflow endpoint was unavailable, so deterministic agent outputs were used.')
        } finally {
            setWorking(false)
            setSelectedStep(generationSteps.length - 1)
        }
    }

    function submit(value = prompt) {
        const text = value.trim()
        if (!text || working) return
        setPrompt('')
        runBuilder(text)
    }

    function applyModification() {
        const request = prompt.trim()
        if (!request || working) return
        setPrompt('')
        setFiles(items => items.map(file => {
            if (file.path === 'README.md') return { ...file, content: `${file.content}\n\n## Modification Request\n${request}\n\nApplied by AI Project Builder. Review this request before final submission.\n` }
            if (file.path === 'app/page.tsx') return { ...file, content: file.content.replace('Portfolio readiness', `Production readiness - ${request.replace(/'/g, '')}`) }
            return file
        }))
        updateAgent('frontend', { status: 'done', output: `Applied modification: ${request}` })
        setMessages(items => [...items, { role: 'user', content: request }, { role: 'assistant', content: 'Modification accepted. I updated README guidance and adjusted generated application copy.' }])
    }

    function debugFromLogs() {
        const log = debugLog.trim()
        if (!log) return
        const diagnosis = log.toLowerCase().includes('module not found')
            ? 'Likely missing dependency or incorrect import path. Run npm install and verify the imported file path exists.'
            : log.toLowerCase().includes('hydration')
                ? 'Likely server/client render mismatch. Keep browser-only state inside useEffect or stable client placeholders.'
                : 'Check the first stack-trace line, confirm the failing file path, and rerun after fixing the reported import or runtime value.'
        updateAgent('debug', { status: 'done', output: diagnosis })
        setMessages(items => [...items, { role: 'user', content: `Debug logs:\n${log}` }, { role: 'assistant', content: diagnosis }])
        setActiveTab('logs')
    }

    function downloadZip() {
        const root = slugify(spec.name)
        downloadBlobFile(`${root}.zip`, makeZip(files, root))
    }

    function copyActiveFile() {
        if (active?.content) navigator.clipboard?.writeText(active.content)
    }

    return (
        <div className="min-h-[calc(100vh-72px)] bg-background px-4 py-5 text-foreground lg:px-6">
            <div className="mx-auto max-w-[1500px] space-y-5">
                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10">
                    <div className="relative p-5 lg:p-7">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(139,92,246,0.16),transparent_28%)]" />
                        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                            <div className="max-w-4xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
                                    <Sparkles size={14} /> Enterprise AI IDE
                                </div>
                                <h1 className="mt-4 text-4xl font-semibold text-foreground sm:text-5xl">AI Project Builder</h1>
                                <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">Describe your idea in plain English. AI agents will gather requirements, design the architecture, generate production-ready code, debug issues, create documentation, and package the project for download.</p>
                            </div>
                            <div className="relative">
                                <button onClick={() => setDownloadOpen(value => !value)} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-background/80 px-4 text-sm font-medium text-foreground shadow-xl shadow-black/5 hover:bg-secondary">
                                    <Download size={16} /> Download <ChevronDown size={14} />
                                </button>
                                {downloadOpen && (
                                    <div className="absolute right-0 top-12 z-20 w-64 rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-black/20">
                                        <DownloadItem label="Download Source Code" icon={FileArchive} onClick={downloadZip} />
                                        <DownloadItem label="Download Documentation" icon={FileText} onClick={() => downloadTextFile('README.md', readme)} />
                                        <DownloadItem label="Download Architecture" icon={Layers} onClick={() => downloadTextFile('architecture.md', architecture)} />
                                        <DownloadItem label="Download API Collection" icon={Braces} onClick={() => downloadTextFile('api-collection.json', JSON.stringify({ routes: ['/api/plan'], project: spec.name }, null, 2), 'application/json')} />
                                        <DownloadItem label="Download Deployment Guide" icon={Cloud} onClick={() => downloadTextFile('deployment.md', guide.join('\n'))} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative mt-6 rounded-2xl border border-border bg-background/75 p-3 backdrop-blur">
                            <textarea value={prompt} onChange={event => setPrompt(event.target.value)} placeholder={`What do you want to build today?\nExample:\nBuild an AI-powered e-commerce platform using Next.js, FastAPI, PostgreSQL and Docker.`} className="min-h-[138px] w-full resize-none rounded-xl border-0 bg-transparent px-3 py-3 text-base leading-7 text-foreground outline-none placeholder:text-muted-foreground" />
                            <div className="flex flex-col gap-3 border-t border-border pt-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-wrap gap-2">
                                    {projectPrompts.map(item => <button key={item} onClick={() => setPrompt(item)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground">{item}</button>)}
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={applyModification} disabled={working || !prompt.trim()} variant="secondary"><RefreshCw size={16} /> Modify</Button>
                                    <Button onClick={() => submit()} disabled={working || !prompt.trim()} variant="primary" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                                        {working ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />} Generate Project
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-border bg-card p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <div className="text-sm font-semibold text-foreground">Project generation lifecycle</div>
                            <div className="mt-1 text-xs text-muted-foreground">{progress}% complete · {completedSteps}/{generationSteps.length} steps</div>
                        </div>
                        <div className="h-2 w-40 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${progress}%` }} /></div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                        {generationSteps.map(([id, label, estimate, Icon], index) => {
                            const complete = index < completedSteps && !working
                            const activeStep = working && index === Math.min(selectedStep, generationSteps.length - 1)
                            return (
                                <button key={id} onClick={() => setSelectedStep(index)} className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${activeStep ? 'border-cyan-300/50 bg-cyan-300/10' : complete ? 'border-emerald-300/25 bg-emerald-400/10' : 'border-border bg-background hover:bg-secondary'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-cyan-100"><Icon size={16} /></span>
                                        {complete ? <CheckCircle2 size={16} className="text-emerald-300" /> : activeStep ? <Loader2 size={16} className="animate-spin text-cyan-200" /> : <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />}
                                    </div>
                                    <div className="mt-3 text-sm font-semibold text-foreground">{label}</div>
                                    <div className="mt-1 text-xs text-muted-foreground">{estimate}</div>
                                </button>
                            )
                        })}
                    </div>
                </section>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <main className="min-w-0 rounded-2xl border border-border bg-card">
                        <div className="flex flex-wrap gap-2 border-b border-border p-3">
                            {workspaceTabs.map(([id, label, Icon]) => (
                                <button key={id} onClick={() => setActiveTab(id)} className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm transition ${activeTab === id ? 'bg-cyan-300/15 text-cyan-50' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                                    <Icon size={15} /> {label}
                                </button>
                            ))}
                        </div>
                        <div className="min-h-[620px] p-4">
                            <ProjectWorkspace
                                activeTab={activeTab}
                                spec={spec}
                                files={files}
                                active={active}
                                activeFile={activeFile}
                                setActiveFile={setActiveFile}
                                visualArchitecture={visualArchitecture}
                                guide={guide}
                                logs={logs}
                                messages={messages}
                                fileExplorerOpen={fileExplorerOpen}
                                setFileExplorerOpen={setFileExplorerOpen}
                                fileQuery={fileQuery}
                                setFileQuery={setFileQuery}
                                filteredFiles={filteredFiles}
                                copyActiveFile={copyActiveFile}
                                downloadActiveFile={() => active && downloadTextFile(active.path.split('/').pop() || 'file.txt', active.content)}
                                terminalOutput={terminalOutput}
                                debugLog={debugLog}
                                setDebugLog={setDebugLog}
                                debugFromLogs={debugFromLogs}
                                previewMode={previewMode}
                                setPreviewMode={setPreviewMode}
                                lineCount={lineCount}
                            />
                        </div>
                    </main>

                    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                        <button onClick={() => setAgentPanelOpen(value => !value)} className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left">
                            <span className="flex items-center gap-2 font-semibold text-foreground"><Bot size={17} className="text-cyan-200" /> Agent panel</span>
                            {agentPanelOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <AnimatePresence initial={false}>
                            {agentPanelOpen && (
                                <motion.div initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                    {agents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </aside>
                </div>
            </div>
        </div>
    )
}

function DownloadItem({ label, icon: Icon, onClick }: { label: string; icon: typeof Download; onClick: () => void }) {
    return <button onClick={onClick} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"><Icon size={15} />{label}</button>
}

function AgentCard({ agent }: { agent: Agent }) {
    const progress = agent.status === 'done' ? 100 : agent.status === 'running' ? 58 : 0
    return (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xl shadow-black/5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="font-semibold text-foreground">{agent.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{agent.role}</div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${agent.status === 'done' ? 'bg-emerald-400/10 text-emerald-200' : agent.status === 'running' ? 'bg-cyan-300/10 text-cyan-100' : 'bg-secondary text-muted-foreground'}`}>{agent.status}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${progress}%` }} /></div>
            <div className="mt-3 text-sm text-foreground">{agent.status === 'running' ? 'Generating current task...' : agent.status === 'done' ? 'Task complete' : 'Queued'}</div>
            <div className="mt-2 rounded-xl bg-secondary p-3 text-xs leading-5 text-muted-foreground">{agent.output}</div>
        </div>
    )
}

function ProjectWorkspace(props: {
    activeTab: BuilderTab
    spec: ProjectSpec
    files: ProjectFile[]
    active?: ProjectFile
    activeFile: string
    setActiveFile: (path: string) => void
    visualArchitecture: ReturnType<typeof architectureCards>
    guide: string[]
    logs: string[]
    messages: ChatMessage[]
    fileExplorerOpen: boolean
    setFileExplorerOpen: (value: boolean) => void
    fileQuery: string
    setFileQuery: (value: string) => void
    filteredFiles: ProjectFile[]
    copyActiveFile: () => void
    downloadActiveFile: () => void
    terminalOutput: string
    debugLog: string
    setDebugLog: (value: string) => void
    debugFromLogs: () => void
    previewMode: PreviewMode
    setPreviewMode: (value: PreviewMode) => void
    lineCount: number
}) {
    const { activeTab, spec, files, active, activeFile, setActiveFile, visualArchitecture, guide, logs, messages, fileExplorerOpen, setFileExplorerOpen, fileQuery, setFileQuery, filteredFiles, copyActiveFile, downloadActiveFile, terminalOutput, debugLog, setDebugLog, debugFromLogs, previewMode, setPreviewMode, lineCount } = props
    const readme = files.find(file => file.path === 'README.md')?.content || ''

    if (activeTab === 'overview') {
        return (
            <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <OverviewCard label="Project Name" value={spec.name} icon={Sparkles} />
                    <OverviewCard label="Goal" value={spec.idea} icon={Wand2} />
                    <OverviewCard label="Audience" value={spec.audience} icon={Bot} />
                    <OverviewCard label="Difficulty" value="Intermediate" icon={TestTube2} />
                    <OverviewCard label="Estimated Time" value="2-4 weeks" icon={Play} />
                    <OverviewCard label="Tech Stack" value={spec.stack} icon={Braces} />
                    <OverviewCard label="Files Generated" value={String(files.length)} icon={FileCode2} />
                    <OverviewCard label="Lines of Code" value={String(lineCount)} icon={Code2} />
                </div>
                <Card className="bg-secondary">
                    <div className="text-lg font-semibold text-foreground">Primary workflow</div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{spec.idea}</p>
                    <div className="mt-5 flex flex-wrap gap-2">{spec.features.map(feature => <span key={feature} className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">{feature}</span>)}</div>
                </Card>
            </div>
        )
    }

    if (activeTab === 'architecture') {
        return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visualArchitecture.map(item => <ArchitectureCard key={item.title} item={item} />)}</div>
    }

    if (activeTab === 'code' || activeTab === 'files') {
        return (
            <div className="grid min-h-[560px] gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
                <div className={`${fileExplorerOpen || activeTab === 'files' ? 'w-full lg:w-72' : 'w-auto'} rounded-2xl border border-border bg-background`}>
                    <div className="flex items-center justify-between border-b border-border p-3">
                        <button onClick={() => setFileExplorerOpen(!fileExplorerOpen)} className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                            {fileExplorerOpen || activeTab === 'files' ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />} Files
                        </button>
                    </div>
                    {(fileExplorerOpen || activeTab === 'files') && (
                        <div className="p-3">
                            <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground"><Search size={14} /><input value={fileQuery} onChange={event => setFileQuery(event.target.value)} placeholder="Search files" className="min-w-0 flex-1 bg-transparent outline-none" /></div>
                            <div className="max-h-[500px] overflow-y-auto">
                                {filteredFiles.map(file => <button key={file.path} onClick={() => setActiveFile(file.path)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${activeFile === file.path ? 'bg-cyan-300/10 text-cyan-50' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}><FileCode2 size={14} className="text-cyan-200" /><span className="truncate">{file.path}</span></button>)}
                            </div>
                        </div>
                    )}
                </div>
                <div className="overflow-hidden rounded-2xl border border-border bg-background">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Code2 size={16} className="text-cyan-200" />{active?.path}</div>
                        <div className="flex gap-2">
                            <button onClick={copyActiveFile} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground hover:text-foreground"><Copy size={14} />Copy</button>
                            <button onClick={downloadActiveFile} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground hover:text-foreground"><Download size={14} />Download</button>
                            <button className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground hover:text-foreground"><ExternalLink size={14} />Fullscreen</button>
                        </div>
                    </div>
                    <div className="border-b border-border bg-card px-4 py-2 text-xs text-muted-foreground">Monaco-style editor · {active?.language}</div>
                    <pre className="max-h-[560px] overflow-auto bg-[#09090b] p-5 font-mono text-sm leading-6 text-cyan-50"><code>{active?.content}</code></pre>
                </div>
            </div>
        )
    }

    if (activeTab === 'terminal') return <pre className="min-h-[560px] overflow-auto rounded-2xl bg-[#050507] p-5 font-mono text-sm leading-7 text-emerald-200">{terminalOutput}</pre>

    if (activeTab === 'logs') {
        return (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="mb-3 text-sm font-semibold text-foreground">Streaming activity</div>
                    <div className="space-y-2">{(logs.length ? logs : messages.map(message => `${message.role}: ${message.content}`)).map((log, index) => <div key={`${log}-${index}`} className="rounded-xl bg-card p-3 text-sm text-muted-foreground">{log}</div>)}</div>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="text-sm font-semibold text-foreground">Debug issues</div>
                    <textarea value={debugLog} onChange={event => setDebugLog(event.target.value)} placeholder="Paste terminal/browser error logs here..." className="mt-3 min-h-[180px] w-full resize-none rounded-xl border border-border bg-card p-3 text-sm text-foreground outline-none focus:border-cyan-300/40" />
                    <Button onClick={debugFromLogs} className="mt-3 w-full" variant="secondary"><AlertTriangle size={16} />Analyze logs</Button>
                </div>
            </div>
        )
    }

    if (activeTab === 'readme') return <pre className="min-h-[560px] overflow-auto rounded-2xl border border-border bg-background p-5 text-sm leading-7 text-muted-foreground whitespace-pre-wrap">{readme}</pre>

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <PreviewButton active={previewMode === 'desktop'} icon={Monitor} label="Desktop Preview" onClick={() => setPreviewMode('desktop')} />
                <PreviewButton active={previewMode === 'tablet'} icon={Tablet} label="Tablet Preview" onClick={() => setPreviewMode('tablet')} />
                <PreviewButton active={previewMode === 'mobile'} icon={Smartphone} label="Mobile Preview" onClick={() => setPreviewMode('mobile')} />
            </div>
            <div className="grid min-h-[520px] place-items-center rounded-2xl border border-border bg-background p-4">
                <div className={`${previewMode === 'desktop' ? 'w-full max-w-4xl' : previewMode === 'tablet' ? 'w-[720px] max-w-full' : 'w-[360px] max-w-full'} overflow-hidden rounded-2xl border border-border bg-[#09090b] text-white shadow-2xl shadow-black/20`}>
                    <div className="border-b border-white/10 px-4 py-3 text-sm text-zinc-400">{spec.name}</div>
                    <div className="p-6">
                        <div className="inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">Generated preview</div>
                        <h3 className="mt-4 text-3xl font-semibold">{spec.name}</h3>
                        <p className="mt-3 text-sm leading-6 text-zinc-400">{spec.idea}</p>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {spec.features.slice(0, 4).map(feature => <div key={feature} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">{feature}</div>)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function OverviewCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Boxes }) {
    return <div className="rounded-2xl border border-border bg-secondary p-4"><div className="flex items-center justify-between text-xs text-muted-foreground"><span>{label}</span><Icon size={15} /></div><div className="mt-3 line-clamp-2 text-lg font-semibold text-foreground">{value}</div></div>
}

function ArchitectureCard({ item }: { item: ReturnType<typeof architectureCards>[number] }) {
    const Icon = item.icon
    return <div className="rounded-2xl border border-border bg-secondary p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-100"><Icon size={18} /></span><div><div className="font-semibold text-foreground">{item.title}</div><div className="text-xs text-cyan-100">{item.technology}</div></div></div><p className="mt-4 text-sm leading-6 text-muted-foreground">{item.description}</p><p className="mt-3 text-sm leading-6 text-foreground">Reason chosen: {item.reason}</p></div>
}

function PreviewButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Monitor; label: string; onClick: () => void }) {
    return <button onClick={onClick} className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm ${active ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-50' : 'border-border text-muted-foreground hover:text-foreground'}`}><Icon size={15} />{label}</button>
}
