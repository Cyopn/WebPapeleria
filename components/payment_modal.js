'use client'
import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/context/toast_context'

export default function PaymentModal({ open, onClose, amount = 0, currency = 'MXN', onPay, context = {} }) {
    const [mounted, setMounted] = useState(Boolean(open))
    const [visible, setVisible] = useState(Boolean(open))
    const [method, setMethod] = useState('cash')
    const [loading, setLoading] = useState(false)
    const [card, setCard] = useState({ name: '', number: '', exp: '', cvc: '' })
    const ANIM_DURATION = 200
    const lockRef = useRef(false)
    const { showToast } = useToast()
    const { lastUpload, printType, paperSize, rangeValue, bothSides, quantity, priceData } = context || {}

    function lockBody() {
        if (typeof window === 'undefined') return
        if (lockRef.current) return
        window.__modalOpenCount = (window.__modalOpenCount || 0) + 1
        lockRef.current = true
        if (window.__modalOpenCount === 1) document.body.style.overflow = 'hidden'
    }

    function unlockBody() {
        if (typeof window === 'undefined') return
        if (!lockRef.current) return
        window.__modalOpenCount = Math.max(0, (window.__modalOpenCount || 1) - 1)
        lockRef.current = false
        if (window.__modalOpenCount === 0) document.body.style.overflow = ''
    }

    useEffect(() => {
        let tIn, tOut
        if (open) {
            setMounted(true)
            tIn = setTimeout(() => setVisible(true), 10)
            lockBody()
        } else if (mounted) {
            setVisible(false)
            tOut = setTimeout(() => {
                setMounted(false)
                unlockBody()
            }, ANIM_DURATION)
        }
        return () => {
            clearTimeout(tIn)
            clearTimeout(tOut)
            if (lockRef.current) unlockBody()
        }
    }, [open, mounted])

    if (!mounted) return null

    function handlePay() {
        if (loading) return
        setLoading(true)
        if (method === 'cash') {
            ; (async () => {
                try {
                    async function req(path, method = 'GET', body = null) {
                        const headers = { 'Content-Type': 'application/json' }
                        const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null
                        const token = user?.token
                        if (token) headers['Authorization'] = `Bearer ${token}`
                        const opts = { method, headers }
                        if (body) opts.body = JSON.stringify(body)
                        const res = await fetch(`/api${path}`, opts)
                        const text = await res.text()
                        let data
                        try { data = text ? JSON.parse(text) : null } catch (e) { data = text }
                        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${JSON.stringify(data)}`)
                        return data
                    }

                    const cartItems = (context && Array.isArray(context.cartItems)) ? context.cartItems : []

                    let details = []

                    if (cartItems.length > 0) {
                        for (const it of cartItems) {
                            const prodPayload = {
                                type: 'product',
                                description: it.name || it.title || 'Artículo',
                                price: Number(it.price || 0),
                                amount: Number(it.qty || 1),
                                observations: '',
                                status: 'pending'
                            }
                            const prodRes = await req('/products', 'POST', prodPayload)
                            const prodId = prodRes?.id_item ?? prodRes?.id_product ?? prodRes?.id ?? null
                            if (!prodId) throw new Error('No se obtuvo id de producto para ' + (it.name || it.id || 'item'))
                            details.push({ id_product: prodId, amount: Number(it.qty || 1), price: Number(it.price || 0) })
                        }
                    } else {
                        const filename = lastUpload?.filename || lastUpload?.filehash || null
                        const idFileValue = lastUpload?.id_file ?? lastUpload?.id ?? lastUpload?.fileId ?? null
                        const prodPayload = {
                            type: 'print',
                            description: filename || 'Impresión',
                            price: Number(priceData?.totalPrice || 0),
                            id_file: idFileValue,
                            filename: filename || lastUpload?.filehash || null,
                            amount: Number(quantity || 1),
                            type_print: printType || 'digital',
                            type_paper: 'bond',
                            paper_size: paperSize || 'carta',
                            range: rangeValue || (lastUpload?.range || 'all'),
                            both_sides: !!bothSides,
                            print_amount: Number(quantity || 1),
                            observations: '',
                            status: 'pending'
                        }
                        const prodRes = await req('/products', 'POST', prodPayload)
                        const prodId = prodRes?.id_item ?? prodRes?.id_product ?? prodRes?.id ?? null
                        if (!prodId) throw new Error('No se obtuvo id de producto')
                        details.push({ id_product: prodId, amount: Number(quantity || 1), price: Number(priceData?.pricePerSet || 0) })
                    }

                    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null
                    const userId = user?.user?.id_user ?? user?.user?.id ?? null
                    const trxPayload = {
                        type: 'compra',
                        date: new Date().toISOString(),
                        id_user: userId,
                        status: 'pending',
                        payament_method: 'cash',
                        details
                    }
                    const trxRes = await req('/transactions', 'POST', trxPayload)
                    const trxId = trxRes?.id_transaction ?? trxRes?.id ?? null

                    if (!trxId) throw new Error('No se obtuvo id de transacción')

                    try { const trxFull = await req(`/transactions/${trxId}`, 'GET'); console.log('[PaymentModal] fetched trx full', trxFull) } catch (e) { console.warn('[PaymentModal] could not fetch full transaction', String(e)) }
                    setLoading(false)
                    showToast('Pago en efectivo registrado correctamente', { type: 'success' })
                    onPay && onPay({ method: 'cash', amount, transactionId: trxId })
                    onClose && onClose()
                    setTimeout(() => { try { window.location.reload() } catch (e) { /* ignore */ } }, 3000)
                } catch (err) {
                    setLoading(false)
                    showToast(err?.message || 'Error procesando pago en efectivo', { type: 'error' })
                }
            })()
            return
        }

        if (method === 'paypal') {
            setTimeout(() => {
                setLoading(false)
                onPay && onPay({ method: 'paypal', amount })
                onClose && onClose()
            }, 800)
            return
        }

        if (method === 'card') {
            if (!card.name || !card.number || !card.exp || !card.cvc) {
                alert('Completa los datos de la tarjeta.')
                setLoading(false)
                return
            }
            setTimeout(() => {
                setLoading(false)
                onPay && onPay({ method: 'card', amount, card })
                onClose && onClose()
            }, 900)
            return
        }
    }

    return (
        <div
            onClick={onClose}
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-${ANIM_DURATION} ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div
                onClick={(e) => e.stopPropagation()}
                className={`bg-white rounded-xl w-full max-w-[60%] mx-6 pb-6 transform transition-all flex flex-col items-center duration-${ANIM_DURATION} ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}`}>
                <div className="w-full bg-[#A8D860AB] rounded-t-xl px-6">
                    <h3 className="text-xl font-semibold text-black py-2">Gestion de pago</h3>
                </div>
                <p className="mt-2 text-sm text-gray-600">Total: <span className="font-medium">{currency} {amount}</span></p>
                <div className="w-[80%] mt-4 text-black">
                    <div className="flex gap-2 flex justify-between py-2">
                        <button
                            onClick={() => setMethod('cash')}
                            className={`flex-1 py-2 rounded-md cursor-pointer ${method === 'cash' ? 'bg-gray-100 border border-gray-300' : 'bg-white border'} text-sm`}
                        >Pago en efectivo</button>
                        <button
                            onClick={() => setMethod('paypal')}
                            className={`flex-1 py-2 rounded-md cursor-pointer ${method === 'paypal' ? 'bg-gray-100 border border-gray-300' : 'bg-white border'} text-sm`}
                        >PayPal</button>
                        <button
                            onClick={() => setMethod('card')}
                            className={`flex-1 py-2 rounded-md cursor-pointer ${method === 'card' ? 'bg-gray-100 border border-gray-300' : 'bg-white border'} text-sm`}
                        >Tarjeta</button>
                    </div>
                    {method === 'cash' && (
                        <div className="text-sm text-gray-700">
                            <p>Entrega y pago en efectivo al recibir. Asegúrate de tener el monto exacto.</p>
                        </div>
                    )}
                    {method === 'paypal' && (
                        <div className="text-sm text-gray-700">
                            <p>Se te redirigirá a PayPal para completar el pago.</p>
                        </div>
                    )}
                    {method === 'card' && (
                        <div className="space-y-2">
                            <input
                                value={card.name}
                                onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                                placeholder="Nombre en la tarjeta"
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            />
                            <input
                                value={card.number}
                                onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))}
                                placeholder="Número de tarjeta"
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            />
                            <div className="flex gap-2">
                                <input
                                    value={card.exp}
                                    onChange={(e) => setCard((c) => ({ ...c, exp: e.target.value }))}
                                    placeholder="MM/AA"
                                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                                />
                                <input
                                    value={card.cvc}
                                    onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value }))}
                                    placeholder="CVC"
                                    className="w-24 px-3 py-2 border rounded-md text-sm"
                                />
                            </div>
                        </div>
                    )}
                    <div className="mt-4">
                        <button
                            onClick={handlePay}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#7AD0EC] to-[#006DEC] text-black py-3 rounded-xl cursor-pointer "
                        >{loading ? 'Procesando...' : 'Pagar'}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
