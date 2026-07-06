import Card from '../../components/ui/Card'
import { ModelMonitorContent } from '../../components/pages/OperationalPages'

export default function ModelMonitorPage() {
    return <ModelMonitorContent />
    /*
    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-soft backdrop-blur-xl">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-200">Model monitor</div>
                    <h1 className="text-4xl font-semibold text-white">Model Monitor</h1>
                    <p className="max-w-3xl text-base leading-8 text-zinc-400">Observe latency, throughput, queue length, GPU and memory usage in realtime across your local model runtime.</p>
                </div>
            </section>

            <Card className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                    <div className="text-sm font-semibold text-white">Current latency</div>
                    <div className="mt-3 text-3xl font-semibold text-white">24ms</div>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                    <div className="text-sm font-semibold text-white">Token throughput</div>
                    <div className="mt-3 text-3xl font-semibold text-white">150/s</div>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                    <div className="text-sm font-semibold text-white">Queue size</div>
                    <div className="mt-3 text-3xl font-semibold text-white">2</div>
                </div>
            </Card>
        </div>
    )
    */
}
