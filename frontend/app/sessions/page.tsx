import Card from '../../components/ui/Card'
import { SessionsContent } from '../../components/pages/OperationalPages'

export default function SessionsPage() {
    return <SessionsContent />
    /*
    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-soft backdrop-blur-xl">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-200">Session explorer</div>
                    <h1 className="text-4xl font-semibold text-white">Sessions</h1>
                    <p className="max-w-3xl text-base leading-8 text-zinc-400">Review timeline replay, grouped events, token streams, and conversation analytics for interactive AI sessions.</p>
                </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                <Card className="min-h-[420px]">
                    <div className="space-y-4">
                        <div className="text-sm font-semibold text-white">Live session overview</div>
                        <div className="text-sm text-zinc-400">Select a session from the list to restore chat, replay reasoning events, and understand the AI decision path.</div>
                    </div>
                </Card>
                <Card className="space-y-4">
                    <div className="text-sm font-semibold text-white">Insight panel</div>
                    <div className="grid gap-3 text-sm text-zinc-300">
                        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">Active sessions: 14</div>
                        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">Average token rate: 148/s</div>
                        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">Replay snapshots ready</div>
                    </div>
                </Card>
            </div>
        </div>
    )
    */
}
