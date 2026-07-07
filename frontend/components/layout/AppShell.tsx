'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Route } from 'next'
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Bell,
    BookOpen,
    CheckCircle2,
    Copy,
    Cpu,
    ExternalLink,
    FileText,
    Bot,
    GraduationCap,
    ChevronLeft,
    ChevronRight,
    Home,
    Loader2,
    Menu,
    MessageCircle,
    Moon,
    RefreshCw,
    Search,
    Settings,
    Sparkles,
    Sun,
    Target,
    UserCircle,
    Rocket,
    Workflow,
    X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import CommandPalette from '../ui/CommandPalette'
import ErrorBoundary from '../ErrorBoundary'
import SidebarItem from '../ui/SidebarItem'
import * as api from '../../lib/api'
import { API_BASE_URL } from '../../lib/endpoints'
import useMounted from '../../hooks/useMounted'

type NavItem = { label: string; href: Route; icon: LucideIcon }

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
    {
        label: 'Main',
        items: [
            { label: 'Home', href: '/', icon: Home },
            { label: 'AI Chat', href: '/chat', icon: MessageCircle },
            { label: 'Career Roadmap', href: '/career-roadmap' as Route, icon: GraduationCap },
        ],
    },
    {
        label: 'Build',
        items: [
            { label: 'Project Builder', href: '/projects' as Route, icon: Rocket },
            { label: 'Resume Builder', href: '/resume' as Route, icon: FileText },
            { label: 'Knowledge Base', href: '/knowledge' as Route, icon: BookOpen },
        ],
    },
    {
        label: 'Grow',
        items: [
            { label: 'Mentor', href: '/mentor' as Route, icon: Bot },
            { label: 'Progress Tracker', href: '/progress' as Route, icon: Target },
            { label: 'Workflow Studio', href: '/workflows' as Route, icon: Workflow },
            { label: 'Settings', href: '/settings', icon: Settings },
        ],
    },
]

const PAGE_TITLES: Record<string, string> = {
    '/': 'Home',
    '/chat': 'AI Chat',
    '/career-roadmap': 'Career Roadmap',
    '/projects': 'Project Builder',
    '/resume': 'Resume Builder',
    '/workflows': 'Workflow Studio',
    '/agents': 'Agents',
    '/sessions': 'Sessions',
    '/knowledge': 'Knowledge Base',
    '/knowledge-base': 'Knowledge Base',
    '/mentor': 'Mentor',
    '/skills': 'Skills Engine',
    '/analytics': 'Progress Tracker',
    '/progress': 'Progress Tracker',
    '/model-monitor': 'Model Monitor',
    '/timeline': 'Timeline',
    '/settings': 'Settings',
    '/ai-workspace': 'AI Workspace',
    '/playground': 'Playground',
}

type ShellStatus = {
    modelLabel: string
    modelConnected: boolean
    severity: 'healthy' | 'warning' | 'error' | 'loading'
    detail: string
}

function SidebarContent({
    collapsed,
    onNavigate,
    onToggle,
    onSearch,
    shellStatus,
    onToggleTheme,
    resolvedTheme,
    mounted,
    onOpenDiagnostics,
}: {
    collapsed: boolean
    onNavigate?: () => void
    onToggle: () => void
    onSearch: () => void
    shellStatus: ShellStatus
    onToggleTheme: () => void
    resolvedTheme?: string
    mounted: boolean
    onOpenDiagnostics: () => void
}) {
    const pathname = usePathname()

    return (
        <motion.div layout initial={false} transition={{ type: 'spring', stiffness: 240, damping: 28 }} className="flex h-full flex-col rounded-2xl border border-border bg-sidebar p-4 shadow-xl shadow-black/5 backdrop-blur-xl transition-colors duration-150">
            <div className={clsx('flex items-center', collapsed ? 'justify-center px-0 py-2' : 'gap-3 px-1 py-2')}>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-xl shadow-black/10">
                    <Sparkles size={18} />
                </div>
                {!collapsed && (
                    <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-foreground">Student AI</div>
                        <div className="truncate text-sm text-muted-foreground">Career & learning</div>
                    </div>
                )}
                <button
                    type="button"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    onClick={onToggle}
                    className={clsx('ml-auto hidden h-9 w-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-foreground lg:grid', collapsed && 'ml-0')}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {!collapsed && (
                <button onClick={onSearch} className="mt-5 flex h-11 w-full items-center gap-2 rounded-2xl border border-border bg-card px-4 text-left text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                    <Search size={15} />
                    <span className="flex-1 truncate">Search workspace</span>
                    <kbd className="rounded border border-border px-1.5 py-0.5 text-[11px]">Ctrl K</kbd>
                </button>
            )}

            <nav aria-label="Primary navigation" className="min-h-0 flex-1 overflow-y-auto py-6">
                {NAV_GROUPS.map((group) => (
                    <div className="mb-4 last:mb-0" key={group.label}>
                        {!collapsed && <div className="mb-3 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group.label}</div>}
                        <div className="space-y-1.5">
                            {group.items.map((item) => {
                                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                                return (
                                    <SidebarItem
                                        key={item.href}
                                        href={item.href}
                                        label={item.label}
                                        icon={item.icon}
                                        active={active}
                                        collapsed={collapsed}
                                        onNavigate={onNavigate}
                                    />
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className={clsx('border-t border-border pt-4', collapsed ? 'space-y-2' : 'space-y-3')}>
                <button onClick={onOpenDiagnostics} className={clsx('w-full rounded-2xl border border-border bg-card text-left transition hover:bg-secondary', collapsed ? 'grid h-11 place-items-center' : 'p-3')}>
                    {collapsed ? (
                        <StatusDot severity={shellStatus.severity} />
                    ) : (
                        <div className="flex items-center gap-3">
                            <StatusDot severity={shellStatus.severity} />
                            <div className="min-w-0">
                                <div className="text-xs text-muted-foreground">Local AI Status</div>
                                <div className="truncate text-sm font-medium text-foreground">{shellStatus.modelLabel}</div>
                                <div className="truncate text-xs text-muted-foreground">{shellStatus.detail}</div>
                            </div>
                        </div>
                    )}
                </button>
                <button aria-label="Toggle theme" onClick={onToggleTheme} className={clsx('flex h-11 items-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-foreground', collapsed ? 'w-full justify-center' : 'w-full gap-3 px-3')}>
                    <ThemeToggleIcon mounted={mounted} resolvedTheme={resolvedTheme} size={17} />
                    {!collapsed && <span className="text-sm font-medium">Theme</span>}
                </button>
                {!collapsed && (
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                        <UserCircle size={18} className="text-muted-foreground" />
                        <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground">Student</div>
                            <div className="truncate text-xs text-muted-foreground">Local workspace</div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

function ThemeToggleIcon({ mounted, resolvedTheme, size }: { mounted: boolean; resolvedTheme?: string; size: number }) {
    if (!mounted) {
        return <span aria-hidden="true" className="inline-block shrink-0" style={{ width: size, height: size }} />
    }

    return resolvedTheme === 'dark' ? <Sun size={size} /> : <Moon size={size} />
}

function StatusDot({ severity }: { severity: ShellStatus['severity'] }) {
    const color = severity === 'healthy' ? 'bg-emerald-400 shadow-emerald-400/50' : severity === 'warning' ? 'bg-amber-400 shadow-amber-400/50' : severity === 'loading' ? 'bg-cyan-300 shadow-cyan-300/50' : 'bg-rose-400 shadow-rose-400/50'
    return <span className={clsx('h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_16px_currentColor]', color, severity === 'loading' && 'animate-pulse')} />
}

function fallbackSystemStatus(error = `Backend service is not responding at ${API_BASE_URL}.`): api.SystemStatus {
    return {
        backend: 'offline',
        lmstudio: 'offline',
        model: 'Unknown',
        version: '1.0',
        uptime: 0,
        services: {},
        details: {
            api_url: API_BASE_URL,
            provider: 'local',
            environment: 'development',
            lmstudio_url: 'http://127.0.0.1:1234/v1',
            model_ready: false,
            loaded_models: [],
            latency_ms: null,
            error,
            last_checked: null,
        },
    }
}

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [commandOpen, setCommandOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)
    const [diagnosticsLoading, setDiagnosticsLoading] = useState(true)
    const [inferenceResult, setInferenceResult] = useState<api.InferenceTestResult | null>(null)
    const [inferenceLoading, setInferenceLoading] = useState(false)
    const mounted = useMounted()
    const [systemStatus, setSystemStatus] = useState<api.SystemStatus | null>(null)
    const { setTheme, resolvedTheme } = useTheme()

    useEffect(() => {
        const savedCollapsed = localStorage.getItem('student-ai:sidebar')
        setCollapsed(savedCollapsed === 'collapsed')
    }, [])

    const refreshDiagnostics = useCallback(async () => {
        setDiagnosticsLoading(true)
        try {
            const status = await api.getSystemStatus()
            setSystemStatus(status)
        } catch (error) {
            setSystemStatus(fallbackSystemStatus(error instanceof Error ? error.message : 'Backend Offline'))
            setInferenceResult(null)
        } finally {
            setDiagnosticsLoading(false)
        }
    }, [])

    const runDiagnostics = useCallback(async () => {
        setInferenceLoading(true)
        try {
            const result = await api.runSystemInferenceTest()
            setInferenceResult(result)
        } catch (error) {
            setInferenceResult({
                ok: false,
                inference: {
                    status: 'failed',
                    latency_ms: null,
                    error: error instanceof Error ? error.message : 'Inference test failed.',
                },
                timestamp: new Date().toISOString(),
                fixes: ['Model is loaded but response test failed. Try a smaller model or restart LM Studio.'],
            })
        } finally {
            setInferenceLoading(false)
        }
    }, [])

    useEffect(() => {
        refreshDiagnostics()
        const interval = window.setInterval(refreshDiagnostics, 15_000)
        const onRefresh = () => refreshDiagnostics()
        window.addEventListener('student-ai:refresh-system-status', onRefresh)
        return () => {
            window.clearInterval(interval)
            window.removeEventListener('student-ai:refresh-system-status', onRefresh)
        }
    }, [refreshDiagnostics])

    const toggleTheme = () => {
        if (!mounted) return
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    }
    const toggleSidebar = () => {
        setCollapsed((value) => {
            localStorage.setItem('student-ai:sidebar', value ? 'expanded' : 'collapsed')
            return !value
        })
    }

    const commands = useMemo(() => NAV_GROUPS.flatMap((group) => group.items).map((item) => ({
        id: String(item.href),
        title: `Go to ${item.label}`,
        action: () => router.push(item.href),
    })), [router])

    const shellStatus = useMemo<ShellStatus>(() => {
        if (diagnosticsLoading && !systemStatus) return { modelLabel: 'Checking local AI', modelConnected: false, severity: 'loading', detail: 'Running diagnostics' }
        if (systemStatus?.backend !== 'online') return { modelLabel: 'Backend offline', modelConnected: false, severity: 'error', detail: 'Start FastAPI on port 8000' }
        if (systemStatus.lmstudio === 'loading') return { modelLabel: 'Model loading', modelConnected: false, severity: 'loading', detail: 'Checking LM Studio in background' }
        if (systemStatus.lmstudio === 'offline') return { modelLabel: 'LM Studio offline', modelConnected: false, severity: 'error', detail: 'Enable local server on 1234' }
        if (!systemStatus.details.model_ready) return { modelLabel: 'Model mismatch', modelConnected: false, severity: 'warning', detail: systemStatus.details.loaded_models[0] ? `Loaded: ${systemStatus.details.loaded_models[0]}` : 'Load a model in LM Studio' }
        if (inferenceResult && !inferenceResult.ok) return { modelLabel: 'Inference failed', modelConnected: false, severity: 'warning', detail: inferenceResult.inference.error || 'Run diagnostics again' }
        const detail = inferenceResult?.ok ? `${inferenceResult.inference.latency_ms ?? 0} ms inference` : 'Status check only'
        return { modelLabel: systemStatus.model || 'AI Ready', modelConnected: true, severity: 'healthy', detail }
    }, [diagnosticsLoading, inferenceResult, systemStatus])

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-150">
                <CommandPalette commands={commands} open={commandOpen} onOpenChange={setCommandOpen} />

                <motion.aside layout initial={false} animate={{ width: collapsed ? 88 : 280 }} transition={{ type: 'spring', stiffness: 260, damping: 30 }} className={clsx('fixed inset-y-0 left-0 z-40 hidden p-4 transition-[width] duration-200 lg:block', collapsed ? 'w-[88px]' : 'w-[280px]')}>
                    <SidebarContent collapsed={collapsed} onToggle={toggleSidebar} onSearch={() => setCommandOpen(true)} shellStatus={shellStatus} onToggleTheme={toggleTheme} resolvedTheme={resolvedTheme} mounted={mounted} onOpenDiagnostics={() => setDiagnosticsOpen(true)} />
                </motion.aside>

                {mobileOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <aside className="relative h-full w-[280px] bg-sidebar p-3 shadow-2xl">
                            <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"><X size={18} /></button>
                            <SidebarContent collapsed={false} onToggle={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} onSearch={() => setCommandOpen(true)} shellStatus={shellStatus} onToggleTheme={toggleTheme} resolvedTheme={resolvedTheme} mounted={mounted} onOpenDiagnostics={() => setDiagnosticsOpen(true)} />
                        </aside>
                    </div>
                )}

                <div className={clsx('min-h-screen transition-[padding] duration-200', collapsed ? 'lg:pl-[88px]' : 'lg:pl-[280px]')}>
                    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl transition-colors duration-150 sm:px-6 lg:px-8">
                        <button aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"><Menu size={20} /></button>
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-base font-semibold text-foreground">{PAGE_TITLES[pathname] ?? 'Student AI'}</h1>
                            <p className="hidden truncate text-sm text-muted-foreground sm:block">Plan, learn, build, and prepare with AI.</p>
                        </div>
                        <button onClick={() => setCommandOpen(true)} className="hidden h-11 min-w-[260px] items-center gap-2 rounded-2xl border border-border bg-card px-4 text-left text-sm text-muted-foreground transition hover:border-[var(--border-strong)] hover:bg-secondary md:flex">
                            <Search size={15} /><span className="flex-1">Search workspace</span><kbd className="rounded border border-border px-1.5 py-0.5 text-xs">Ctrl K</kbd>
                        </button>
                        <button onClick={() => setDiagnosticsOpen(true)} className="hidden h-11 max-w-[280px] items-center gap-2 rounded-2xl border border-border bg-card px-4 text-left text-sm text-muted-foreground transition hover:bg-secondary lg:flex">
                            <StatusDot severity={shellStatus.severity} />
                            <span className="truncate">{shellStatus.modelLabel}</span>
                        </button>
                        <div className="relative">
                            <button aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(value => !value)} className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                                <Bell size={16} />
                            </button>
                            {notificationsOpen && (
                                <div className="absolute right-0 top-13 z-50 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-4 text-sm shadow-xl shadow-black/10">
                                    <div className="font-semibold text-foreground">Notifications</div>
                                    <div className="mt-3 rounded-2xl border border-border bg-secondary p-3">
                                        <div className="flex items-center gap-2">
                                            <StatusDot severity={shellStatus.severity} />
                                            <span className="font-medium text-foreground">{shellStatus.modelConnected ? 'Local AI ready' : shellStatus.modelLabel}</span>
                                        </div>
                                        <p className="mt-2 leading-6 text-muted-foreground">{shellStatus.detail}</p>
                                        <button onClick={() => setDiagnosticsOpen(true)} className="mt-3 text-xs font-medium text-cyan-200">Open diagnostics</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button aria-label="Toggle theme" onClick={toggleTheme} className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                            <ThemeToggleIcon mounted={mounted} resolvedTheme={resolvedTheme} size={16} />
                        </button>
                        <button aria-label="Profile" className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                            <UserCircle size={17} />
                        </button>
                    </header>

                    <div className="flex">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.main key={pathname} id="main-content" initial={false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }} className="min-w-0 flex-1">
                                {children}
                            </motion.main>
                        </AnimatePresence>
                    </div>
                </div>
                {diagnosticsOpen && (
                    <SystemDiagnosticsModal
                        status={systemStatus}
                        loading={diagnosticsLoading}
                        onClose={() => setDiagnosticsOpen(false)}
                        onRefresh={refreshDiagnostics}
                        onRunDiagnostics={runDiagnostics}
                        inferenceResult={inferenceResult}
                        inferenceLoading={inferenceLoading}
                    />
                )}
            </div>
        </ErrorBoundary>
    )
}

function CheckRow({ label, ok, detail, pending }: { label: string; ok?: boolean; detail?: string; pending?: boolean }) {
    const severity: ShellStatus['severity'] = pending ? 'warning' : ok ? 'healthy' : 'error'
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-secondary p-4">
            <div className="flex items-center gap-3">
                <StatusDot severity={severity} />
                <div>
                    <div className="text-sm font-medium text-foreground">{label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{detail || (ok ? 'Healthy' : 'Needs attention')}</div>
                </div>
            </div>
            {ok ? <CheckCircle2 size={17} className="text-emerald-300" /> : <AlertTriangle size={17} className={pending ? 'text-amber-300' : 'text-rose-300'} />}
        </div>
    )
}

function fixSuggestions(status: api.SystemStatus | null) {
    if (!status || status.backend !== 'online') {
        return [
            'Backend service is not responding at http://127.0.0.1:8000.',
            'cd backend',
            'venv\\Scripts\\activate',
            'python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload',
        ]
    }
    if (status.lmstudio === 'offline') {
        return [
            'LM Studio is not reachable at http://127.0.0.1:1234/v1.',
            'Start LM Studio, open Local Server, and load a model.',
        ]
    }
    if (!status.details.model_ready) {
        return [
            'Configured model does not match loaded model.',
            'Update backend/.env MODEL_NAME or load the correct model.',
        ]
    }
    return ['Everything looks healthy.']
}

function SystemDiagnosticsModal({
    status,
    loading,
    inferenceResult,
    inferenceLoading,
    onClose,
    onRefresh,
    onRunDiagnostics,
}: {
    status: api.SystemStatus | null
    loading: boolean
    inferenceResult: api.InferenceTestResult | null
    inferenceLoading: boolean
    onClose: () => void
    onRefresh: () => void
    onRunDiagnostics: () => void
}) {
    const backendConnected = status?.backend === 'online'
    const lmstudioConnected = status?.lmstudio === 'online'
    const modelMatch = Boolean(status?.details.model_ready)
    const inferenceChecked = Boolean(inferenceResult)
    const inferenceOk = Boolean(inferenceResult?.ok)
    const ready = backendConnected && lmstudioConnected && modelMatch
    const errorText = status?.details.error || inferenceResult?.inference.error || ''
    const loadedModel = status?.details.loaded_models[0] || 'None'
    const lastChecked = status?.details.last_checked ? new Date(status.details.last_checked * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'
    const inferenceDetail = inferenceResult
        ? inferenceResult.inference.error || (inferenceResult.ok ? `${inferenceResult.inference.latency_ms ?? 0} ms` : 'Inference test failed')
        : 'Not checked automatically'

    function copyError() {
        navigator.clipboard?.writeText(errorText || JSON.stringify(status, null, 2))
    }

    return (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/55 p-4 pt-20 backdrop-blur-sm">
            <div className="w-full max-w-5xl rounded-2xl border border-border bg-card shadow-2xl shadow-black/30">
                <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200"><Cpu size={17} /> Local AI Status</div>
                        <h2 className="mt-2 text-2xl font-semibold text-foreground">{ready ? 'Local AI Ready' : status?.details.error || 'Running diagnostics'}</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Auto-refresh checks FastAPI, LM Studio, and the loaded model only. The response prompt test runs only when you click Run Diagnostics.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={onRefresh} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground hover:bg-secondary">
                            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Refresh
                        </button>
                        <button onClick={onRunDiagnostics} disabled={!ready || inferenceLoading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50">
                            {inferenceLoading ? <Loader2 size={15} className="animate-spin" /> : <Activity size={15} />} Run Diagnostics
                        </button>
                        <button onClick={() => window.open('http://127.0.0.1:1234', '_blank')} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground hover:bg-secondary"><ExternalLink size={15} /> Open LM Studio</button>
                        <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"><X size={16} /></button>
                    </div>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <main className="space-y-5">
                        {loading && !status ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                {[1, 2, 3, 4].map(item => <div key={item} className="h-24 animate-pulse rounded-2xl bg-secondary" />)}
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                <CheckRow label="Backend" ok={backendConnected} detail={backendConnected ? 'Backend Running' : 'Backend Offline'} />
                                <CheckRow label="LM Studio" ok={lmstudioConnected} pending={status?.lmstudio === 'loading'} detail={lmstudioConnected ? 'LM Studio Connected' : status?.details.error || 'Cannot connect to LM Studio'} />
                                <CheckRow label="Loaded Model" ok={modelMatch} detail={modelMatch ? status?.model : 'Configured model does not match loaded model'} />
                                <CheckRow label="Inference" ok={inferenceOk} pending={!inferenceChecked} detail={inferenceDetail} />
                            </div>
                        )}

                        <div className="grid gap-3 md:grid-cols-3">
                            <DiagnosticMetric label="Configured Model" value={status?.model || 'Unknown'} />
                            <DiagnosticMetric label="Loaded Model" value={loadedModel} />
                            <DiagnosticMetric label="Model Match" value={modelMatch ? 'Yes' : 'No'} />
                            <DiagnosticMetric label="Status Latency" value={status?.details.latency_ms !== null && status?.details.latency_ms !== undefined ? `${status.details.latency_ms} ms` : 'N/A'} />
                            <DiagnosticMetric label="Inference" value={inferenceResult ? inferenceResult.inference.status : 'Not checked'} />
                            <DiagnosticMetric label="Last checked" value={lastChecked} />
                        </div>

                        <div className="rounded-2xl border border-border bg-secondary p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="font-semibold text-foreground">How to fix</div>
                                <button onClick={copyError} className="inline-flex items-center gap-2 text-xs text-cyan-200"><Copy size={13} /> Copy Error</button>
                            </div>
                            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                                {(inferenceResult?.fixes?.length ? inferenceResult.fixes : fixSuggestions(status)).map(item => <li key={item}>- {item}</li>)}
                            </ul>
                            {errorText && <pre className="mt-4 max-h-36 overflow-auto rounded-xl bg-background p-3 text-xs text-rose-100">{errorText}</pre>}
                        </div>
                    </main>

                    <aside className="space-y-4">
                        <div className="rounded-2xl border border-border bg-secondary p-4">
                            <div className="font-semibold text-foreground">Environment</div>
                            <dl className="mt-3 space-y-3 text-sm">
                                <DiagnosticPair label="API URL" value={status?.details.api_url || API_BASE_URL} />
                                <DiagnosticPair label="LM Studio URL" value={status?.details.lmstudio_url || 'http://127.0.0.1:1234/v1'} />
                                <DiagnosticPair label="Provider" value={status?.details.provider || 'Unknown'} />
                                <DiagnosticPair label="Configured model" value={status?.model || 'Unknown'} />
                                <DiagnosticPair label="Loaded model" value={loadedModel} />
                                <DiagnosticPair label="Environment" value={status?.details.environment || 'Unknown'} />
                            </dl>
                        </div>
                        <div className="rounded-2xl border border-border bg-secondary p-4">
                            <div className="font-semibold text-foreground">Recent logs</div>
                            <div className="mt-3 space-y-2">
                                {[
                                    status ? `GET /api/system/status returned backend=${status.backend}, lmstudio=${status.lmstudio}.` : 'Status endpoint has not returned yet.',
                                    inferenceResult ? `POST /api/system/inference-test ${inferenceResult.ok ? 'passed' : 'failed'} in ${inferenceResult.inference.latency_ms ?? 'N/A'} ms.` : 'Inference test has not been run.',
                                ].map(log => <div key={log} className="rounded-xl bg-background p-3 text-xs leading-5 text-muted-foreground">{log}</div>)}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}

function DiagnosticMetric({ label, value }: { label: string; value: string }) {
    return <div className="rounded-2xl border border-border bg-secondary p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 truncate text-sm font-semibold text-foreground">{value}</div></div>
}

function DiagnosticPair({ label, value }: { label: string; value: string }) {
    return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-all text-foreground">{value}</dd></div>
}
