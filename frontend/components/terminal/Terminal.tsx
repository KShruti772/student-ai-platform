"use client"
import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function Terminal() {
    const [lines, setLines] = useState<string[]>(['$ student-ai@local:~$'])
    const [input, setInput] = useState('')
    const ref = useRef<HTMLDivElement | null>(null)

    useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [lines])

    function submit() {
        if (!input) return
        setLines(l => [...l, `$ ${input}`])
        // fake processing
        setTimeout(() => setLines(l => [...l, `> executed: ${input}`, '$']), 400)
        setInput('')
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-black/70 rounded p-3 font-mono text-sm text-green-200 h-64 flex flex-col">
            <div ref={ref} className="flex-1 overflow-auto space-y-1">
                {lines.map((ln, i) => <div key={i}>{ln}</div>)}
            </div>
            <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-400">$</span>
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit() }} className="flex-1 bg-transparent outline-none" placeholder="type command..." />
                <button onClick={submit} className="px-3 py-1 bg-indigo-600 rounded">Run</button>
            </div>
        </motion.div>
    )
}
