import Card from '../../components/ui/Card'

export default function PlaygroundPage() {
    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-soft backdrop-blur-xl">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-200">Playground</div>
                    <h1 className="text-4xl font-semibold text-white">Playground</h1>
                    <p className="max-w-3xl text-base leading-8 text-zinc-400">Run ad hoc prompts, test model behavior, and experiment with AI capabilities in an isolated workspace environment.</p>
                </div>
            </section>

            <Card className="min-h-[420px]">
                <div className="space-y-4">
                    <div className="text-sm font-semibold text-white">Experiment board</div>
                    <div className="text-sm text-zinc-400">Launch quick experiments, compare outputs, and refine prompts before adding them to your workflows.</div>
                </div>
            </Card>
        </div>
    )
}
