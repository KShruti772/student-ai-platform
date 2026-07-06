'use client'

import { useRealtime } from '../hooks/useRealtime'

export default function RealtimeBridge() {
    useRealtime('default')
    return null
}
