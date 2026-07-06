import Card from '../../components/ui/Card'
import { SkillsContent } from '../../components/pages/IntelligencePages'

export default function SkillsPage() {
    return <SkillsContent />
    /*
    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-soft backdrop-blur-xl">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-200">Skills engine</div>
                    <h1 className="text-4xl font-semibold text-white">Skills</h1>
                    <p className="max-w-3xl text-base leading-8 text-zinc-400">View detected skills, active toolchains, and injection strategies that automate tasks across the AI platform.</p>
                </div>
            </section>

            <Card className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                    <div className="text-sm font-semibold text-white">Detected skills</div>
                    <div className="mt-3 text-sm text-zinc-400">Code review, document extraction, semantic search.</div>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                    <div className="text-sm font-semibold text-white">Active skills</div>
                    <div className="mt-3 text-sm text-zinc-400">Mentor, workflow router, task planner.</div>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                    <div className="text-sm font-semibold text-white">Tools registry</div>
                    <div className="mt-3 text-sm text-zinc-400">Prompt injection, model adapters, document retrieval.</div>
                </div>
            </Card>
        </div>
    )
    */
}
