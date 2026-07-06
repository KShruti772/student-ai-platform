'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="grid min-h-[calc(100vh-4rem)] place-items-center p-6">
            <div className="workspace-card max-w-md p-8 text-center">
                <AlertTriangle className="mx-auto text-rose-500" />
                <h2 className="mt-4 text-xl font-semibold">This view hit a snag</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Your session is still safe. Retry the view, or use the sidebar to continue elsewhere.</p>
                <button onClick={reset} className="mx-auto mt-5 flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-white"><RefreshCw size={15} /> Try again</button>
            </div>
        </div>
    )
}
