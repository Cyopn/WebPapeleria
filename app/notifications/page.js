'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/context/toast_context'
import { useRouter } from 'next/navigation'

function toDate(value) {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function toMoney(value) {
    const amount = Number(value || 0)
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0)
}

function translateStatus(s) {
    if (!s) return '-'
    const k = String(s).toLowerCase()
    const MAP = {
        pending: 'Pendiente',
        in_progress: 'En progreso',
        completed: 'Completado',
    }
    return MAP[k] || s
}

export default function NotificationsPage() {
    const { showToast } = useToast()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [notifications, setNotifications] = useState([])
    const [error, setError] = useState('')
    const [selectedTx, setSelectedTx] = useState(null)
    const [txLoading, setTxLoading] = useState(false)

    useEffect(() => {
        let active = true
        async function load() {
            try {
                setLoading(true)
                setError('')
                if (typeof window === 'undefined') return
                const raw = localStorage.getItem('user')
                if (!raw) {
                    setError('No hay sesión activa')
                    return
                }
                const parsed = JSON.parse(raw)
                const idUser = parsed?.user?.id_user ?? parsed?.id_user ?? parsed?.user?.id ?? parsed?.id
                const token = parsed?.token || null
                if (!idUser) {
                    setError('No se encontró id de usuario')
                    return
                }

                const res = await fetch(`/api/notifications/user/${encodeURIComponent(idUser)}`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    cache: 'no-store',
                })
                const data = await res.json().catch(() => null)
                if (!res.ok) throw new Error(data?.error || 'No se pudieron obtener notificaciones')
                if (!active) return
                setNotifications(Array.isArray(data) ? data : (data?.data || []))
            } catch (err) {
                const msg = err?.message || 'Error al cargar notificaciones'
                setError(msg)
                try { showToast(msg, { type: 'error' }) } catch (e) { }
            } finally {
                if (!active) return
                setLoading(false)
            }
        }
        load()
        return () => { active = false }
    }, [showToast])

    async function openNotification(n) {
        try {
            const idTx = n?.metadata?.id_transaction || n?.metadata?.id_transaction || null
            const notifId = n?.id_notification || n?.id || null
            if (notifId) {
                try {
                    const raw = localStorage.getItem('user')
                    const parsed = raw ? JSON.parse(raw) : null
                    const token = parsed?.token || null
                    fetch(`/api/notifications/${encodeURIComponent(notifId)}/read`, {
                        method: 'PATCH',
                        headers: { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                        cache: 'no-store',
                    }).then((r) => {
                        if (r.ok) {
                            setNotifications((prev) => prev.map((x) => (x?.id_notification === notifId ? { ...x, is_read: true } : x)))
                        }
                    }).catch(() => { })
                } catch (e) {
                }
            }
            if (!idTx) {
                showToast('No hay transacción asociada', { type: 'info' })
                return
            }
            setTxLoading(true)
            const raw = localStorage.getItem('user')
            const parsed = raw ? JSON.parse(raw) : null
            const token = parsed?.token || null
            const res = await fetch(`/api/transactions/${encodeURIComponent(idTx)}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                cache: 'no-store',
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.error || 'No se pudo obtener la transacción')
            setSelectedTx(data)
        } catch (err) {
            showToast(err?.message || 'Error al obtener transacción', { type: 'error' })
        } finally {
            setTxLoading(false)
        }
    }

    return (
        <section className='relative top-[104px] min-h-[calc(100vh-104px)] w-full bg-gradient-to-br from-[#F2F8FF] via-[#FFFFFF] to-[#EEF4FF] p-5 md:p-8 text-black'>
            <div className='mx-auto w-full max-w-4xl'>
                <div className='mb-6'>
                    <h1 className='text-2xl md:text-3xl font-semibold'>Notificaciones</h1>
                    <p className='text-sm text-gray-600'>Lista de notificaciones recientes.</p>
                </div>

                {loading && <div className='rounded-2xl border border-[#D8E8FF] bg-white p-8 text-center text-gray-600'>Cargando notificaciones...</div>}
                {!loading && error && <div className='rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700'>{error}</div>}

                {!loading && !error && notifications.length === 0 && (
                    <div className='rounded-2xl border border-[#D8E8FF] bg-white p-8 text-center text-gray-600'>No tienes notificaciones.</div>
                )}

                {!loading && notifications.length > 0 && (
                    <div className='space-y-3'>
                        {notifications.map((n) => (
                            <article key={n?.id_notification} className='rounded-2xl border border-[#D8E8FF] bg-white p-4 shadow-sm cursor-pointer' onClick={() => openNotification(n)}>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <p className='text-sm text-gray-700'>{n?.message || '-'}</p>
                                        <p className='text-xs text-gray-500'>{toDate(n?.createdAt)}</p>
                                    </div>
                                    <div className='text-right'>
                                        <p className={`text-xs ${n?.is_read ? 'text-gray-400' : 'text-amber-600'}`}>{n?.is_read ? 'Leído' : 'Nuevo'}</p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {selectedTx && (
                    <div className='fixed inset-0 z-[70] flex items-center justify-center p-6'>
                        <div className='absolute inset-0 bg-black/40' onClick={() => setSelectedTx(null)}></div>
                        <div className='relative w-full max-w-3xl bg-white rounded-2xl p-6 z-10 overflow-auto max-h-[80vh]'>
                            <div className='flex justify-between items-start'>
                                <h2 className='text-xl font-semibold'>Transacción #{selectedTx?.id_transaction}</h2>
                                <button onClick={() => setSelectedTx(null)} className='text-gray-600 cursor-pointer'>Cerrar</button>
                            </div>
                            <div className='mt-4 text-sm text-gray-700'>
                                <p><strong>Estado:</strong> {translateStatus(selectedTx?.status)}</p>
                                <p><strong>Fecha:</strong> {toDate(selectedTx?.date || selectedTx?.createdAt)}</p>
                                <p><strong>Total:</strong> {toMoney(selectedTx?.total)}</p>
                                <div className='mt-4'>
                                    <h3 className='font-semibold'>Detalles</h3>
                                    <div className='space-y-2 mt-2'>
                                        {(selectedTx?.details || []).map((d) => {
                                            const product = d?.product || {}
                                            const name = product?.item?.name || product?.description || `Producto #${d?.id_product}`
                                            return (
                                                <div key={d?.id_detail_transaction} className='rounded-lg border border-gray-100 bg-white p-3'>
                                                    <div className='flex justify-between'>
                                                        <div className='font-medium'>{name}</div>
                                                        <div className='text-sm text-gray-700'>{d?.amount || 0} x {toMoney(d?.price)}</div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
