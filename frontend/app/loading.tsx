export default function Loading() {
    return (
        <div className="page-shell" aria-label="Loading workspace">
            <div className="h-4 w-28 animate-pulse rounded bg-[var(--surface-2)]" />
            <div className="mt-4 h-10 w-72 max-w-full animate-pulse rounded-lg bg-[var(--surface-2)]" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-[var(--surface)]" />)}
            </div>
        </div>
    )
}
