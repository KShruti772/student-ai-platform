const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://127.0.0.1:8000'

export const API_BASE_URL = apiBase.replace(/\/$/, '')
export const WS_BASE_URL = (
    process.env.NEXT_PUBLIC_WS_URL ||
    process.env.NEXT_PUBLIC_API_WS_URL ||
    process.env.NEXT_PUBLIC_WS_BASE_URL ||
    `${API_BASE_URL.replace(/^http/, 'ws')}/ws`
).replace(/\/$/, '')

export function websocketUrl(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    if (WS_BASE_URL.endsWith('/ws') && normalizedPath.startsWith('/ws/')) {
        return `${WS_BASE_URL}${normalizedPath.slice(3)}`
    }
    return `${WS_BASE_URL}${normalizedPath}`
}
