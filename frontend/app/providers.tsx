'use client'

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: 1,
                        refetchOnWindowFocus: false,
                        refetchIntervalInBackground: false,
                        staleTime: 10_000,
                        gcTime: 1000 * 60 * 5,
                    },
                    mutations: {
                        retry: false,
                    },
                },
            }),
    )

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
