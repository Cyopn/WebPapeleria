'use client'
import Image from 'next/image'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Document, Page } from 'react-pdf'
import { useToast } from '@/context/toast_context'
import setupPdfWorker from '@/lib/setup_pdf_worker'
import PaymentModal from '@/components/payment_modal'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function SpiralPage() {
    const [rangeValue, setRangeValue] = useState('');
    const [br3Selected, setBr3Selected] = useState(true);
    const [printType, setPrintType] = useState('blanco_negro');
    const [lastUpload, setLastUpload] = useState(null)
    const [uploads, setUploads] = useState([])
    const [selectedUploadIndex, setSelectedUploadIndex] = useState(0)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewMounted, setPreviewMounted] = useState(false)
    const [previewVisible, setPreviewVisible] = useState(false)
    const [numPages, setNumPages] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const { showToast } = useToast()
    function showError(msg) { try { showToast(msg, { type: 'error' }) } catch (e) { console.error('[SpiralPage] showToast fallo', e) } }
    const previewLockRef = useRef(false)
    const ANIM_DURATION = 200
    const [quantity, setQuantity] = useState(1)
    const [paperSize, setPaperSize] = useState('carta')
    const [bothSides, setBothSides] = useState(false)
    const [ringType, setRingType] = useState('ep')
    const [priceData, setPriceData] = useState(null)
    const [priceLoading, setPriceLoading] = useState(false)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [paymentOpen, setPaymentOpen] = useState(false)

    function normalizePriceData(data) {
        if (!data) return null
        if (Array.isArray(data)) {
            const items = data.map((d) => ({ data: d }))
            let totalPrice = 0
            let pages = 0
            let sheets = 0
            let sets = 0
            const breakdownPerSet = {}
            const breakdownTotal = {}
            data.forEach((d) => {
                if (typeof d?.totalPrice === 'number') totalPrice += d.totalPrice
                if (typeof d?.pages === 'number') pages += d.pages
                if (typeof d?.sheets === 'number') sheets += d.sheets
                if (typeof d?.sets === 'number') sets += d.sets
                const perSet = d?.breakdownPerSet || {}
                const total = d?.breakdownTotal || {}
                Object.entries(perSet).forEach(([k, v]) => {
                    if (typeof v === 'number') breakdownPerSet[k] = (breakdownPerSet[k] || 0) + v
                })
                Object.entries(total).forEach(([k, v]) => {
                    if (typeof v === 'number') breakdownTotal[k] = (breakdownTotal[k] || 0) + v
                })
            })
            return {
                totalPrice,
                pages: pages || null,
                sheets: sheets || null,
                sets: sets || null,
                breakdownPerSet: Object.keys(breakdownPerSet).length ? breakdownPerSet : null,
                breakdownTotal: Object.keys(breakdownTotal).length ? breakdownTotal : null,
                items,
            }
        }
        return { ...data, items: data.items || [{ data }] }
    }
    const getNextBusinessDay = () => {
        const today = new Date();
        let nextDay = new Date(today);
        nextDay.setDate(today.getDate() + 1);
        while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
            nextDay.setDate(nextDay.getDate() + 1);
        }
        return nextDay.toISOString().split('T')[0];
    };
    const [deliveryDate, setDeliveryDate] = useState(getNextBusinessDay)
    const [observations, setObservations] = useState('')

    function lockBody() {
        if (typeof window === 'undefined') return
        if (previewLockRef.current) return
        window.__modalOpenCount = (window.__modalOpenCount || 0) + 1
        previewLockRef.current = true
        if (window.__modalOpenCount === 1) document.body.style.overflow = 'hidden'
    }

    function unlockBody() {
        if (typeof window === 'undefined') return
        if (!previewLockRef.current) return
        window.__modalOpenCount = Math.max(0, (window.__modalOpenCount || 1) - 1)
        previewLockRef.current = false
        if (window.__modalOpenCount === 0) document.body.style.overflow = ''
    }

    useEffect(() => {
        try {
            setupPdfWorker()
        } catch (e) {
            console.error('[SpiralPage] setupPdfWorker fallo', e)
        }
    }, [])

    useEffect(() => {
        let tIn, tOut
        if (previewOpen) {
            setPreviewMounted(true)
            tIn = setTimeout(() => setPreviewVisible(true), 10)
            lockBody()
        } else if (previewMounted) {
            setPreviewVisible(false)
            tOut = setTimeout(() => {
                setPreviewMounted(false)
                unlockBody()
            }, ANIM_DURATION)
        }

        return () => {
            clearTimeout(tIn)
            clearTimeout(tOut)
            if (previewLockRef.current) {
                unlockBody()
            }
        }
    }, [previewOpen, previewMounted])
    const calculatePrice = useCallback(async (uploadInfo, overrides = {}) => {
        if (!uploadInfo) return
        const list = Array.isArray(uploadInfo) ? uploadInfo : [uploadInfo]
        const filesPayload = list
            .map((u) => ({
                filename: u?.filehash || u?.storedName || u?.filename,
                service: u?.type || u?.service || 'file'
            }))
            .filter((u) => Boolean(u.filename))
        if (filesPayload.length === 0) return

        const pt = overrides.printType ?? printType
        const ps = overrides.paperSize ?? paperSize
        const br3 = overrides.br3Selected ?? br3Selected
        const rv = overrides.rangeValue ?? rangeValue
        const bs = typeof overrides.bothSides === 'boolean' ? overrides.bothSides : bothSides
        const qty = overrides.quantity ?? quantity
        const rtype = overrides.ringType ?? ringType

        const filenames = filesPayload.map((f) => f.filename)
        const payload = {
            filename: filenames.length > 1 ? filenames : filenames[0],
            service: filesPayload[0]?.service || 'file',
            colorModes: pt === 'color' ? 'color' : 'bw',
            paperSizes: ps || 'carta',
            ranges: br3 ? 'all' : (rv || 'all'),
            bothSides: !!bs,
            sets: Number(qty || 1),
            type: 'spiral',
            ringType: rtype === 'em' ? 'metal' : 'plastic',
        }

        try {
            setPriceLoading(true)
            let headers = { 'Content-Type': 'application/json' }
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}')
                if (user?.token) headers.Authorization = `Bearer ${user.token}`
            } catch (e) { console.error('[SpiralPage] fallo parseando usuario en localStorage', e) }

            const res = await fetch('/api/printing-price', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                const msg = data?.message || data?.error || `Error ${res.status}`
                showToast(msg, { type: 'error' })
                setPriceData(null)
            } else {
                setPriceData(normalizePriceData(data))
            }
        } catch (err) {
            console.error('[SpiralPage] Error al calcular precio', err)
            showToast(err?.message || 'Error calculando precio', { type: 'error' })
            setPriceData(null)
        } finally {
            try { setPriceLoading(false) } catch (e) { console.error('[SpiralPage] setPriceLoading fallo', e) }
        }
    }, [printType, paperSize, br3Selected, rangeValue, bothSides, quantity, ringType, showToast])
    async function handleFileChange(e) {
        e.preventDefault();
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
            setUploadLoading(true)
            const user = JSON.parse(localStorage.getItem('user')) || {}
            const token = user?.token
            const fd = new FormData();
            files.forEach((file) => fd.append('files', file))
            fd.append('username', user?.user?.username || '');

            try {
                const res = await fetch('/api/file-manager', {
                    method: 'POST',
                    headers: { 'Accept': '*/*', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                    body: fd
                })

                if (!res.ok) {
                    let msg = `Upload proxy failed: ${res.status} ${res.statusText}`
                    let body = ''
                    try {
                        const data = await res.json()
                        body = data?.message || data?.error || JSON.stringify(data)
                    } catch (jsonErr) {
                        body = await res.text().catch(() => '')
                    }
                    if (body) msg = `Error al subir archivo: ${body}`
                    console.error('[SpiralPage] Error en file-manager, body:', body)
                    showToast(msg, { type: 'error' })
                    throw new Error(msg)
                }

                const responseList = await res.json()
                const payload = {
                    id_user: user?.user?.id_user || user?.user?.id || 1,
                    resList: responseList,
                }

                const res2 = await fetch('/api/file', {
                    method: 'POST',
                    headers: {
                        'Accept': '*/*',
                        'Content-Type': 'application/json; charset=utf-8',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(payload)
                })

                if (!res2.ok) {
                    let msg = `/api/file failed: ${res2.status} ${res2.statusText}`
                    let body = ''
                    try {
                        const data = await res2.json()
                        body = data?.message || data?.error || JSON.stringify(data)
                    } catch (jsonErr) {
                        body = await res2.text().catch(() => '')
                    }
                    if (body) msg = `Error registrando archivo: ${body}`
                    console.error('[SpiralPage] Error en /api/file, body:', body)
                    showToast(msg, { type: 'error' })
                    throw new Error(msg)
                }

                const final = await res2.json().catch(() => null)
                const items = Array.isArray(final?.items) ? final.items : []
                const savedList = items.length > 0
                    ? items.map((item) => item?.data?.file || item?.data || item?.payload).filter(Boolean)
                    : (Array.isArray(responseList) ? responseList.map((r) => ({
                        filename: r.originalName,
                        type: r.service,
                        filehash: r.storedName,
                    })) : [])

                setUploads((prev) => {
                    const merged = [...prev, ...savedList]
                    if (merged.length > 0) {
                        const lastIdx = merged.length - 1
                        setSelectedUploadIndex(lastIdx)
                        setLastUpload(merged[lastIdx])
                        try { calculatePrice(merged) } catch (err) { console.error('[SpiralPage] calculatePrice fallo', err) }
                    }
                    return merged
                })
                showToast(files.length > 1 ? 'Archivos subidos correctamente' : 'Archivo subido correctamente', { type: 'success' })
            } catch (err) {
                showError(err.message)
            }
            setUploadLoading(false)
        }
        try { e.target.value = '' } catch (e) { }
    }

    function selectUpload(idx) {
        const selected = uploads[idx]
        if (!selected) return
        setSelectedUploadIndex(idx)
        setLastUpload(selected)
        setPageNumber(1)
    }

    function removeUpload(idx) {
        setUploads((prev) => {
            const next = prev.filter((_, i) => i !== idx)
            if (!next.length) {
                setSelectedUploadIndex(0)
                setLastUpload(null)
                setPriceData(null)
                return next
            }
            const nextIndex = Math.min(selectedUploadIndex, next.length - 1)
            setSelectedUploadIndex(nextIndex)
            setLastUpload(next[nextIndex])
            try { calculatePrice(next) } catch (err) { console.error('[SpiralPage] calculatePrice fallo', err) }
            return next
        })
    }

    const previewFileUrl = useMemo(() => {
        const type = lastUpload?.type || lastUpload?.service
        let hash = lastUpload?.filehash || lastUpload?.storedName
        if (!type || !hash || type === 'undefined' || hash === 'undefined') return null
        if (hash.endsWith('.pdf')) {
            hash = hash.slice(0, -4)
        }
        return `/api/pdf-cache?hash=${encodeURIComponent(hash)}&type=${encodeURIComponent(type)}`
    }, [lastUpload])

    useEffect(() => {
        if (!uploads.length) return
        const t = setTimeout(() => calculatePrice(uploads), 250)
        return () => clearTimeout(t)
    }, [uploads, calculatePrice])

    function handlePayResult(result) {
        try {
            setPaymentOpen(false)
            console.log('[SpiralPage] resultado de pago', result)
            const m = result?.method || 'unknown'
            const a = result?.amount ?? (priceData?.totalPrice ?? 0)
            showToast(`Pago recibido: ${m} — $ ${a}`, { type: 'success' })
        } catch (e) {
            console.error('[SpiralPage] Error inesperado:', e)
        }
    }


    return (
        <section className='text-center'>
            {priceLoading && (
                <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/50'>
                    <div className='bg-white p-6 rounded-lg flex flex-col items-center gap-4'>
                        <div className='animate-spin rounded-full border-4 border-t-transparent border-gray-700 w-12 h-12'></div>
                        <div className='text-black'>Calculando precio…</div>
                    </div>
                </div>
            )}
            {uploadLoading && (
                <div className='fixed inset-0 z-[70] flex items-center justify-center bg-black/60'>
                    <div className='bg-white p-6 rounded-lg flex flex-col items-center gap-4'>
                        <div className='animate-spin rounded-full border-4 border-t-transparent border-gray-700 w-12 h-12'></div>
                        <div className='text-black'>Subiendo archivo…</div>
                    </div>
                </div>
            )}
            <div className='absolute top-0 w-full h-full flex justify-center items-center'>
                <div className='relative top-0 w-full h-full flex flex-col justify-center items-center'>
                    <div className='top-0 w-full h-[70%] z-[1]'>
                        <svg className='absolute left-0 top-0 w-[70%] z-[2] h-[70%]' width='100%' height='100%' viewBox='0 0 928 562' preserveAspectRatio='none' fill='none' xmlns='http://www.w3.org/2000/svg' style={{ display: 'block' }}>
                            <path d='M-221 275C-221 117.875 -93.625 -12 63.5 -12H769.834C908.311 -12 979.469 153.779 884.08 254.162L821.022 320.522C790.984 352.133 794.602 402.719 828.834 429.733C884.013 473.277 853.222 562 782.931 562H63.5002C-93.6248 562 -221 432.125 -221 275Z' fill='url(#paint0_linear_82_176)' />
                            <defs>
                                <linearGradient id='paint0_linear_82_176' x1='-221' y1='275' x2='996.443' y2='275' gradientUnits='userSpaceOnUse'>
                                    <stop stopColor='#4DB3E7' />
                                    <stop offset='0.990385' stopColor='#5B6FD7' stopOpacity='0.62' />
                                </linearGradient>
                            </defs>
                            <text x='10%' y='40%' className='text-white italic' fill='white' fontSize='40' fontWeight='bold'>Anillado e impresión</text>
                        </svg>
                        <Image
                            src='/images/bg-services-spiral.png'
                            alt='bg'
                            className='w-full h-full object-cover'
                            width={479}
                            height={307}
                            loading='eager' />
                    </div>
                    <div className='w-full h-[100%] bg-white z-[2] flex justify-center items-center end-0'>
                        <div className='absolute flex flex-col items-center top-[43%] w-[85%]'>
                            <form className='flex flex-col items-center w-full bg-white rounded-xl p-6 shadow-lg inset-shadow-sm inset-shadow-gray-500'>
                                <div className='flex flex-col items-center justify-center w-full text-black'>
                                    <div>
                                        <label htmlFor='file-upload' className='text-white text-bold text-center text-lg p-2 px-5 rounded-xl bg-[#007BFF] cursor-pointer flex gap-[10px] justify-center items-center'>
                                            <div className='start-0 pointer-events-none'>
                                                <span className='items-center text-2xl h-full text-black'>
                                                    <span className='fi fi-br-document'></span>
                                                </span>
                                            </div>
                                            <span className='px-5'>Subir archivo</span>
                                            <div className='end-0 pointer-events-none'>
                                                <span className='items-center text-2xl h-full text-black'>
                                                    <span className='fi fi-br-upload'></span>
                                                </span>
                                            </div>
                                        </label>
                                        <input id='file-upload' type='file' multiple accept='application/pdf' onChange={handleFileChange} className='hidden' />
                                    </div>
                                    {uploads.length > 0 && (
                                        <div className='mt-3 text-sm text-gray-700 flex flex-col items-center gap-2'>
                                            <div>Archivos cargados: {uploads.length}</div>
                                            <div className='flex flex-wrap gap-2 justify-center'>
                                                {uploads.map((u, idx) => (
                                                    <div
                                                        key={`${u.filehash || u.filename || 'file'}-${idx}`}
                                                        className={`inline-flex items-center rounded-full border ${idx === selectedUploadIndex ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                                                    >
                                                        <button
                                                            type='button'
                                                            onClick={() => selectUpload(idx)}
                                                            className='px-3 py-1 cursor-pointer'
                                                        >
                                                            {u.filename || u.originalName || u.name || `Archivo ${idx + 1}`}
                                                        </button>
                                                        <button
                                                            type='button'
                                                            aria-label='Quitar archivo'
                                                            onClick={() => removeUpload(idx)}
                                                            className={`px-2 py-1 border-l ${idx === selectedUploadIndex ? 'border-blue-300 text-white' : 'border-gray-300 text-gray-600'} hover:text-red-600 cursor-pointer`}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className='w-[80%] p-2 text-black grid grid-cols-[repeat(4,1fr)] grid-rows-[1fr] gap-y-[10px]'>
                                    <div className='w-full p-2'>
                                        <div className='w-full text-left py-1'>
                                            <span>Tipo de impresión</span>
                                        </div>
                                        <div className='w-full flex gap-[24px] flex-col justify-between'>
                                            <div className='flex items-center ps-4 w-full rounded-xl border border-gray-400 mb-2'>
                                                <input id='br1' type='radio' value='blanco_negro' name='br' className='w-5 h-5' checked={printType === 'blanco_negro'} onChange={() => { setPrintType('blanco_negro'); if (uploads.length) calculatePrice(uploads, { printType: 'blanco_negro' }) }} />
                                                <label htmlFor='br1' className='w-full py-2 text-left pl-4'>Impresión Blanco y Negro</label>
                                            </div>
                                            <div className='flex items-center ps-4 w-full rounded-xl border border-gray-400 mb-2'>
                                                <input id='br2' type='radio' value='color' name='br' className='w-5 h-5' checked={printType === 'color'} onChange={() => { setPrintType('color'); if (uploads.length) calculatePrice(uploads, { printType: 'color' }) }} />
                                                <label htmlFor='br2' className='w-full py-2 text-left pl-4'>Impresión a Color</label>
                                            </div>
                                        </div>
                                        <div className='w-full px-2 pb-2'>
                                            <div className='w-full text-left py-1'>
                                                <span>Rango</span>
                                            </div>
                                            <div className='flex items-center ps-1 w-full mb-2'>
                                                <input
                                                    id='br3'
                                                    type='radio'
                                                    value='todas'
                                                    name='br3'
                                                    className='w-5 h-5'
                                                    checked={br3Selected}
                                                    onChange={() => {
                                                        const v = true
                                                        setBr3Selected(v);
                                                        setRangeValue('');
                                                        if (uploads.length) calculatePrice(uploads, { br3Selected: v, rangeValue: '' });
                                                    }}
                                                />
                                                <label htmlFor='br3' className='w-full h-full  text-left pl-2'>Todas</label>
                                            </div>
                                            <div className='w-full text-left'>
                                                <span className='pr-3'>Paginas</span>
                                                <input
                                                    type='text'
                                                    id='rangep'
                                                    value={rangeValue}
                                                    onChange={(e) => {
                                                        const v = e.target.value
                                                        setRangeValue(v);
                                                        if (br3Selected) setBr3Selected(false);
                                                        if (uploads.length) calculatePrice(uploads, { br3Selected: false, rangeValue: v });
                                                    }}
                                                    className='bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-3 py-1 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow'
                                                    placeholder='1, 3-6'
                                                />
                                            </div>
                                            <div className='w-full text-left py-1'>
                                                <span>Tamaño de hoja</span>
                                            </div>
                                            <div className='w-full flex flex-col items-center content-stretch justify-center'>
                                                <select id='paper' name='paper' value={paperSize} onChange={(e) => { const v = e.target.value; setPaperSize(v); if (uploads.length) calculatePrice(uploads, { paperSize: v }) }} className='w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500'>
                                                    <option value='carta'>Carta</option>
                                                    <option value='oficio'>Oficio</option>
                                                </select>
                                            </div>

                                        </div>
                                    </div>
                                    <div className='w-full p-2'>
                                        <div className='w-full text-left py-1'>
                                            <span>Tipo de anillado</span>
                                        </div>
                                        <div className='w-full flex flex-col items-center content-stretch justify-center'>
                                            <select id='bound' name='bound' value={ringType} onChange={(e) => { const v = e.target.value; setRingType(v); if (uploads.length) calculatePrice(uploads, { ringType: v }) }} className='w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500'>
                                                <option value='ep'>Espiral plastico</option>
                                                <option value='em'>Espiral metalico</option>
                                            </select>
                                        </div>
                                        <div className='w-full text-left py-1'>
                                            <span>Imprimir por:</span>
                                        </div>
                                        <div className='w-full flex flex-col items-center content-stretch justify-center'>
                                            <select id='printSide' name='printSide' value={bothSides ? 'ac' : 'oc'} onChange={(e) => { const v = e.target.value === 'ac'; setBothSides(v); if (uploads.length) calculatePrice(uploads, { bothSides: v }) }} className='w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500'>
                                                <option value='oc'>Una cara</option>
                                                <option value='ac'>Ambas caras</option>
                                            </select>
                                        </div>
                                        <div className='w-full text-left py-1'>
                                            <span>Total de hojas</span>
                                        </div>
                                        <div className='w-full flex flex-col items-center content-stretch justify-center'>
                                            <div className='flex items-center w-full rounded-xl border border-gray-400 mb-2'>
                                                <label className='w-full py-2 text-center'>{priceData ? (priceData.sheets ?? '—') : '—'}</label>
                                            </div>
                                        </div>
                                        <div className='w-full text-left'>
                                            <span>Cantidad de juegos</span>
                                        </div>
                                        <div className='w-full'>
                                            <div className='relative'>
                                                <input
                                                    id='quantity'
                                                    name='quantity'
                                                    type='number'
                                                    min={1}
                                                    value={quantity}
                                                    onChange={(e) => {
                                                        const v = parseInt(e.target.value || '1', 10)
                                                        const nv = isNaN(v) ? 1 : Math.max(1, v)
                                                        setQuantity(nv)
                                                        if (uploads.length) calculatePrice(uploads, { quantity: nv })
                                                    }}
                                                    className='w-full border rounded-lg block p-2.5 pl-4 pr-12 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500 no-spin'
                                                />
                                                <label htmlFor='quantity' className='absolute right-12 top-1/2 -translate-y-1/2'>
                                                    <button
                                                        type='button'
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            const nv = Math.max(1, quantity - 1)
                                                            setQuantity(nv)
                                                            if (uploads.length) calculatePrice(uploads, { quantity: nv })
                                                        }}
                                                        className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-lg font-bold cursor-pointer'
                                                        aria-label='Disminuir cantidad'
                                                    >
                                                        −
                                                    </button>
                                                </label>
                                                <label htmlFor='quantity' className='absolute right-2 top-1/2 -translate-y-1/2'>
                                                    <button
                                                        type='button'
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            const nv = quantity + 1
                                                            setQuantity(nv)
                                                            if (uploads.length) calculatePrice(uploads, { quantity: nv })
                                                        }}
                                                        className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-lg font-bold cursor-pointer'
                                                        aria-label='Aumentar cantidad'
                                                    >
                                                        +
                                                    </button>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='w-full p-2'>
                                        <div className='w-full text-left'>
                                            <span>Observaciones</span>
                                        </div>
                                        <div className='bg-[#BABABA47] w-full rounded-lg'>
                                            <div className='w-full flex flex-col content-stretch p-1 pl-3'>
                                                <textarea rows={'4'} placeholder='Observaciones (opcional)' value={observations} onChange={(e) => setObservations(e.target.value)}></textarea>
                                            </div>
                                        </div>
                                        <div className='w-full text-left'>
                                            <span>Fecha de entrega</span>
                                        </div>
                                        <div className='bg-[#BABABA47] w-full rounded-lg'>
                                            <div className='w-full flex flex-col content-stretch p-1 pl-3'>
                                                <DatePicker
                                                    selected={new Date(deliveryDate)}
                                                    onChange={(date) => setDeliveryDate(date.toISOString().split('T')[0])}
                                                    filterDate={(date) => date.getDay() !== 0 && date.getDay() !== 6}
                                                    minDate={new Date(deliveryDate)}
                                                    dateFormat="yyyy-MM-dd"
                                                    className="w-full bg-transparent border-none outline-none cursor-pointer"
                                                />
                                                <p className='text-xs w-full text-left'>Sujeto a cambios sin previo aviso</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='w-full p-2'>
                                        <div className='w-full text-left'>
                                            <span>Precios de anillado</span>
                                        </div>
                                        <div className='bg-[#BABABA47] w-full rounded-lg'>
                                            <div className='w-full flex flex-col content-stretch p-1 pl-3'>
                                                {priceData ? (
                                                    <>
                                                        <label className='w-full py-2 text-sm text-left text-[#3C3C3C] font-bold'>Concepto</label>
                                                        <div className='text-sm text-left py-1'>{ringType === 'ep' ? 'Espiral plastico' : 'Espiral metalico'}: <strong>{typeof priceData.breakdownPerSet?.ringCost === 'number' ? (`$ ${priceData.breakdownPerSet.ringCost}`) : '—'}</strong></div>
                                                        <div className='text-sm text-left py-1'>Precio por juego: <strong>{typeof priceData.breakdownPerSet.ringCost === 'number' ? (`$ ${priceData.breakdownPerSet.ringCost}`) : '—'}</strong></div>
                                                        <div className='text-sm text-left py-1'>Precio total anillado: <strong>{typeof priceData.breakdownTotal?.ringCost === 'number' ? (`$ ${priceData.breakdownTotal.ringCost}`) : '—'}</strong></div>
                                                    </>
                                                ) : (
                                                    <span className='text-sm text-left py-2'>{ringType === 'ep' ? 'Espiral plastico' : 'Espiral metalico'}: <strong>—</strong></span>
                                                )}
                                            </div>
                                        </div>
                                        <div className='w-full text-left'>
                                            <span>Calculo de precios</span>
                                        </div>
                                        <div className='bg-[#BABABA47] w-full rounded-lg'>
                                            <div className='w-full flex flex-col content-stretch p-1 pl-3'>
                                                <label className='w-full py-2 text-sm text-left text-[#3C3C3C] font-bold'>Concepto</label>
                                                {priceData ? (
                                                    <>
                                                        <div className='text-sm text-left py-1'>Tinta: <strong>{typeof priceData.breakdownPerSet?.inkCost === 'number' ? (`$ ${priceData.breakdownPerSet.inkCost}`) : '—'}</strong></div>
                                                        <div className='text-sm text-left py-1'>Papel: <strong>{typeof priceData.breakdownPerSet?.paperCost === 'number' ? (`$ ${priceData.breakdownPerSet.paperCost}`) : '—'}</strong></div>
                                                        <div className='text-sm text-left py-1'>Precio por juego: <strong>{(typeof priceData.breakdownPerSet?.inkCost === 'number' && typeof priceData.breakdownPerSet?.paperCost === 'number') ? (`$ ${priceData.breakdownPerSet.inkCost + priceData.breakdownPerSet.paperCost}`) : '—'}</strong></div>
                                                        <div className='text-sm text-left py-1'>Precio total impresión: <strong>{(typeof priceData.breakdownTotal?.inkCost === 'number' && typeof priceData.breakdownTotal?.paperCost === 'number') ? (`$ ${priceData.breakdownTotal.inkCost + priceData.breakdownTotal.paperCost}`) : '—'}</strong></div>
                                                    </>
                                                ) : (
                                                    <div className='text-sm text-left py-2'>Seleccione opciones y suba un archivo para calcular precio.</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className='w-full text-left py-1'>
                                            <span>Precio total</span>
                                        </div>
                                        <div className='w-full flex flex-col items-center content-stretch justify-center'>
                                            <div className='flex items-center w-full rounded-xl bg-[#77ADFF52] border border-[#77ADFFBD] mb-2'>
                                                <label className='w-full py-2 text-center'>{priceData ? ('$ ' + (priceData.totalPrice ?? '—')) : '$ 0'}</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='w-full gap-5 flex flex-row justify-end content-end items-end'>
                                    <button onClick={() => {
                                        if (!lastUpload) return (showError('No hay archivo subido para previsualizar'), null)
                                        if (!previewFileUrl) return (showError('Faltan datos del archivo para la vista previa'), null)
                                        setPreviewOpen(true)
                                    }} type='button' className='text-black text-sm px-10 p-1 rounded-full bg-[#FFC107] cursor-pointer'>Vista Previa</button>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            if (priceLoading) return
                                            if (!priceData) return (showError('Calcula el precio primero'), null)
                                            console.log('[SpiralPage] abriendo modal de pago, priceData:', priceData ? { totalPrice: priceData.totalPrice } : null)
                                            setPaymentOpen(true)
                                        }}
                                        className='text-black text-sm px-10 p-1 rounded-full bg-gradient-to-r from-[#7BCE6D] to-[#A8D860] cursor-pointer'
                                    >Aceptar</button>
                                </div>
                                <div className='margin-[-50px] bg-transparent'></div>
                            </form>
                            {previewMounted && (
                                <div onClick={() => setPreviewOpen(false)} className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-${ANIM_DURATION} ${previewVisible ? 'opacity-100' : 'opacity-0'}`}>
                                    <div onClick={(e) => e.stopPropagation()} className={`bg-white rounded-xl max-w-[60vw] w-full p-6 overflow-auto transform transition-all duration-${ANIM_DURATION} ${previewVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}`} style={{ maxHeight: '80vh' }}>
                                        <div className='flex justify-between items-center'>
                                            <h3 className='text-lg text-black'>Vista previa</h3>
                                        </div>
                                        <div className='mt-4'>
                                            {lastUpload ? (
                                                <div className='space-y-3'>
                                                    <div className='text-gray-700 text-md'>Nombre: <span className='font-medium'>{lastUpload.filename || lastUpload.originalName || lastUpload.name}</span></div>
                                                    {previewFileUrl ? (
                                                        <div className='mt-3 space-y-3'>

                                                            <div className='border rounded overflow-scroll overflow-x-hidden flex justify-center bg-gray-50 max-h-[60vh]'>
                                                                <Document
                                                                    file={previewFileUrl}
                                                                    onLoadSuccess={({ numPages: n }) => {
                                                                        setNumPages(n)
                                                                        setPageNumber((p) => (p > n ? n : p))
                                                                    }}
                                                                    onLoadError={(e) => { try { showToast(`No se pudo cargar el PDF: ${e.message || e}`, { type: 'error' }) } catch (err) { console.error('[PrintPage] Error inesperado:', err) } }}
                                                                    loading={<div className='p-4 text-gray-600'>Cargando PDF…</div>}
                                                                >
                                                                    <Page pageNumber={pageNumber} width={800} renderAnnotationLayer={false} renderTextLayer={false} />
                                                                </Document>
                                                            </div>
                                                        </div>
                                                    ) : lastUpload.url ? (
                                                        <div className='mt-2'>
                                                            <a className='text-blue-600 hover:underline' href={lastUpload.url} target='_blank' rel='noreferrer'>Abrir archivo</a>
                                                        </div>
                                                    ) : (
                                                        <div className='text-sm text-red-600'>No hay datos suficientes para mostrar la vista previa.</div>
                                                    )}
                                                    <div className='flex flex-col w-full justify-center gap-3 text-sm text-gray-700'>
                                                        <div className='w-full flex justify-center'>
                                                            <button
                                                                type='button'
                                                                className='cursor-pointer rotate-180 text-4xl'
                                                                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                                                                disabled={pageNumber <= 1}
                                                            >
                                                                <i className="fi fi-sr-angle-small-right"></i>
                                                            </button>
                                                            <span className='p-3 pb-1 text-lg'>Página {pageNumber}{numPages ? ` de ${numPages}` : ''}</span>
                                                            <button
                                                                type='button'
                                                                className='cursor-pointer rotate-x-180 text-4xl'
                                                                onClick={() => setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p + 1))}
                                                                disabled={numPages ? pageNumber >= numPages : false}
                                                            >
                                                                <i className="fi fi-sr-angle-small-right"></i>
                                                            </button>
                                                        </div>
                                                        <div className='w-full flex flex-col items-center content-stretch justify-center'>
                                                            <div className='flex items-center w-full rounded-xl border border-gray-400'>
                                                                <div className='w-1/2 p-3 items-left flex'>
                                                                    <label className='text-center text-md px-2'>Precio estimado: </label>
                                                                    <label className='text-center text-md font-semibold'>{priceData ? ('$ ' + priceData.totalPrice ?? '—') : '$ 0'}</label>
                                                                </div>
                                                                <div className='w-1/2 p-3 items-right flex justify-end'>
                                                                    <button
                                                                        type='button'
                                                                        disabled={priceLoading}
                                                                        onClick={() => {
                                                                            if (priceLoading) return
                                                                            if (!priceData) { try { showToast('Carga el archivo primero', { type: 'warn' }) } catch (e) { console.error('[PrintPage] showToast fallo', e) }; return }
                                                                            console.log('[PrintPage] abriendo modal de pago, priceData:', priceData ? { totalPrice: priceData.totalPrice } : null)
                                                                            setPaymentOpen(true)
                                                                        }}
                                                                        className={`text-black text-sm px-15 p-1 rounded-full bg-gradient-to-r from-[#007BFF] to-[#0872EAA3] ${priceLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                    >Aceptar</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            ) : (
                                                <p className='text-sm text-gray-600'>No hay datos de previsualización.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className='py-4'></div>
                            <PaymentModal
                                open={paymentOpen}
                                onClose={() => setPaymentOpen(false)}
                                amount={priceData?.totalPrice ?? 0}
                                currency={'MXN'}
                                context={{ lastUpload, uploads, printType, paperSize, rangeValue, bothSides, quantity, priceData, deliveryDate, ringType, observations }}
                                onPay={(res) => handlePayResult(res)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
} 