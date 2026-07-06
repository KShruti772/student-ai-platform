'use client'

import { useEffect, useState } from 'react'
import { Check, Database, Eye, Keyboard, MonitorSmartphone, Save, Settings2, Sparkles, Wifi, Zap } from 'lucide-react'
import { API_BASE_URL, WS_BASE_URL } from '../../lib/endpoints'

export default function SettingsWorkspace() {
    const [compact, setCompact] = useState(false)
    const [reduceMotion, setReduceMotion] = useState(false)
    const [appearance, setAppearance] = useState<'dark' | 'aurora' | 'midnight'>('dark')
    const [modelMode, setModelMode] = useState<'local' | 'cloud' | 'hybrid'>('hybrid')
    const [backendMode, setBackendMode] = useState<'local' | 'remote'>('local')
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        setCompact(localStorage.getItem('student-ai:compact') === 'true')
        setReduceMotion(localStorage.getItem('student-ai:reduce-motion') === 'true')
        const savedAppearance = localStorage.getItem('student-ai:appearance') as 'dark' | 'aurora' | 'midnight' | null
        const savedModel = localStorage.getItem('student-ai:model') as 'local' | 'cloud' | 'hybrid' | null
        const savedBackend = localStorage.getItem('student-ai:backend') as 'local' | 'remote' | null
        if (savedAppearance) setAppearance(savedAppearance)
        if (savedModel) setModelMode(savedModel)
        if (savedBackend) setBackendMode(savedBackend)
    }, [])

    const save = () => {
        localStorage.setItem('student-ai:compact', String(compact))
        localStorage.setItem('student-ai:reduce-motion', String(reduceMotion))
        localStorage.setItem('student-ai:appearance', appearance)
        localStorage.setItem('student-ai:model', modelMode)
        localStorage.setItem('student-ai:backend', backendMode)
        document.documentElement.dataset.compact = compact ? 'true' : 'false'
        document.documentElement.dataset.reduceMotion = reduceMotion ? 'true' : 'false'
        setSaved(true)
        window.setTimeout(() => setSaved(false), 1600)
    }

    return (
        <div className="page-shell">
            <div className="page-heading"><div className="page-kicker">Preferences</div><h2 className="page-title">Settings</h2><p className="page-description">Tune the workspace for calm operation, local execution, and the right blend of automation and control.</p></div>
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                    <section className="workspace-card p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold">Appearance</div>
                                <div className="mt-1 text-xs text-[var(--muted)]">Choose the workspace tone and density that feels best for your flow.</div>
                            </div>
                            <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">Live preview</div>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {(['dark', 'aurora', 'midnight'] as const).map((option) => (
                                <button key={option} onClick={() => setAppearance(option)} className={`rounded-2xl border p-3 text-left text-sm transition ${appearance === option ? 'border-[var(--accent-strong)] bg-[var(--accent-soft)]/20' : 'border-[var(--border)] bg-[var(--surface)]/70'}`}>
                                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">{option}</div>
                                    <div className="mt-2 h-16 rounded-xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)]" />
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 divide-y divide-[var(--border)]">
                            <label className="flex cursor-pointer items-center justify-between gap-4 py-4"><div><div className="text-sm font-medium">Compact density</div><div className="mt-1 text-xs text-[var(--muted)]">Reduce spacing in data-heavy views.</div></div><input type="checkbox" checked={compact} onChange={(event) => setCompact(event.target.checked)} className="h-4 w-4 accent-[var(--accent)]" /></label>
                            <label className="flex cursor-pointer items-center justify-between gap-4 py-4"><div><div className="text-sm font-medium">Reduce motion</div><div className="mt-1 text-xs text-[var(--muted)]">Minimize nonessential transitions.</div></div><input type="checkbox" checked={reduceMotion} onChange={(event) => setReduceMotion(event.target.checked)} className="h-4 w-4 accent-[var(--accent)]" /></label>
                        </div>
                        <button onClick={save} className="mt-5 flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-white">{saved ? <Check size={15} /> : <Save size={15} />}{saved ? 'Saved' : 'Save preferences'}</button>
                    </section>

                    <section className="workspace-card p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={15} className="text-[var(--accent-strong)]" /> AI models & execution</div>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {([
                                ['local', 'Local inference'],
                                ['cloud', 'Cloud gateway'],
                                ['hybrid', 'Hybrid fallback'],
                            ] as const).map(([value, label]) => (
                                <button key={value} onClick={() => setModelMode(value)} className={`rounded-2xl border p-3 text-left text-sm ${modelMode === value ? 'border-[var(--accent-strong)] bg-[var(--accent-soft)]/20' : 'border-[var(--border)] bg-[var(--surface)]/70'}`}>
                                    <div className="font-medium">{label}</div>
                                    <div className="mt-1 text-xs text-[var(--muted)]">{value === 'local' ? 'Fast private responses' : value === 'cloud' ? 'Higher capability' : 'Balanced routing'}</div>
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {(['local', 'remote'] as const).map((value) => <button key={value} onClick={() => setBackendMode(value)} className={`rounded-full px-3 py-1.5 text-sm ${backendMode === value ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-2)] text-[var(--muted)]'}`}>{value === 'local' ? 'Local backend' : 'Remote backend'}</button>)}
                        </div>
                    </section>
                </div>

                <aside className="space-y-4">
                    <div className="workspace-card p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold"><MonitorSmartphone size={15} className="text-[var(--accent-strong)]" /> Preview</div>
                        <div className="mt-4 rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface-2)]/70 p-4 text-sm text-[var(--muted)]">
                            <div className="flex items-center justify-between"><span>Workspace tone</span><span className="font-medium text-[var(--text)]">{appearance}</span></div>
                            <div className="mt-3 flex items-center justify-between"><span>Model mode</span><span className="font-medium text-[var(--text)]">{modelMode}</span></div>
                            <div className="mt-3 flex items-center justify-between"><span>Connection</span><span className="font-medium text-[var(--text)]">{backendMode}</span></div>
                        </div>
                    </div>
                    <div className="workspace-card p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold"><Keyboard size={15} className="text-[var(--accent-strong)]" /> Keyboard shortcuts</div>
                        <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                            <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)]/70 px-3 py-2"><span>Open command palette</span><span className="font-medium text-[var(--text)]">Ctrl/Cmd + K</span></div>
                            <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)]/70 px-3 py-2"><span>Focus composer</span><span className="font-medium text-[var(--text)]">/</span></div>
                            <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)]/70 px-3 py-2"><span>Toggle context panel</span><span className="font-medium text-[var(--text)]">Shift + C</span></div>
                        </div>
                    </div>
                    <div className="workspace-card p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold"><Database size={15} className="text-[var(--accent-strong)]" /> Connectivity</div>
                        <div className="mt-4 space-y-3 text-xs">
                            <div className="rounded-xl bg-[var(--surface-2)] p-3"><div className="mb-2 flex items-center gap-2 font-medium"><Database size={14} /> API base</div><code className="break-all text-[var(--muted)]">{API_BASE_URL}</code></div>
                            <div className="rounded-xl bg-[var(--surface-2)] p-3"><div className="mb-2 flex items-center gap-2 font-medium"><Wifi size={14} /> Websocket base</div><code className="break-all text-[var(--muted)]">{WS_BASE_URL}</code></div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}
