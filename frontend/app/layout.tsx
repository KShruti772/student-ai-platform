import './globals.css'
import 'highlight.js/styles/github-dark.css'
import type { ReactNode } from 'react'
import AppShell from '../components/layout/AppShell'
import ThemeProvider from '../components/providers/ThemeProvider'
import RealtimeBridge from '../components/RealtimeBridge'

export const metadata = {
    title: 'Student AI Platform',
    description: 'Local-first AI operator workspace for realtime orchestration, mentoring, workflows, and observability',
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <RealtimeBridge />
                    <AppShell>{children}</AppShell>
                </ThemeProvider>
            </body>
        </html>
    )
}
