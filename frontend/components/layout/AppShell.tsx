'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { Route } from 'next'
import {
    BarChart3,
    Bell,
    BookOpen,
    Database,
    FileText,
    Bot,
    ChevronLeft,
    ChevronRight,
    GitBranch,
    GraduationCap,
    Home,
    Layers,
    Menu,
    MessageSquare,
    Moon,
    Search,
    Settings,
    Sparkles,
    Sun,
    UserCircle,
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

type NavItem = { label: string; href: Route; icon: LucideIcon }

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [{
    label: 'Workspace',
    items: [
        { label: 'Home', href: '/', icon: Home },
        { label: 'AI Chat', href: '/chat', icon: MessageSquare },
        { label: 'Career Roadmap', href: '/career-roadmap' as Route, icon: GraduationCap },
        { label: 'Project Builder', href: '/projects' as Route, icon: GitBranch },
        { label: 'Resume Builder', href: '/resume' as Route, icon: FileText },
        { label: 'Knowledge Base', href: '/knowledge' as Route, icon: BookOpen },
        { label: 'Mentor', href: '/mentor' as Route, icon: Bot },
        { label: 'Progress Tracker', href: '/progress' as Route, icon: BarChart3 },
        { label: 'Workflow Studio', href: '/workflows' as Route, icon: Layers },
        { label: 'Settings', href: '/settings', icon: Settings },
    ],
}]

const PAGE_TITLES: Record<string, string> = {
    '/': 'Home',
    '/chat': 'AI Chat',
    '/career-roadmap': 'Career Roadmap',
    '/projects': 'Project Builder',
    '/resume': 'Resume Builder',
    '/workflows': 'Workflow Studio',
    '/agents': 'Agents',
    '/sessions': 'Sessions',
    '/knowledge': 'Knowledge',
    '/knowledge-base': 'Knowledge',
    '/mentor': 'Mentor',
    '/skills': 'Skills Engine',
    '/analytics': 'Progress Tracker',
    '/progress': 'Progress',
    '/model-monitor': 'Model Monitor',
    '/timeline': 'Timeline',
    '/settings': 'Settings',
    '/ai-workspace': 'AI Workspace',
    '/playground': 'Playground',
}

type ShellStatus = {
    modelLabel: string
    modelConnected: boolean
    storageLabel: string
}

function SidebarContent({
    collapsed,
    onNavigate,
    onToggle,
    onSearch,
    shellStatus,
    onToggleTheme,
    resolvedTheme,
}: {
    collapsed: boolean
    onNavigate?: () => void
    onToggle: () => void
    onSearch: () => void
    shellStatus: ShellStatus
    onToggleTheme: () => void
    resolvedTheme?: string
}) {
    const pathname = usePathname()

    return (
        <motion.div layout transition={{ type: 'spring', stiffness: 240, damping: 28 }} className="flex h-full flex-col rounded-2xl border border-border bg-sidebar p-4 shadow-xl shadow-black/5 backdrop-blur-xl transition-colors duration-150">
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
                <div className={clsx('rounded-2xl border border-border bg-card', collapsed ? 'grid h-11 place-items-center' : 'p-3')}>
                    {collapsed ? (
                        <Database size={17} className="text-muted-foreground" />
                    ) : (
                        <div className="flex items-center gap-3">
                            <Database size={17} className="text-cyan-400" />
                            <div className="min-w-0">
                                <div className="text-xs text-muted-foreground">Storage</div>
                                <div className="truncate text-sm font-medium text-foreground">{shellStatus.storageLabel}</div>
                            </div>
                        </div>
                    )}
                </div>
                <div className={clsx('rounded-2xl border border-border bg-card', collapsed ? 'grid h-11 place-items-center' : 'p-3')}>
                    {collapsed ? (
                        <span className={clsx('h-2.5 w-2.5 rounded-full', shellStatus.modelConnected ? 'bg-emerald-400' : 'bg-amber-400')} />
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className={clsx('h-2.5 w-2.5 rounded-full', shellStatus.modelConnected ? 'bg-emerald-400' : 'bg-amber-400')} />
                            <div className="min-w-0">
                                <div className="text-xs text-muted-foreground">Model Status</div>
                                <div className="truncate text-sm font-medium text-foreground">{shellStatus.modelLabel}</div>
                            </div>
                        </div>
                    )}
                </div>
                <button aria-label="Toggle theme" onClick={onToggleTheme} className={clsx('flex h-11 items-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-foreground', collapsed ? 'w-full justify-center' : 'w-full gap-3 px-3')}>
                    {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
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

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [commandOpen, setCommandOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [modelStatus, setModelStatus] = useState<api.ModelStatus | null>(null)
    const [storageLabel, setStorageLabel] = useState('Local browser')
    const { setTheme, resolvedTheme } = useTheme()

    useEffect(() => {
        const savedCollapsed = localStorage.getItem('student-ai:sidebar')
        setCollapsed(savedCollapsed === 'collapsed')
        setMounted(true)
    }, [])

    useEffect(() => {
        let mountedEffect = true
        api.getModelStatus()
            .then(status => { if (mountedEffect) setModelStatus(status) })
            .catch(() => { if (mountedEffect) setModelStatus({ connected: false, model: 'Model unavailable', error: 'Backend unavailable' }) })
        if (navigator.storage?.estimate) {
            navigator.storage.estimate().then(estimate => {
                if (!mountedEffect) return
                const usedMb = Math.round((estimate.usage || 0) / 1024 / 1024)
                const quotaMb = Math.round((estimate.quota || 0) / 1024 / 1024)
                setStorageLabel(quotaMb ? `${usedMb} MB / ${quotaMb} MB` : `${usedMb} MB used`)
            }).catch(() => setStorageLabel('Local browser'))
        }
        return () => { mountedEffect = false }
    }, [])

    const toggleTheme = () => {
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

    const shellStatus = useMemo<ShellStatus>(() => ({
        modelLabel: modelStatus?.model || 'Checking model',
        modelConnected: Boolean(modelStatus?.connected && modelStatus?.model_loaded),
        storageLabel,
    }), [modelStatus, storageLabel])

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-150">
                <CommandPalette commands={commands} open={commandOpen} onOpenChange={setCommandOpen} />

                <motion.aside layout initial={false} animate={{ width: collapsed ? 88 : 280 }} transition={{ type: 'spring', stiffness: 260, damping: 30 }} className={clsx('fixed inset-y-0 left-0 z-40 hidden p-4 transition-[width] duration-200 lg:block', collapsed ? 'w-[88px]' : 'w-[280px]')}>
                    <SidebarContent collapsed={collapsed} onToggle={toggleSidebar} onSearch={() => setCommandOpen(true)} shellStatus={shellStatus} onToggleTheme={toggleTheme} resolvedTheme={resolvedTheme} />
                </motion.aside>

                {mobileOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <aside className="relative h-full w-[280px] bg-sidebar p-3 shadow-2xl">
                            <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"><X size={18} /></button>
                            <SidebarContent collapsed={false} onToggle={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} onSearch={() => setCommandOpen(true)} shellStatus={shellStatus} onToggleTheme={toggleTheme} resolvedTheme={resolvedTheme} />
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
                        <div className="hidden h-11 max-w-[240px] items-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm text-muted-foreground lg:flex">
                            <span className={clsx('h-2.5 w-2.5 rounded-full', shellStatus.modelConnected ? 'bg-emerald-400' : 'bg-amber-400')} />
                            <span className="truncate">{shellStatus.modelLabel}</span>
                        </div>
                        <div className="relative">
                            <button aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(value => !value)} className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                                <Bell size={16} />
                            </button>
                            {notificationsOpen && (
                                <div className="absolute right-0 top-13 z-50 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-4 text-sm shadow-xl shadow-black/10">
                                    <div className="font-semibold text-foreground">Notifications</div>
                                    <div className="mt-3 rounded-2xl border border-border bg-secondary p-3">
                                        <div className="flex items-center gap-2">
                                            <span className={clsx('h-2.5 w-2.5 rounded-full', shellStatus.modelConnected ? 'bg-emerald-400' : 'bg-amber-400')} />
                                            <span className="font-medium text-foreground">{shellStatus.modelConnected ? 'AI model connected' : 'AI model needs attention'}</span>
                                        </div>
                                        <p className="mt-2 leading-6 text-muted-foreground">{shellStatus.modelConnected ? `${shellStatus.modelLabel} is available for AI workflows.` : 'Start the backend and LM Studio to enable real AI responses.'}</p>
                                    </div>
                                    <div className="mt-3 rounded-2xl border border-border bg-secondary p-3">
                                        <div className="font-medium text-foreground">Workspace storage</div>
                                        <p className="mt-2 leading-6 text-muted-foreground">{shellStatus.storageLabel}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button aria-label="Toggle theme" onClick={toggleTheme} className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                            {mounted && resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button aria-label="Profile" className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                            <UserCircle size={17} />
                        </button>
                    </header>

                    <div className="flex">
                        <AnimatePresence mode="wait">
                            <motion.main key={pathname} id="main-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }} className="min-w-0 flex-1">
                                {children}
                            </motion.main>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    )
}
