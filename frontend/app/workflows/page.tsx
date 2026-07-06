import { Suspense } from 'react'
import WorkflowBuilder from '../../components/workflow/WorkflowBuilder'

export default function WorkflowsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-muted-foreground">Loading workflows...</div>}>
            <WorkflowBuilder />
        </Suspense>
    )
}
