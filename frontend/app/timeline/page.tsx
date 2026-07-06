import Card from '../../components/ui/Card'
import { TimelineContent } from '../../components/pages/OperationalPages'

export default function TimelinePage() {
    return <TimelineContent />
    /*
    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-soft backdrop-blur-xl">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-200">Event stream</div>
                    <h1 className="text-4xl font-semibold text-white">Timeline / Event Stream</h1>
                    <p className="max-w-3xl text-base leading-8 text-zinc-400">Inspect session events, live chat traces, and workflow events with a demo-ready event stream layout.</p>
                </div>
            </section>

            <Card className="min-h-[420px]">
                <div className="space-y-4">
                    <div className="text-sm font-semibold text-white">Realtime event stream</div>
                    <div className="text-sm text-zinc-400">This view brings together websocket operations, session events, and reasoning traces into a cohesive timeline.</div>
                </div>
            </Card>
        </div>
    )
    */
}
