import { KnowledgePage as StudentKnowledgePage } from '../../components/student/StudentPages'

export default function KnowledgeBasePage() {
    return <StudentKnowledgePage />
    /*
    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-soft backdrop-blur-xl">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-200">Knowledge base</div>
                    <h1 className="text-4xl font-semibold text-white">Knowledge Base</h1>
                    <p className="max-w-3xl text-base leading-8 text-zinc-400">Upload documents, manage your semantic index, and power retrieval-enabled AI workflows with contextual search.</p>
                </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                <Card className="min-h-[420px]">
                    <div className="space-y-4">
                        <div className="text-sm font-semibold text-white">Upload center</div>
                        <div className="text-sm text-zinc-400">Drag-and-drop content to build searchable knowledge collections for the AI mentor and workflow contexts.</div>
                    </div>
                </Card>
                <Card className="space-y-4">
                    <div className="text-sm font-semibold text-white">Index insights</div>
                    <div className="grid gap-3 text-sm text-zinc-300">
                        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">Documents indexed: 27</div>
                        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">Embedding status: healthy</div>
                        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">Query latency: 20ms</div>
                    </div>
                </Card>
            </div>
        </div>
    )
    */
}
