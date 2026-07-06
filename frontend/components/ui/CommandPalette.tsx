"use client"
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Bot, GitBranch, Search, Terminal, Zap } from 'lucide-react'

type Cmd = { id: string; title: string; action: () => void }

const icons = [Zap, Activity, Bot, GitBranch, Terminal]

export default function CommandPalette({
    commands = [] as Cmd[],
    open,
    onOpenChange,
}: {
    commands?: Cmd[]
    open?: boolean
    onOpenChange?: (open: boolean) => void
}) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [query, setQuery] = useState('')
    const isOpen = open ?? internalOpen
    const setOpen = onOpenChange ?? setInternalOpen

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                setOpen(!isOpen)
            }
            if (e.key === 'Escape') setOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isOpen, setOpen])

    const filtered = commands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 pt-24 backdrop-blur-sm">
                    <motion.div initial={{ y: -18, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: -10, scale: 0.98 }} className="glass w-full max-w-2xl rounded-lg p-3">
                        <div className="flex items-center gap-3 border-b border-white/10 px-3 pb-3">
                            <Search className="h-5 w-5 text-cyan-300" />
                            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search commands, agents, workflows..." className="flex-1 bg-transparent p-2 text-base outline-none placeholder:text-zinc-500" />
                            <button onClick={() => setOpen(false)} className="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/10">Esc</button>
                        </div>
                        <div className="mt-2 max-h-72 overflow-auto">
                            {filtered.map((c, index) => {
                                const Icon = icons[index % icons.length]
                                return (
                                    <motion.button
                                        key={c.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.035 }}
                                        className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-white/10"
                                        onClick={() => { c.action(); setOpen(false) }}
                                    >
                                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-400/10 text-cyan-200"><Icon size={17} /></span>
                                        <span className="font-medium text-zinc-100">{c.title}</span>
                                    </motion.button>
                                )
                            })}
                            {!filtered.length && (
                                <div className="p-8 text-center text-sm text-zinc-400">No commands match that query.</div>
                            )}
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-white/10 px-3 pt-3 text-xs text-zinc-500">
                            <span>Ctrl/Cmd+K opens command mode</span>
                            <span>Enter runs the selected command</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
