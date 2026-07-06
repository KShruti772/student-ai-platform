import { SettingsPage as StudentSettingsPage } from '../../components/student/StudentPages'

export default function SettingsPage() {
    return <StudentSettingsPage />
    /*
    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-soft backdrop-blur-xl">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-200">Settings</div>
                    <h1 className="text-4xl font-semibold text-white">Settings</h1>
                    <p className="max-w-3xl text-base leading-8 text-zinc-400">Configure platform preferences, websocket connection options, integrations, and user interface settings.</p>
                </div>
            </section>

            <Card className="min-h-[420px]">
                <div className="space-y-4">
                    <div className="text-sm font-semibold text-white">Platform configuration</div>
                    <div className="text-sm text-zinc-400">Adjust theme, API connectivity, workspace defaults, and developer preferences from a single place.</div>
                </div>
            </Card>
        </div>
    )
    */
}
