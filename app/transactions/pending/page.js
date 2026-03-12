'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/context/toast_context'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

function toMoney(value) {
    const amount = Number(value || 0)
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0)
}

function toDate(value) {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date)
}

function normalizeList(payload) {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.transactions)) return payload.transactions
    return []
}

export default function PendingTransactionsPage() {
    const router = useRouter()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [transactions, setTransactions] = useState([])
    const [statusFilter, setStatusFilter] = useState('pending')
    const [paymentFilter, setPaymentFilter] = useState('')
    const [dateFrom, setDateFrom] = useState(null)
    const [dateTo, setDateTo] = useState(null)
    const [q, setQ] = useState('')

    const STATUS_LABELS = {
        pending: 'Pendiente',
        completed: 'Completado',
    }

    const PAYMENT_LABELS = {
        cash: 'Efectivo',
        paypal: 'Paypal',
    }

    const PRODUCT_TYPE_LABELS = {
        print: 'Impresión',
        item: 'Artículo',
    }

    const SPECIAL_SERVICE_LABELS = {
        enc_imp: 'Encuadernado',
        doc_esp: 'Documento especial',
        ani_imp: 'Anillado',
        photo: 'Fotografía',
    }

    function translateStatus(s) {
        if (!s) return 'sin estado'
        const k = String(s).toLowerCase()
        return STATUS_LABELS[k] || s
    }

    function translatePayment(m) {
        if (!m) return 'sin metodo'
        const k = String(m).toLowerCase()
        return PAYMENT_LABELS[k] || m
    }

    function translateProductType(t) {
        if (!t) return 'sin tipo'
        const k = String(t).toLowerCase()
        return PRODUCT_TYPE_LABELS[k] || t
    }

    function translateSpecialService(t) {
        if (!t) return '-'
        const k = String(t).toLowerCase()
        return SPECIAL_SERVICE_LABELS[k] || t
    }

    useEffect(() => {
        let active = true

        async function loadTransactions() {
            try {
                setLoading(true)
                setError('')

                if (typeof window === 'undefined') return
                const raw = localStorage.getItem('user')
                if (!raw) {
                    setError('No hay sesion activa')
                    return
                }

                const parsed = JSON.parse(raw)
                const userObj = parsed?.user || parsed || {}
                const idUser = parsed?.user?.id_user ?? parsed?.user?.id ?? parsed?.id_user ?? parsed?.id ?? userObj?.id_user ?? userObj?.id
                const token = parsed?.token || null

                if (!idUser) {
                    setError('No se encontro el id del usuario')
                    return
                }

                const response = await fetch(`/api/transactions/user/${encodeURIComponent(idUser)}/details`, {
                    method: 'GET',
                    headers: {
                        'Accept': '*/*',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    },
                    cache: 'no-store',
                })

                const data = await response.json().catch(() => null)
                if (!response.ok) {
                    throw new Error(data?.error || data?.message || 'No se pudo obtener el historial de pedidos')
                }

                const list = normalizeList(data)
                if (!active) return
                setTransactions(list)
            } catch (err) {
                const message = err?.message || 'Error al obtener historial de pedidos'
                if (!active) return
                setError(message)
                try { showToast(message, { type: 'error' }) } catch (e) { }
            } finally {
                if (!active) return
                setLoading(false)
            }
        }

        loadTransactions()
        return () => {
            active = false
        }
    }, [showToast])

    const filteredTransactions = useMemo(() => {
        const s = String(statusFilter || '').toLowerCase()
        const p = String(paymentFilter || '').toLowerCase()
        const ql = String(q || '').toLowerCase().trim()

        return transactions.filter((t) => {
            if (s && String(t?.status || '').toLowerCase() !== s) return false
            if (p && String(t?.payment_method || '').toLowerCase() !== p) return false

            if (dateFrom) {
                const txDate = new Date(t?.date || t?.createdAt)
                const from = new Date(dateFrom)
                if (Number.isNaN(txDate.getTime()) || txDate < from) return false
            }
            if (dateTo) {
                const txDate = new Date(t?.date || t?.createdAt)
                const to = new Date(dateTo)
                to.setHours(23, 59, 59, 999)
                if (Number.isNaN(txDate.getTime()) || txDate > to) return false
            }

            if (ql) {
                const idMatch = String(t?.id_transaction || '').toLowerCase().includes(ql)
                const productMatch = (t?.details || []).some((d) => {
                    const name = String(d?.product?.item?.name || d?.product?.description || '')
                    return name.toLowerCase().includes(ql)
                })
                if (!idMatch && !productMatch) return false
            }

            return true
        })
    }, [transactions, statusFilter, paymentFilter, dateFrom, dateTo, q])

    const summary = useMemo(() => {
        const totalPedidos = filteredTransactions.length
        const pendientes = filteredTransactions.filter((t) => String(t?.status || '').toLowerCase() === 'pending').length
        const completados = filteredTransactions.filter((t) => String(t?.status || '').toLowerCase() === 'completed').length
        const totalGastado = filteredTransactions.reduce((acc, t) => acc + Number(t?.total || 0), 0)
        return { totalPedidos, pendientes, completados, totalGastado }
    }, [filteredTransactions])

    return (
        <section className='relative top-[104px] min-h-[calc(100vh-104px)] w-full bg-gradient-to-br from-[#F2F8FF] via-[#FFFFFF] to-[#EEF4FF] p-5 md:p-8 text-black'>
            <div className='mx-auto w-full max-w-6xl'>
                <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
                    <div>
                        <h1 className='text-2xl md:text-3xl font-semibold'>Pedidos pendientes</h1>
                        <p className='text-sm text-gray-600'>Lista de pedidos con estado pendiente.</p>
                    </div>
                </div>

                <div className='mb-4 flex flex-wrap items-center gap-3'>
                    <input
                        type='search'
                        placeholder='Buscar por id o producto'
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className='w-full max-w-md border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 border-gray-600 placeholder-gray-400 text-black'
                    />

                    <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className='rounded-lg border px-3 py-3 text-sm border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500 cursor-pointer'>
                        <option value=''>Todos los métodos</option>
                        <option value='cash'>Efectivo</option>
                        <option value='paypal'>Paypal</option>
                    </select>

                    <div className='flex items-center gap-2'>
                        <DatePicker
                            selected={dateFrom}
                            onChange={(d) => setDateFrom(d)}
                            dateFormat='yyyy-MM-dd'
                            placeholderText='Desde'
                            className='rounded-lg border px-2 py-3 text-sm border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500'
                        />
                        <DatePicker
                            selected={dateTo}
                            onChange={(d) => setDateTo(d)}
                            dateFormat='yyyy-MM-dd'
                            placeholderText='Hasta'
                            className='rounded-lg border px-2 py-3 text-sm border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500'
                        />
                    </div>
                    <button type='button' onClick={() => { setStatusFilter('pending'); setPaymentFilter(''); setDateFrom(null); setDateTo(null); setQ(''); }} className='rounded-full border px-3 py-2 text-sm cursor-pointer'>Limpiar</button>
                </div>

                <div className='mb-6 flex justify-evenly items-center gap-2'>
                    <div className='rounded-2xl border border-[#D8E8FF] bg-white p-4 shadow-sm w-[49%]'>
                        <p className='text-xs text-gray-500'>Total de pedidos</p>
                        <p className='text-2xl font-semibold'>{summary.totalPedidos}</p>
                    </div>
                    <div className='rounded-2xl border border-[#D8E8FF] bg-white p-4 shadow-sm w-[49%]'>
                        <p className='text-xs text-gray-500'>Total acumulado</p>
                        <p className='text-2xl font-semibold'>{toMoney(summary.totalGastado)}</p>
                    </div>
                </div>

                {loading && (
                    <div className='rounded-2xl border border-[#D8E8FF] bg-white p-8 text-center text-gray-600'>
                        Cargando historial...
                    </div>
                )}

                {!loading && error && (
                    <div className='rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700'>
                        {error}
                    </div>
                )}

                {!loading && !error && transactions.length === 0 && (
                    <div className='rounded-2xl border border-[#D8E8FF] bg-white p-8 text-center text-gray-600'>
                        Aun no tienes pedidos registrados.
                    </div>
                )}

                {!loading && !error && filteredTransactions.length > 0 && (
                    <div className='space-y-4'>
                        {filteredTransactions.map((transaction) => {
                            const status = String(transaction?.status || '').toLowerCase()
                            const isCompleted = status === 'completed'

                            return (
                                <article
                                    key={transaction?.id_transaction}
                                    className='rounded-2xl border border-[#D8E8FF] bg-white p-4 md:p-5 shadow-sm'
                                >
                                    <div className='mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3'>
                                        <div>
                                            <p className='text-xs text-gray-500'>Pedido</p>
                                            <p className='text-lg font-semibold'>#{transaction?.id_transaction}</p>
                                        </div>
                                        <div className='flex flex-wrap items-center gap-2 text-sm'>
                                            <span className={`rounded-full px-3 py-1 font-medium ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {translateStatus(status)}
                                            </span>
                                            <span className='rounded-full bg-blue-100 px-3 py-1 text-blue-700'>
                                                {translatePayment(transaction?.payment_method)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className='mb-4 grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-3'>
                                        <p><span className='font-medium'>Fecha:</span> {toDate(transaction?.date || transaction?.createdAt)}</p>
                                        <p><span className='font-medium'>Tipo:</span> {transaction?.type || '-'}</p>
                                        <p><span className='font-medium'>Total:</span> {toMoney(transaction?.total)}</p>
                                    </div>

                                    <div className='rounded-xl border border-gray-100 bg-[#FAFCFF] p-3'>
                                        <h2 className='mb-2 text-sm font-semibold text-gray-700'>Detalle de productos</h2>
                                        <div className='space-y-2'>
                                            {(transaction?.details || []).map((detail) => {
                                                const product = detail?.product || {}
                                                const productName =
                                                    product?.item?.name ||
                                                    product?.description ||
                                                    `Artículo #${detail?.id_product || '-'}`

                                                return (
                                                    <div key={detail?.id_detail_transaction} className='rounded-lg border border-gray-100 bg-white p-3'>
                                                        <div className='flex flex-wrap items-center justify-between gap-2'>
                                                            <p className='font-medium text-gray-800'>{productName}</p>
                                                            <p className='text-sm text-gray-700'>
                                                                {detail?.amount || 0} x {toMoney(detail?.price)}
                                                            </p>
                                                        </div>
                                                        <div className='mt-1 flex flex-wrap gap-2 text-xs'>
                                                            <span className='rounded-full bg-slate-100 px-2 py-1 text-slate-700'>
                                                                {translateProductType(product?.type)}
                                                            </span>
                                                            {product?.special_service && (
                                                                <span className='rounded-full bg-fuchsia-100 px-2 py-1 text-fuchsia-700'>
                                                                    {translateSpecialService(product?.special_service?.type)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {transaction?.qr_code?.qr_info && (
                                        <p className='mt-3 text-xs text-gray-500'>{transaction.qr_code.qr_info}</p>
                                    )}
                                </article>
                            )
                        })}
                    </div>
                )}
            </div>
        </section>
    )
}
