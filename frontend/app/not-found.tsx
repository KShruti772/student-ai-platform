import Link from 'next/link'

export default function NotFound() {
    return <div className="grid min-h-[calc(100vh-4rem)] place-items-center p-6"><div className="text-center"><div className="text-sm font-medium text-[var(--accent-strong)]">404</div><h2 className="mt-2 text-2xl font-semibold">Workspace not found</h2><p className="mt-2 text-sm text-[var(--muted)]">That page does not exist in this AI workspace.</p><Link href="/" className="mt-5 inline-flex h-10 items-center rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-white">Return home</Link></div></div>
}
