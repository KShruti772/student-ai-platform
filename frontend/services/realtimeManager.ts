'use client'

type MessageHandler = (data: any) => void
type StatusHandler = (status: { status: string; attempts?: number; lastHeartbeat?: number; latencyMs?: number; dropped?: number }) => void

type Subscriber = {
    onMessage?: MessageHandler
    onStatus?: StatusHandler
    // optional callback invoked when connection becomes open so subscribers can resubscribe server-side
    onSubscribe?: () => void
}

type Conn = {
    ws: WebSocket | null
    subscribers: Set<Subscriber>
    attempts: number
    reconnectTimer: ReturnType<typeof setTimeout> | null
    heartbeatTimer: ReturnType<typeof setInterval> | null
    staleTimer: ReturnType<typeof setInterval> | null
    lastHeartbeat?: number
    state: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed'
    dropped: number
    received: number
}

class RealtimeManagerClass {
    private conns = new Map<string, Conn>()

    subscribe(url: string, sub: Subscriber, options?: { heartbeatMs?: number; staleMs?: number; maxBackoffMs?: number; maxAttempts?: number }) {
        const heartbeatMs = options?.heartbeatMs ?? 15000
        const staleMs = options?.staleMs ?? 35000
        const maxBackoffMs = options?.maxBackoffMs ?? 12000
        const maxAttempts = options?.maxAttempts ?? 12

        if (!this.conns.has(url)) {
            this.conns.set(url, { ws: null, subscribers: new Set(), attempts: 0, reconnectTimer: null, heartbeatTimer: null, staleTimer: null, lastHeartbeat: undefined, state: 'idle', dropped: 0, received: 0 })
            this.connect(url, { heartbeatMs, staleMs, maxBackoffMs, maxAttempts })
        }

        const conn = this.conns.get(url)!
        conn.subscribers.add(sub)

        // notify initial status
        sub.onStatus?.({ status: conn.state, attempts: conn.attempts, lastHeartbeat: conn.lastHeartbeat, dropped: conn.dropped })

        const unsubscribe = () => {
            conn.subscribers.delete(sub)
            if (conn.subscribers.size === 0) {
                this.cleanup(url)
            }
        }

        return { unsubscribe, send: (payload: unknown) => this.send(url, payload) }
    }

    private connect(url: string, opts: { heartbeatMs: number; staleMs: number; maxBackoffMs: number; maxAttempts: number }) {
        const conn = this.conns.get(url)
        if (!conn) return

        const { heartbeatMs, staleMs, maxBackoffMs, maxAttempts } = opts

        conn.state = 'connecting'
        this.emitStatus(url, { status: conn.state, attempts: conn.attempts })

        try {
            conn.ws = new WebSocket(url)
        } catch (e) {
            conn.attempts += 1
            const jitter = Math.floor(Math.random() * 250)
            const delay = Math.min(500 * 2 ** conn.attempts + jitter, maxBackoffMs)
            conn.state = conn.attempts > maxAttempts ? 'failed' : 'reconnecting'
            conn.reconnectTimer = setTimeout(() => this.connect(url, opts), delay)
            this.emitStatus(url, { status: conn.state, attempts: conn.attempts })
            return
        }

        const ws = conn.ws

        ws.onopen = () => {
            conn.attempts = 0
            conn.state = 'connected'
            conn.lastHeartbeat = Date.now()
            conn.received = 0
            conn.dropped = 0
            this.emitStatus(url, { status: conn.state, attempts: 0, lastHeartbeat: conn.lastHeartbeat, latencyMs: 0, dropped: conn.dropped })

            if (conn.heartbeatTimer) clearInterval(conn.heartbeatTimer)
            conn.heartbeatTimer = setInterval(() => {
                this.send(url, { type: 'ping', ts: Date.now() })
            }, heartbeatMs)

            if (conn.staleTimer) clearInterval(conn.staleTimer)
            conn.staleTimer = setInterval(() => {
                const last = conn.lastHeartbeat || 0
                if (Date.now() - last > staleMs) {
                    // mark stale and attempt reconnect
                    this.emitStatus(url, { status: 'reconnecting', lastHeartbeat: last, attempts: conn.attempts, dropped: conn.dropped })
                    try { if (ws && ws.readyState === WebSocket.OPEN) ws.close() } catch { }
                }
            }, Math.max(5000, Math.floor(staleMs / 3)))

            // notify subscribers they may need to resubscribe server-side
            for (const s of conn.subscribers) s.onSubscribe?.()
        }

        ws.onmessage = (ev) => {
            conn.received += 1
            let data: any = ev.data
            try { data = JSON.parse(ev.data) } catch { data = { type: 'log', message: String(ev.data), ts: Date.now() } }
            if (data?.type === 'heartbeat' || data?.type === 'pong') {
                const ts = Number(data.ts || Date.now())
                conn.lastHeartbeat = Date.now()
                this.emitStatus(url, { status: 'connected', lastHeartbeat: conn.lastHeartbeat, latencyMs: Math.max(0, Date.now() - ts), dropped: conn.dropped })
                return
            }
            for (const s of conn.subscribers) s.onMessage?.(data)
        }

        ws.onerror = (ev) => {
            conn.state = 'reconnecting'
            this.emitStatus(url, { status: conn.state, attempts: conn.attempts + 1, dropped: conn.dropped })
            console.error('RealtimeManager websocket error', ev)
        }

        ws.onclose = () => {
            if (conn.heartbeatTimer) { clearInterval(conn.heartbeatTimer); conn.heartbeatTimer = null }
            if (conn.staleTimer) { clearInterval(conn.staleTimer); conn.staleTimer = null }
            if (conn.reconnectTimer) { clearTimeout(conn.reconnectTimer); conn.reconnectTimer = null }
            conn.attempts += 1
            conn.state = conn.attempts > opts.maxAttempts ? 'failed' : 'reconnecting'
            const jitter = Math.floor(Math.random() * 250)
            const delay = Math.min(500 * 2 ** conn.attempts + jitter, opts.maxBackoffMs)
            this.emitStatus(url, { status: conn.state, attempts: conn.attempts, dropped: conn.dropped })
            conn.reconnectTimer = setTimeout(() => this.connect(url, opts), delay)
        }
    }

    private emitStatus(url: string, s: { status: string; attempts?: number; lastHeartbeat?: number; latencyMs?: number; dropped?: number }) {
        const conn = this.conns.get(url)
        if (!conn) return
        for (const sub of conn.subscribers) sub.onStatus?.(s)
    }

    send(url: string, payload: unknown) {
        const conn = this.conns.get(url)
        if (!conn || !conn.ws || conn.ws.readyState !== WebSocket.OPEN) {
            if (conn) conn.dropped += 1
            return false
        }
        try {
            conn.ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload))
            return true
        } catch (e) {
            conn.dropped += 1
            console.error('RealtimeManager send failed', e)
            return false
        }
    }

    private cleanup(url: string) {
        const conn = this.conns.get(url)
        if (!conn) return
        if (conn.heartbeatTimer) clearInterval(conn.heartbeatTimer)
        if (conn.staleTimer) clearInterval(conn.staleTimer)
        if (conn.reconnectTimer) clearTimeout(conn.reconnectTimer)
        if (conn.ws && conn.ws.readyState === WebSocket.OPEN) conn.ws.close()
        this.conns.delete(url)
    }

    // optional: get quick stats for monitoring
    getStats(url: string) {
        const conn = this.conns.get(url)
        if (!conn) return null
        return { state: conn.state, attempts: conn.attempts, lastHeartbeat: conn.lastHeartbeat, received: conn.received, dropped: conn.dropped }
    }
}

const RealtimeManager = new RealtimeManagerClass()
export default RealtimeManager
