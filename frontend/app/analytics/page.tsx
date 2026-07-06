import { AnalyticsPage as StudentAnalyticsPage } from '../../components/student/StudentPages'

export default function AnalyticsPage() {
    return <StudentAnalyticsPage />
    /*
    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-soft backdrop-blur-xl">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-200">Analytics</div>
                    <h1 className="text-4xl font-semibold text-white">Analytics</h1>
                    <p className="max-w-3xl text-base leading-8 text-zinc-400">Track API usage, token throughput, model latency, workflow performance, and session statistics from one console.</p>
                </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                <Card className="min-h-[420px]">
                    <div className="space-y-4">
                        <div className="text-sm font-semibold text-white">Usage boards</div>
                        <div className="text-sm text-zinc-400">Explore trends for tokens, latency, request distribution, and workflow completion rates.</div>
                    </div>
                </Card>
                <Card className="space-y-4">
                    <div className="text-sm font-semibold text-white">Highlights</div>
                    <div className="grid gap-3 text-sm text-zinc-300">
                        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">Tokens consumed: 24.2k</div>
                        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">Workflows completed: 42</div>
                        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">Average latency: 28ms</div>
                    </div>
                </Card>
            </div>
        </div>
    )
    */
}
