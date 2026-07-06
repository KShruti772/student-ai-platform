'use client'

export type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'stale' | 'offline'

type StatusSnapshot = {
    status: RealtimeStatus
    attempts: number
    lastHeartbeat?: number
    latencyMs?: number
    dropped?: number
    url?: string
}

type Subscriber = {
    onMessage?: (data: unknown) => void
    onStatus?: (status: StatusSnapshot) => void
    onSubscribe?: () => void
}

type Options = {
    heartbeatMs: number
    staleMs: number
    maxBackoffMs: number
    maxAttempts: number
}

type Connection = {
    socket: WebSocket | null
    subscribers: Set<Subscriber>
    options: Options
    attempts: number
    reconnectTimer: ReturnType<typeof setTimeout> | null
    heartbeatTimer: ReturnType<typeof setInterval> | null
    staleTimer: ReturnType<typeof setInterval> | null
    lastHeartbeat?: number
    status: RealtimeStatus
    dropped: number
    received: number
    generation: number
}

const DEFAULT_OPTIONS: Options = {
    heartbeatMs: 15_000,
    staleMs: 35_000,
    maxBackoffMs: 15_000,
    maxAttempts: 10,
}

class RealtimeManager {
    private connections = new Map<string, Connection>()

    subscribe(url: string, subscriber: Subscriber, options: Partial<Options> = {}) {
        let connection = this.connections.get(url)
        if (!connection) {
            connection = {
                socket: null,
                subscribers: new Set(),
                options: { ...DEFAULT_OPTIONS, ...options },
                attempts: 0,
                reconnectTimer: null,
                heartbeatTimer: null,
                staleTimer: null,
                status: navigator.onLine ? 'connecting' : 'offline',
                dropped: 0,
                received: 0,
                generation: 0,
            }
            this.connections.set(url, connection)
        }

        connection.subscribers.add(subscriber)
        subscriber.onStatus?.(this.snapshot(url, connection))
        if (!connection.socket && !connection.reconnectTimer && navigator.onLine) this.connect(url, connection)

        const onOnline = () => {
            const current = this.connections.get(url)
            if (!current || current.subscribers.size === 0 || current.socket || current.reconnectTimer) return
            current.attempts = 0
            this.connect(url, current)
        }
        const onOffline = () => {
            const current = this.connections.get(url)
            if (!current) return
            this.clearTimers(current)
            current.status = 'offline'
            const socket = current.socket
            current.socket = null
            current.generation += 1
            socket?.close()
            this.emitStatus(url, current)
        }
        window.addEventListener('online', onOnline)
        window.addEventListener('offline', onOffline)

        let active = true
        return {
            unsubscribe: () => {
                if (!active) return
                active = false
                window.removeEventListener('online', onOnline)
                window.removeEventListener('offline', onOffline)
                const current = this.connections.get(url)
                current?.subscribers.delete(subscriber)
                if (current && current.subscribers.size === 0) this.dispose(url, current)
            },
            send: (payload: unknown) => this.send(url, payload),
        }
    }

    send(url: string, payload: unknown) {
        const connection = this.connections.get(url)
        if (!connection?.socket || connection.socket.readyState !== WebSocket.OPEN) {
            if (connection) connection.dropped += 1
            return false
        }
        try {
            connection.socket.send(typeof payload === 'string' ? payload : JSON.stringify(payload))
            return true
        } catch {
            connection.dropped += 1
            return false
        }
    }

    getStats(url: string) {
        const connection = this.connections.get(url)
        if (!connection) return null
        return { ...this.snapshot(url, connection), subscribers: connection.subscribers.size, received: connection.received }
    }

    private connect(url: string, connection: Connection) {
        if (connection.subscribers.size === 0 || !navigator.onLine) {
            connection.status = 'offline'
            this.emitStatus(url, connection)
            return
        }
        this.clearTimers(connection)
        connection.generation += 1
        const generation = connection.generation
        connection.status = connection.attempts > 0 ? 'reconnecting' : 'connecting'
        this.emitStatus(url, connection)

        let socket: WebSocket
        try {
            socket = new WebSocket(url)
        } catch {
            this.scheduleReconnect(url, connection)
            return
        }
        connection.socket = socket

        socket.onopen = () => {
            if (!this.isCurrent(url, connection, generation)) return
            connection.attempts = 0
            connection.status = 'connected'
            connection.lastHeartbeat = Date.now()
            this.emitStatus(url, connection, 0)
            connection.heartbeatTimer = setInterval(() => this.send(url, { type: 'ping', ts: Date.now() }), connection.options.heartbeatMs)
            connection.staleTimer = setInterval(() => {
                if (!connection.lastHeartbeat || Date.now() - connection.lastHeartbeat <= connection.options.staleMs) return
                connection.status = 'stale'
                this.emitStatus(url, connection)
                socket.close(4000, 'heartbeat timeout')
            }, Math.max(5_000, Math.floor(connection.options.staleMs / 3)))
            connection.subscribers.forEach((item) => item.onSubscribe?.())
        }

        socket.onmessage = (event) => {
            if (!this.isCurrent(url, connection, generation)) return
            connection.received += 1
            let data: unknown = event.data
            try {
                data = JSON.parse(String(event.data))
            } catch {
                data = { type: 'log', message: String(event.data), ts: Date.now() }
            }
            const record = data as Record<string, unknown>
            if (record?.type === 'heartbeat' || record?.type === 'pong') {
                const now = Date.now()
                connection.lastHeartbeat = now
                connection.status = 'connected'
                this.emitStatus(url, connection, Math.max(0, now - Number(record.ts || now)))
                return
            }
            connection.lastHeartbeat = Date.now()
            connection.subscribers.forEach((item) => item.onMessage?.(data))
        }

        socket.onerror = () => {
            if (this.isCurrent(url, connection, generation)) socket.close()
        }
        socket.onclose = () => {
            if (!this.isCurrent(url, connection, generation)) return
            connection.socket = null
            this.clearConnectionIntervals(connection)
            this.scheduleReconnect(url, connection)
        }
    }

    private scheduleReconnect(url: string, connection: Connection) {
        if (connection.subscribers.size === 0) return
        if (!navigator.onLine) {
            connection.status = 'offline'
            this.emitStatus(url, connection)
            return
        }
        connection.attempts += 1
        if (connection.attempts > connection.options.maxAttempts) {
            connection.status = 'offline'
            this.emitStatus(url, connection)
            return
        }
        connection.status = 'reconnecting'
        this.emitStatus(url, connection)
        const exponential = Math.min(500 * 2 ** (connection.attempts - 1), connection.options.maxBackoffMs)
        const delay = exponential + Math.floor(Math.random() * Math.min(500, exponential / 2))
        connection.reconnectTimer = setTimeout(() => {
            connection.reconnectTimer = null
            this.connect(url, connection)
        }, delay)
    }

    private snapshot(url: string, connection: Connection, latencyMs?: number): StatusSnapshot {
        return {
            status: connection.status,
            attempts: connection.attempts,
            lastHeartbeat: connection.lastHeartbeat,
            latencyMs,
            dropped: connection.dropped,
            url,
        }
    }

    private emitStatus(url: string, connection: Connection, latencyMs?: number) {
        const snapshot = this.snapshot(url, connection, latencyMs)
        connection.subscribers.forEach((item) => item.onStatus?.(snapshot))
    }

    private isCurrent(url: string, connection: Connection, generation: number) {
        return this.connections.get(url) === connection && connection.generation === generation
    }

    private clearConnectionIntervals(connection: Connection) {
        if (connection.heartbeatTimer) clearInterval(connection.heartbeatTimer)
        if (connection.staleTimer) clearInterval(connection.staleTimer)
        connection.heartbeatTimer = null
        connection.staleTimer = null
    }

    private clearTimers(connection: Connection) {
        this.clearConnectionIntervals(connection)
        if (connection.reconnectTimer) clearTimeout(connection.reconnectTimer)
        connection.reconnectTimer = null
    }

    private dispose(url: string, connection: Connection) {
        connection.generation += 1
        this.clearTimers(connection)
        const socket = connection.socket
        connection.socket = null
        socket?.close(1000, 'no subscribers')
        this.connections.delete(url)
    }
}

export default new RealtimeManager()
