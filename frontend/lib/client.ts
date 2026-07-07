import axios, { AxiosRequestConfig } from 'axios'
import { API_BASE_URL } from './endpoints'

const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120_000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
})

client.interceptors.request.use((config) => {
    const method = (config.method || 'get').toUpperCase()
    const url = `${config.baseURL || ''}${config.url || ''}`
    console.info(`[api] ${method} ${url}`)
    return config
})

// Basic retry interceptor for GET requests with exponential backoff
client.interceptors.response.use((response) => {
    const method = (response.config.method || 'get').toUpperCase()
    const url = `${response.config.baseURL || ''}${response.config.url || ''}`
    console.info(`[api] ${method} ${url} -> ${response.status}`)
    return response
}, async (err) => {
    const cfg: AxiosRequestConfig & { __retryCount?: number } = err.config || {}
    cfg.__retryCount = cfg.__retryCount || 0
    const method = (cfg.method || 'get').toUpperCase()
    const url = `${cfg.baseURL || API_BASE_URL}${cfg.url || ''}`
    const status = err.response?.status
    const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message
    console.error(`[api] ${method} ${url} -> ${status || err.code || 'NETWORK_ERROR'}: ${detail}`)
    const maxRetries = 2
    // only retry idempotent GET requests
    if (cfg.method === 'get' && cfg.__retryCount < maxRetries) {
        cfg.__retryCount += 1
        const delay = 200 * Math.pow(2, cfg.__retryCount)
        await new Promise((r) => setTimeout(r, delay))
        return client(cfg)
    }
    return Promise.reject(err)
})

export default client

