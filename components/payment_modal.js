'use client'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/context/toast_context'
import { getItems, subscribe, clear } from '@/lib/cart_store'

export default function PaymentModal({ open, onClose, amount = 0, currency = 'MXN', onPay, context = {} }) {
    const [mounted, setMounted] = useState(Boolean(open))
    const [visible, setVisible] = useState(Boolean(open))
    const [method, setMethod] = useState('cash')
    const [loading, setLoading] = useState(false)
    const [qrCode, setQrCode] = useState(null)
    const [qrInfo, setQrInfo] = useState(null)
    const [currentCartItems, setCurrentCartItems] = useState(() => getItems())
    const ANIM_DURATION = 200
    const lockRef = useRef(false)
    const { showToast } = useToast()
    const { lastUpload, uploads, printType, paperSize, rangeValue, bothSides, quantity, priceData, cartItems, total, item, deliveryDate, pastaType, boundType, coverColor, observations, photoPaper, docType, bindingType, ringType } = context || {}
    const effectiveCartItems = currentCartItems.length > 0 ? currentCartItems : (item ? [item] : [])
    const displayAmount = effectiveCartItems.length > 0 ? effectiveCartItems.reduce((s, it) => s + (Number(it.price) || 0) * (it.qty || 1), 0) : (context.total || amount)

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
        const unsub = subscribe(() => {
            setCurrentCartItems(getItems())
        })
        return unsub
    }, [])

    useEffect(() => {
        let tIn, tOut
        if (open) {
            setMounted(true)
            tIn = setTimeout(() => setVisible(true), 10)
            setQrCode(null)
            setQrInfo(null)
            setLoading(false)
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

    function handleClose() {
        onClose && onClose()
        if (qrCode) {
            setTimeout(() => { try { window.location.reload() } catch (e) { /* ignore */ } }, 300)
        }
    }

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
                    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null
                    console.log('[PaymentModal] usuario desde localStorage', user)
                    const userId = user?.user?.id_user ?? user?.user?.id ?? user?.id ?? null
                    const cartItems = effectiveCartItems
                    let details = []
                    const filesToUse = Array.isArray(uploads) && uploads.length > 0 ? uploads : (lastUpload ? [lastUpload] : [])
                    const priceItems = Array.isArray(priceData?.items) ? priceData.items : null
                    const getItemData = (idx) => priceItems?.[idx]?.data || null
                    const getBreakdownPerSet = (idx) => getItemData(idx)?.breakdownPerSet || priceData?.breakdownPerSet || {}
                    const getPerFileTotal = (idx) => {
                        const data = getItemData(idx)
                        if (typeof data?.totalPrice === 'number') return Number(data.totalPrice)
                        if (typeof data?.pricePerSet === 'number') return Number(data.pricePerSet)
                        const totalValue = Number(priceData?.totalPrice || amount || 0)
                        return filesToUse.length ? totalValue / filesToUse.length : totalValue
                    }

                    if (photoPaper) {
                        for (let i = 0; i < filesToUse.length; i += 1) {
                            const file = filesToUse[i]
                            const fileName = file?.filename || file?.filehash || null
                            const fileId = file?.id_file ?? file?.id ?? file?.fileId ?? null
                            const perFileTotal = getPerFileTotal(i)

                            const printProdPayload = {
                                type: 'print',
                                description: fileName || 'special_service_photo_print',
                                price: 0,
                                id_file: fileId,
                                filename: fileName || file?.filehash || null,
                                amount: Number(quantity || 1),
                                type_print: printType,
                                type_paper: 'bond',
                                paper_size: "carta",
                                range: 'all',
                                both_sides: false,
                                print_amount: Number(quantity || 1),
                                observations: '',
                                status: 'pending',
                                id_user: userId
                            }
                            const printProdRes = await req('/products', 'POST', printProdPayload)
                            const printProdId = printProdRes?.id_item ?? printProdRes?.id_product ?? printProdRes?.id ?? null
                            if (!printProdId) throw new Error('No se obtuvo id de producto para impresión de fotos')
                            const specialProdPayload = {
                                type: 'special_service',
                                description: 'special__service_photo',
                                price: Number(perFileTotal || 0),
                                id_file: fileId,
                                amount: Number(quantity || 1),
                                service_type: 'photo',
                                mode: 'online',
                                delivery: deliveryDate,
                                observations: observations || '',
                                photo_size: paperSize,
                                paper_type: photoPaper === 'pb' ? 'bright' : photoPaper === 'pm' ? 'matte' : 'satin',
                                id_print: printProdId,
                                status: 'pending',
                                id_user: userId
                            }
                            const specialProdRes = await req('/products', 'POST', specialProdPayload)
                            const specialProdId = specialProdRes?.id_item ?? specialProdRes?.id_product ?? specialProdRes?.id ?? null
                            if (!specialProdId) throw new Error('No se obtuvo id de producto para servicio especial de fotos')
                            details.push({ id_product: specialProdId, amount: Number(quantity || 1), price: Number(perFileTotal || 0) })
                        }
                    } else if (filesToUse.length && printType && paperSize && !boundType && !docType && !ringType) {
                        for (let i = 0; i < filesToUse.length; i += 1) {
                            const file = filesToUse[i]
                            const fileName = file?.filename || file?.filehash || null
                            const fileId = file?.id_file ?? file?.id ?? file?.fileId ?? null
                            const perFileTotal = getPerFileTotal(i)
                            const printProdPayload = {
                                type: 'print',
                                description: 'Impresión de documentos',
                                price: Number(perFileTotal || 0),
                                id_file: fileId,
                                amount: Number(quantity || 1),
                                type_print: printType === 'color' ? 'color' : 'bw',
                                type_paper: 'bond',
                                paper_size: paperSize || 'carta',
                                range: rangeValue || (file?.range || 'all'),
                                both_sides: !!bothSides,
                                print_amount: Number(quantity || 1),
                                observations: observations || '',
                                status: 'pending',
                                id_user: userId
                            }
                            const printProdRes = await req('/products', 'POST', printProdPayload)
                            const printProdId = printProdRes?.id_item ?? printProdRes?.id_product ?? printProdRes?.id ?? null
                            if (!printProdId) throw new Error('No se obtuvo id de producto para impresión')
                            details.push({ id_product: printProdId, amount: Number(quantity || 1), price: Number(perFileTotal || 0) })
                        }
                    } else if (boundType) {
                        for (let i = 0; i < filesToUse.length; i += 1) {
                            const file = filesToUse[i]
                            const fileName = file?.filename || file?.filehash || null
                            const fileId = file?.id_file ?? file?.id ?? file?.fileId ?? null
                            const perSet = getBreakdownPerSet(i)
                            const perFileTotal = getPerFileTotal(i)
                            const printProdPayload = {
                                type: 'print',
                                description: fileName || 'special_service_bounding_print',
                                price: Number(perSet?.inkCost || 0) + Number(perSet?.paperCost || 0),
                                id_file: fileId,
                                filename: fileName || file?.filehash || null,
                                amount: Number(quantity || 1),
                                type_print: printType || 'digital',
                                type_paper: 'bond',
                                paper_size: paperSize || 'carta',
                                range: rangeValue || (file?.range || 'all'),
                                both_sides: !!bothSides,
                                print_amount: Number(quantity || 1),
                                observations: '',
                                status: 'pending',
                                id_user: userId
                            }
                            const printProdRes = await req('/products', 'POST', printProdPayload)
                            const printProdId = printProdRes?.id_item ?? printProdRes?.id_product ?? printProdRes?.id ?? null
                            if (!printProdId) throw new Error('No se obtuvo id de producto para impresión')
                            const colorMap = { ro: 'red', ve: 'green', az: 'blue', am: 'yellow' }
                            const specialProdPayload = {
                                type: 'special_service',
                                description: 'special_service_bounding',
                                price: Number(perSet?.bindingCost || 0) + Number(perSet?.coverCost || 0),
                                amount: Number(quantity || 1),
                                service_type: 'enc_imp',
                                mode: 'online',
                                delivery: new Date(deliveryDate).getTime(),
                                observations: observations || '',
                                cover_type: pastaType === 'p_dura' ? 'hard' : 'soft',
                                cover_color: colorMap[coverColor] || 'red',
                                spiral_type: boundType === 'ep' ? 'plastic' : 'wire',
                                id_print: printProdId,
                                status: 'pending',
                                id_file: fileId,
                                id_user: userId
                            }
                            const specialProdRes = await req('/products', 'POST', specialProdPayload)
                            const specialProdId = specialProdRes?.id_item ?? specialProdRes?.id_product ?? specialProdRes?.id ?? null
                            if (!specialProdId) throw new Error('No se obtuvo id de producto para servicio especial')
                            details.push({ id_product: specialProdId, amount: Number(quantity || 1), price: Number(perFileTotal || 0) })
                        }
                    } else if (docType) {
                        const mapDoc = {
                            te: 'tesis',
                            ex: 'examen',
                            re: 'reporte',
                            ot: 'otro'
                        }
                        for (let i = 0; i < filesToUse.length; i += 1) {
                            const file = filesToUse[i]
                            const fileName = file?.filename || file?.filehash || null
                            const fileId = file?.id_file ?? file?.id ?? file?.fileId ?? null
                            const perFileTotal = getPerFileTotal(i)
                            const printProdPayload = {
                                type: 'print',
                                description: fileName || 'special_service_docs_print',
                                price: 0,
                                id_file: fileId,
                                filename: fileName || file?.filehash || null,
                                amount: Number(quantity || 1),
                                type_print: printType || 'digital',
                                type_paper: 'bond',
                                paper_size: paperSize || 'carta',
                                range: rangeValue || (file?.range || 'all'),
                                both_sides: !!bothSides,
                                print_amount: Number(quantity || 1),
                                observations: '',
                                status: 'pending',
                                id_user: userId
                            }
                            const printProdRes = await req('/products', 'POST', printProdPayload)
                            const printProdId = printProdRes?.id_item ?? printProdRes?.id_product ?? printProdRes?.id ?? null
                            if (!printProdId) throw new Error('No se obtuvo id de producto para impresión de documentos')
                            const specialProdPayload = {
                                type: 'special_service',
                                description: 'special_service_docs',
                                price: Number(perFileTotal || 0),
                                service_type: 'doc_esp',
                                mode: 'online',
                                delivery: deliveryDate,
                                id_file: fileId,
                                observations: observations || '',
                                document_type: mapDoc[docType] || 'otro',
                                binding_type: bindingType,
                                id_print: printProdId,
                                status: 'pending',
                                id_user: userId
                            }
                            const specialProdRes = await req('/products', 'POST', specialProdPayload)
                            const specialProdId = specialProdRes?.id_item ?? specialProdRes?.id_product ?? specialProdRes?.id ?? null
                            if (!specialProdId) throw new Error('No se obtuvo id de producto para servicio especial de documentos')
                            details.push({ id_product: specialProdId, amount: Number(quantity || 1), price: Number(perFileTotal || 0) })
                        }
                    } else if (ringType) {
                        for (let i = 0; i < filesToUse.length; i += 1) {
                            const file = filesToUse[i]
                            const fileName = file?.filename || file?.filehash || null
                            const fileId = file?.id_file ?? file?.id ?? file?.fileId ?? null
                            const perSet = getBreakdownPerSet(i)
                            const perFileTotal = getPerFileTotal(i)
                            const printProdPayload = {
                                type: 'print',
                                description: fileName || 'special_service_spiral_print',
                                price: Number(perSet?.inkCost || 0) + Number(perSet?.paperCost || 0),
                                id_file: fileId,
                                filename: fileName || file?.filehash || null,
                                amount: Number(quantity || 1),
                                type_print: printType || 'digital',
                                type_paper: 'bond',
                                paper_size: paperSize || 'carta',
                                range: rangeValue || (file?.range || 'all'),
                                both_sides: !!bothSides,
                                print_amount: Number(quantity || 1),
                                observations: '',
                                status: 'pending',
                                id_user: userId
                            }
                            const printProdRes = await req('/products', 'POST', printProdPayload)
                            const printProdId = printProdRes?.id_item ?? printProdRes?.id_product ?? printProdRes?.id ?? null
                            if (!printProdId) throw new Error('No se obtuvo id de producto para impresión de anillado')
                            const specialProdPayload = {
                                type: 'special_service',
                                description: 'Anillado de documentos',
                                price: Number(perSet?.ringCost || 0),
                                service_type: 'ani_imp',
                                mode: 'online',
                                delivery: deliveryDate,
                                observations: observations || '',
                                spiral_type: ringType === 'ep' ? 'stapled' : 'glued',
                                id_print: printProdId,
                                status: 'pending',
                                id_file: fileId,
                                id_user: userId
                            }
                            const specialProdRes = await req('/products', 'POST', specialProdPayload)
                            const specialProdId = specialProdRes?.id_item ?? specialProdRes?.id_product ?? specialProdRes?.id ?? null
                            if (!specialProdId) throw new Error('No se obtuvo id de producto para servicio especial de anillado')
                            details.push({ id_product: specialProdId, amount: Number(quantity || 1), price: Number(perFileTotal || 0) })
                        }
                    } else if (cartItems.length > 0) {
                        for (const it of cartItems) {
                            details.push({ id_product: it.id, amount: Number(it.qty || 1), price: Number(it.price || 0) })
                        }
                    } else {
                        throw new Error('No hay items para procesar el pago')
                    }
                    console.log('[PaymentModal] id de usuario', userId, 'detalles', details)
                    const trxPayload = {
                        type: 'compra',
                        date: new Date().toISOString(),
                        id_user: userId,
                        status: 'pending',
                        payment_method: 'cash',
                        details
                    }
                    const trxRes = await req('/transactions', 'POST', trxPayload)
                    const trxId = trxRes?.id_transaction ?? trxRes?.id ?? null

                    if (!trxId) throw new Error('No se obtuvo id de transacción')

                    try { const trxFull = await req(`/transactions/${trxId}`, 'GET'); console.log('[PaymentModal] transacción completa obtenida', trxFull) } catch (e) { console.warn('[PaymentModal] no se pudo obtener la transacción completa', String(e)) }
                    setLoading(false)
                    showToast('Pago en efectivo registrado correctamente', { type: 'success' })
                    if (trxRes?.qr_code) {
                        setQrCode(trxRes.qr_code)
                        setQrInfo(trxRes.qr_info || null)
                    } else {
                        onPay && onPay({ method: 'cash', amount, transactionId: trxId })
                        onClose && onClose()
                        setTimeout(() => { try { window.location.reload() } catch (e) { /* ignore */ } }, 300)
                    }
                    if (currentCartItems.length > 0) {
                        clear()
                    }
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

    }

    return (
        <div
            onClick={handleClose}
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-${ANIM_DURATION} ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div
                onClick={(e) => e.stopPropagation()}
                className={`bg-white rounded-xl w-full max-w-[60%] mx-6 pb-6 transform transition-all flex flex-col items-center duration-${ANIM_DURATION} ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}`}>
                <div className='w-full bg-[#A8D860AB] rounded-t-xl px-6'>
                    <h3 className='text-xl font-semibold text-black py-2'>Gestion de pago</h3>
                </div>
                <p className='mt-2 text-lg text-gray-600'>Total: <span className='font-medium'>$ {displayAmount} {currency}</span></p>
                <div className='w-[80%] mt-4 text-black'>
                    <div className='flex gap-2 flex justify-between py-2 text-md'>
                        <button
                            onClick={() => setMethod('cash')}
                            className={`flex-1 py-2 rounded-md cursor-pointer ${method === 'cash' ? 'bg-gray-100 border border-gray-300' : 'bg-white border'} text-sm`}
                        >Pago en efectivo</button>
                        <button
                            onClick={() => setMethod('paypal')}
                            className={`flex-1 py-2 rounded-md cursor-pointer ${method === 'paypal' ? 'bg-gray-100 border border-gray-300' : 'bg-white border'} text-sm`}
                        >PayPal</button>
                    </div>
                    {qrCode && (
                        <div className='mt-3 flex flex-col items-center gap-3 text-sm text-gray-700'>
                            <div className='text-center font-medium'>Guarda el código QR para recoger tu pedido.</div>
                            <Image src={qrCode} alt='Código QR de pago' width={208} height={208} className='w-52 h-52 object-contain border rounded-lg bg-white' />
                            <a
                                href={qrCode}
                                download={`qr-${(qrInfo && typeof qrInfo === 'object' && qrInfo.id_transaction) ? qrInfo.id_transaction : 'pago'}.png`}
                                className='text-sm px-4 py-2 rounded-full bg-[#E6F1FF] text-blue-700 hover:bg-[#D6E8FF]'
                            >Descargar QR</a>
                            {qrInfo && typeof qrInfo === 'string' && (
                                <div className='text-xs text-gray-600 text-center'>{qrInfo.replace("- PENDING", "")}</div>
                            )}
                        </div>
                    )}
                    {method === 'cash' && (
                        <div className='text-sm text-gray-700'>
                            <p>Las impresiones se procesarán una vez que se confirme el pago.</p>
                            <p>Los pedidos se prepararán una vez que se confirme el pago.</p>
                        </div>
                    )}
                    {method === 'paypal' && (
                        <div className='text-sm text-gray-700'>
                            <p>Se te redirigirá a PayPal para completar el pago.</p>
                            <p>Las impresiones se procesarán una vez que se confirme el pago.</p>
                            <p>Los pedidos se prepararán una vez que se confirme el pago.</p>
                        </div>
                    )}
                    <div className='mt-4'>
                        {qrCode ? (
                            <button
                                onClick={handleClose}
                                className='w-full bg-gradient-to-r from-[#7AD0EC] to-[#006DEC] text-black py-3 rounded-xl cursor-pointer '
                            >Cerrar</button>
                        ) : (
                            <button
                                onClick={handlePay}
                                disabled={loading}
                                className='w-full bg-gradient-to-r from-[#7AD0EC] to-[#006DEC] text-black py-3 rounded-xl cursor-pointer '
                            >{loading ? 'Procesando...' : 'Pagar'}</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
