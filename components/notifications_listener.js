'use client'

import { useEffect } from 'react'
import { useToast } from '@/context/toast_context'

export default function NotificationsListener() {
    const { showToast } = useToast()

    useEffect(() => {
        if (typeof window === 'undefined') return
        let es = null
        let stopped = false
        let reconnectAttempts = 0

        function getUrl() {
            try {
                const raw = localStorage.getItem('user')
                const parsed = raw ? JSON.parse(raw) : null
                const token = parsed?.token || null
                const idUser = parsed?.user?.id_user ?? parsed?.id_user ?? parsed?.user?.id ?? parsed?.id ?? null
                if (!token || !idUser || Number(idUser) === 1) return null
                try {
                    document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
                } catch (e) {
                    
                }

                return `${window.location.origin}/api/notifications/stream/${encodeURIComponent(String(idUser))}`
            } catch (err) {
                return null
            }
        }

        function connect() {
            const url = getUrl()
            if (!url || stopped) return
            try {
                es = new EventSource(url)
            } catch (err) {
                console.error('SSE creation failed', err)
                scheduleReconnect()
                return
            }

            es.addEventListener('init', (e) => {
                try {
                    const initialNotifications = JSON.parse(e.data)
                    console.log('notifications init', initialNotifications)
                } catch (err) {
                    console.warn('notifications init parse error', err)
                }
            })

            es.addEventListener('connected', (e) => {
                try {
                    console.log('notifications connected', JSON.parse(e.data))
                    reconnectAttempts = 0
                } catch (err) {
                    console.warn('notifications connected parse error', err)
                }
            })

            es.addEventListener('notification', (e) => {
                try {
                    const notif = JSON.parse(e.data)
                    const message = notif?.message || JSON.stringify(notif)
                    const duration = (notif?.duration && Number(notif.duration)) || 3300
                    showToast(message, { type: 'info', duration })
                    console.log('nueva notificación', notif)
                } catch (err) {
                    console.warn('notification parse error', err)
                }
            })

            es.onerror = (err) => {
                try {
                    const state = es && typeof es.readyState !== 'undefined' ? es.readyState : 'unknown'
                    console.error('SSE error', { err, readyState: state })
                } catch (e) {
                    console.error('SSE error unknown', e)
                }
                showToast('Error de conexión de notificaciones. Reintentando...', { type: 'error', duration: 4000 })
                try { es.close() } catch (e) { }
                scheduleReconnect()
            }
        }

        function scheduleReconnect() {
            if (stopped) return
            reconnectAttempts = Math.min(reconnectAttempts + 1, 6)
            const backoff = Math.min(30000, 500 * Math.pow(2, reconnectAttempts))
            setTimeout(() => {
                if (stopped) return
                connect()
            }, backoff)
        }

        connect()

        return () => {
            stopped = true
            try { if (es) es.close() } catch (e) { }
        }
    }, [showToast])

    return null
}
