'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ConnectionStatus } from '@/types'

interface UseWebSocketOptions<T> {
  url: string
  enabled?: boolean
  onMessage: (data: T) => void
}

export function useWebSocket<T>({
  url,
  enabled = true,
  onMessage,
}: UseWebSocketOptions<T>) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const socketRef = useRef<WebSocket | null>(null)
  const queueRef = useRef<string[]>([])
  const heartbeatRef = useRef<number | null>(null)
  const reconnectRef = useRef<number | null>(null)
  const closedByUserRef = useRef(false)
  const reconnectAttemptRef = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const connect = () => {
      setStatus('connecting')
      const socket = new WebSocket(url)
      socketRef.current = socket

      socket.onopen = () => {
        setStatus('connected')
        reconnectAttemptRef.current = 0
        setReconnectAttempts(0)
        queueRef.current.forEach((message) => socket.send(message))
        queueRef.current = []

        if (heartbeatRef.current) window.clearInterval(heartbeatRef.current)
        heartbeatRef.current = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping', at: Date.now() }))
          }
        }, 20_000)
      }

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data)
        if (payload?.type === 'pong') return
        onMessage(payload)
      }

      socket.onerror = () => {
        setStatus('error')
      }

      socket.onclose = () => {
        setStatus('disconnected')
        if (heartbeatRef.current) window.clearInterval(heartbeatRef.current)
        if (closedByUserRef.current) return

        reconnectAttemptRef.current += 1
        setReconnectAttempts(reconnectAttemptRef.current)
        const delay = Math.min(
          1000 * 2 ** Math.max(reconnectAttemptRef.current - 1, 0),
          30_000,
        )
        reconnectRef.current = window.setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      closedByUserRef.current = true
      if (heartbeatRef.current) window.clearInterval(heartbeatRef.current)
      if (reconnectRef.current) window.clearTimeout(reconnectRef.current)
      socketRef.current?.close()
    }
  }, [enabled, onMessage, url])

  const send = useCallback((value: unknown) => {
    const message = JSON.stringify(value)
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(message)
      return
    }
    queueRef.current.push(message)
  }, [])

  const close = useCallback(() => {
    closedByUserRef.current = true
    socketRef.current?.close()
  }, [])

  return {
    send,
    close,
    status,
    reconnectAttempts,
  }
}
