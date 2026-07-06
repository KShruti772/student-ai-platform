'use client'

import React, { PropsWithChildren } from 'react'
import ErrorBoundary from './ErrorBoundary'

export default function ClientRoot({ children }: PropsWithChildren) {
    return <ErrorBoundary>{children}</ErrorBoundary>
}
