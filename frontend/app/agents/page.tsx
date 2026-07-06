import React from 'react'
import AgentActivityPanel from '../../components/AgentActivityPanel'
import Card from '../../components/ui/Card'
import StatusPill from '../../components/ui/StatusPill'
import { Users, Zap, Sparkles } from 'lucide-react'
import { AgentsContent } from '../../components/pages/OperationalPages'

export default function AgentsPage() {
    return <AgentsContent />
    /*
    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-soft backdrop-blur-xl">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-200">Agent fleet</div>
                        <h1 className="text-4xl font-semibold text-white">Active agents</h1>
                        <p className="max-w-3xl text-base leading-8 text-zinc-400">Monitor agent health, workloads, and heartbeat status with telemetry that stays in sync across the platform.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <StatusPill status="connected" label="Realtime" icon={<Sparkles size={12} />} />
                        <StatusPill status="syncing" label="Heartbeat" icon={<Zap size={12} />} />
                    </div>
                </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                <div>
                    <AgentActivityPanel />
                </div>
                <Card className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-sm font-semibold text-white">Agent insights</div>
                            <div className="text-sm text-zinc-400">Task distribution, latency, and health summary.</div>
                        </div>
                        <Users size={20} className="text-cyan-300" />
                    </div>
                    <div className="grid gap-3">
                        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                            <div className="font-semibold text-white">Average task latency</div>
                            <div className="mt-2 text-3xl font-semibold text-white">220ms</div>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                            <div className="font-semibold text-white">Workloads in flight</div>
                            <div className="mt-2 text-3xl font-semibold text-white">18</div>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                            <div className="font-semibold text-white">Agents online</div>
                            <div className="mt-2 text-3xl font-semibold text-white">8</div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
    */
}
