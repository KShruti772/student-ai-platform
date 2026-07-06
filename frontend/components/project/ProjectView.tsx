'use client'

import React from 'react'
import WorkflowView from '../workflow/WorkflowView'
import ModelMonitor from '../monitor/ModelMonitor'
import Card from '../ui/Card'
import Header from '../ui/Header'
import { useProjectAnalytics } from '../../lib/hooks'

export default function ProjectView() {
    const { data: analytics, loading } = useProjectAnalytics()

    return (
        <div className="flex flex-col gap-4">
            <Header title="Project Overview" subtitle="Animated architecture" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <WorkflowView />
                <div className="space-y-4">
                    <ModelMonitor />
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium">Project Analytics</div>
                                <div className="text-xs text-muted">Summary of project health and progress</div>
                            </div>
                            <div className="text-xs text-muted">{loading ? 'Loading…' : 'Updated: just now'}</div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white/3 rounded-md">
                                <div className="text-xs text-muted">Tasks Completed</div>
                                <div className="text-lg font-semibold">{analytics?.tasksCompleted ?? '-'}</div>
                            </div>
                            <div className="p-3 bg-white/3 rounded-md">
                                <div className="text-xs text-muted">Tasks Pending</div>
                                <div className="text-lg font-semibold">{analytics?.tasksPending ?? '-'}</div>
                            </div>
                            <div className="p-3 bg-white/3 rounded-md">
                                <div className="text-xs text-muted">Code Lines</div>
                                <div className="text-lg font-semibold">{analytics?.codeLines ?? '-'}</div>
                            </div>
                            <div className="p-3 bg-white/3 rounded-md">
                                <div className="text-xs text-muted">Coverage</div>
                                <div className="text-lg font-semibold">{analytics?.coveragePct ?? '-'}%</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
