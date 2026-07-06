'use client'

import React from 'react'

type State = { hasError: boolean }

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
    constructor(props: any) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error: any, info: any) {
        console.error('Unhandled error in UI', error, info)
        // TODO: send to remote logging endpoint
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#07070a] to-[#0b0f1a] text-white">
                    <div className="max-w-md p-6 bg-black/50 glass rounded-lg text-center">
                        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
                        <p className="text-sm text-gray-300 mb-4">An unexpected error occurred. Try refreshing or reconnecting.</p>
                        <div className="flex justify-center gap-2">
                            <button onClick={() => location.reload()} className="px-3 py-2 bg-violet-600 rounded">Reload</button>
                        </div>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}
