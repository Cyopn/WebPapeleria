'use client'
import Image from 'next/image'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Document, Page } from 'react-pdf'
import { useToast } from '@/context/toast_context'
import setupPdfWorker from '@/lib/setup_pdf_worker'
import PaymentModal from '@/components/payment_modal'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function DocsPage() {
    const [rangeValue, setRangeValue] = useState('');
    const [br3Selected, setBr3Selected] = useState(true);
    const [lastUpload, setLastUpload] = useState(null)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewMounted, setPreviewMounted] = useState(false)
    const [previewVisible, setPreviewVisible] = useState(false)
    const [numPages, setNumPages] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const { showToast } = useToast()
    function showError(msg) { try { showToast(msg, { type: 'error' }) } catch (e) { console.error('[DocsPage] showToast fallo', e) } }
    const previewLockRef = useRef(false)
    const ANIM_DURATION = 200
    const [quantity, setQuantity] = useState(1)
    const [printType, setPrintType] = useState('blanco_negro')
    const [paperSize, setPaperSize] = useState('carta')
    const [bothSides, setBothSides] = useState(false)
    const [docType, setDocType] = useState('te')
    const [priceData, setPriceData] = useState(null)
    const [priceLoading, setPriceLoading] = useState(false)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [paymentOpen, setPaymentOpen] = useState(false)
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
    const [coverColor, setCoverColor] = useState('ro')
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
            console.error('[DocsPage] setupPdfWorker fallo', e)
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
        const filename = uploadInfo.filehash || uploadInfo.storedName || uploadInfo.filename
        if (!filename) return

        const pt = overrides.printType ?? printType
        const ps = overrides.paperSize ?? paperSize
        const br3 = overrides.br3Selected ?? br3Selected
        const rv = overrides.rangeValue ?? rangeValue
        const bs = typeof overrides.bothSides === 'boolean' ? overrides.bothSides : bothSides
        const qty = overrides.quantity ?? quantity
        const dtype = overrides.docType ?? docType

        const mapDoc = {
            te: 'tesis',
            ex: 'examen',
            re: 'reporte',
            ot: 'otro'
        }

        const payload = {
            filename: filename,
            colorModes: pt === 'color' ? 'color' : 'bw',
            paperSizes: ps || 'carta',
            ranges: br3 ? 'all' : (rv || 'all'),
            bothSides: !!bs,
            service: uploadInfo.type || uploadInfo.service || 'file',
            sets: Number(qty || 1),
            type: 'docs',
            documentType: mapDoc[dtype] || 'otro',
        }

        try {
            setPriceLoading(true)
            let headers = { 'Content-Type': 'application/json' }
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}')
                if (user?.token) headers.Authorization = `Bearer ${user.token}`
            } catch (e) { console.error('[DocsPage] fallo parseando localStorage user', e) }

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
                setPriceData(data)
            }
        } catch (err) {
            console.error('[DocsPage] Error al calcular precio', err)
            showToast(err?.message || 'Error calculando precio', { type: 'error' })
            setPriceData(null)
        } finally {
            try { setPriceLoading(false) } catch (e) { console.error('[DocsPage] setPriceLoading fallo', e) }
        }
    }, [printType, paperSize, br3Selected, rangeValue, bothSides, quantity, docType, showToast])
    async function handleFileChange(e) {
        e.preventDefault();
        const file = e.target.files[0]
        if (file) {
            setUploadLoading(true)
            const user = JSON.parse(localStorage.getItem('user')) || {}
            const token = user?.token
            const fd = new FormData();
            fd.append('files', file);
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
                    console.error('[DocsPage] Error en file-manager, body:', body)
                    showToast(msg, { type: 'error' })
                    throw new Error(msg)
                }

                const response = (await res.json())[0]

                const payload = {
                    id_user: user?.user?.id_user || user?.user?.id || 1,
                    filename: response.originalName,
                    type: response.service,
                    filehash: response.storedName,
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
                    console.error('[DocsPage] Error en /api/file, body:', body)
                    showToast(msg, { type: 'error' })
                    throw new Error(msg)
                }

                const final = await res2.json().catch(() => null)
                setLastUpload(final || payload)
                showToast('Archivo subido correctamente', { type: 'success' })
            } catch (err) {
                showError(err.message)
            }
            setUploadLoading(false)
        }
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
        if (!lastUpload) return
        const t = setTimeout(() => calculatePrice(lastUpload), 250)
        return () => clearTimeout(t)
    }, [lastUpload, calculatePrice])

    function handlePayResult(result) {
        setPaymentOpen(false)
        try {
            console.log('[DocsPage] resultado de pago', result)
            const m = result?.method || 'unknown'
            const a = result?.amount ?? (priceData?.totalPrice ?? 0)
            showToast(`Pago recibido: ${m} — $ ${a}`, { type: 'success' })
        } catch (err) {
            console.error('[DocsPage] Error procesando pago', err)
            showToast(err?.message || 'Error procesando pago', { type: 'error' })
        } finally {
            try { setPriceLoading(false) } catch (e) { console.error('[DocsPage] setPriceLoading fallo', e) }
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
                            <text x='10%' y='40%' className='text-white italic' fill='white' fontSize='40' fontWeight='bold'>Documentos especiales</text>
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
                                        <label htmlFor='file-upload' className={`text-white text-bold text-center text-lg p-2 px-5 rounded-xl bg-[#007BFF] flex gap-[10px] justify-center items-center ${uploadLoading || priceLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
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
                                        <input id='file-upload' type='file' accept='application/pdf' onChange={handleFileChange} className='hidden' />
                                    </div>
                                </div>
                                <div className='w-[80%] p-2 text-black grid grid-cols-[repeat(3,1fr)] grid-rows-[1fr] gap-y-[10px]'>
                                    <div className='w-full p-2'>
                                        <div className='w-full text-left py-1'>
                                            <span>Tipo de impresión</span>
                                        </div>
                                        <div className='w-full flex gap-[24px] flex-col justify-between'>
                                            <div className='flex items-center ps-4 w-full rounded-xl border border-gray-400 mb-2'>
                                                <input id='br1' type='radio' value='blanco_negro' name='br' className='w-5 h-5' checked={printType === 'blanco_negro'} onChange={() => { setPrintType('blanco_negro'); if (lastUpload) calculatePrice(lastUpload, { printType: 'blanco_negro' }) }} />
                                                <label htmlFor='br1' className='w-full py-2 text-left pl-4'>Impresión Blanco y Negro</label>
                                            </div>
                                            <div className='flex items-center ps-4 w-full rounded-xl border border-gray-400 mb-2'>
                                                <input id='br2' type='radio' value='color' name='br' className='w-5 h-5' checked={printType === 'color'} onChange={() => { setPrintType('color'); if (lastUpload) calculatePrice(lastUpload, { printType: 'color' }) }} />
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
                                                        if (lastUpload) calculatePrice(lastUpload, { br3Selected: v, rangeValue: '' })
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
                                                        if (lastUpload) calculatePrice(lastUpload, { br3Selected: false, rangeValue: v })
                                                    }}
                                                    className='bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-3 py-1 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow'
                                                    placeholder='1, 3-6'
                                                />
                                            </div>
                                            <div className='w-full text-left py-1'>
                                                <span>Tamaño de hoja</span>
                                            </div>
                                            <div className='w-full flex flex-col items-center content-stretch justify-center'>
                                                <select id='paper' name='paper' value={paperSize} onChange={(e) => { const v = e.target.value; setPaperSize(v); if (lastUpload) calculatePrice(lastUpload, { paperSize: v }) }} className='w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500'>
                                                    <option value='carta'>Carta</option>
                                                    <option value='oficio'>Oficio</option>
                                                </select>
                                            </div>
                                            <div className='w-full text-left py-1'>
                                                <span>Imprimir por:</span>
                                            </div>
                                            <div className='w-full flex flex-col items-center content-stretch justify-center'>
                                                <select id='paper' name='paper' value={bothSides ? 'ac' : 'oc'} onChange={(e) => { const v = e.target.value === 'ac'; setBothSides(v); if (lastUpload) calculatePrice(lastUpload, { bothSides: v }) }} className='w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500'>
                                                    <option value='oc'>Una cara</option>
                                                    <option value='ac'>Ambas caras</option>
                                                </select>
                                            </div>
                                        </div>

                                    </div>
                                    <div className='w-full p-2'>
                                        <div className='w-full text-left py-1'>
                                            <span>Tipo de documento</span>
                                        </div>
                                        <div className='w-full flex flex-col items-center content-stretch justify-center'>
                                            <select id='bound' name='bound' value={docType} onChange={(e) => { const v = e.target.value; setDocType(v); if (lastUpload) calculatePrice(lastUpload, { docType: v }) }} className='w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500'>
                                                <option value='te'>Tesis</option>
                                                <option value='ex'>Examen</option>
                                                <option value='re'>Reporte</option>
                                                <option value='ot'>Otro</option>
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
                                                        if (lastUpload) calculatePrice(lastUpload, { quantity: nv })
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
                                                            if (lastUpload) calculatePrice(lastUpload, { quantity: nv })
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
                                                            if (lastUpload) calculatePrice(lastUpload, { quantity: nv })
                                                        }}
                                                        className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-lg font-bold cursor-pointer'
                                                        aria-label='Aumentar cantidad'
                                                    >
                                                        +
                                                    </button>
                                                </label>
                                            </div>
                                        </div>
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
                                            <span>Precios de documento especial</span>
                                        </div>
                                        <div className='bg-[#BABABA47] w-full rounded-lg'>
                                            <div className='w-full flex flex-col content-stretch p-1 pl-3'>
                                                {
                                                    priceData ? (
                                                        <>
                                                            <label className='w-full py-2 text-sm text-left text-[#3C3C3C] font-bold'>Concepto</label>
                                                            <div className='text-sm text-left py-1'>{docType === 'te' ? 'Tesis' : docType === 'ex' ? 'Examen' : docType === 're' ? 'Reporte' : 'Otro'}: <strong>{typeof priceData?.breakdownPerSet?.docsCost === 'number' ? (`$ ${priceData.breakdownPerSet.docsCost}`) : '—'}</strong></div>
                                                            <div className='text-sm text-left py-1'>Precio por juego: <strong>{typeof priceData?.breakdownPerSet?.docsCost === 'number' ? (`$ ${priceData.breakdownPerSet.docsCost}`) : '—'}</strong></div>
                                                            <div className='text-sm text-left py-1'>Precio total documento: <strong>{typeof priceData?.breakdownTotal?.docsCost === 'number' ? (`$ ${priceData.breakdownTotal.docsCost}`) : '—'}</strong></div>
                                                        </>
                                                    ) : (
                                                        <span className='text-sm text-left py-2'>{docType === 'te' ? 'Tesis' : docType === 'ex' ? 'Examen' : docType === 're' ? 'Reporte' : 'Otro'}: <strong>—</strong></span>
                                                    )
                                                }
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
                                    <button disabled={uploadLoading || priceLoading} onClick={() => {
                                        if (!lastUpload) return (showError('No hay archivo subido para previsualizar'), null)
                                        if (!previewFileUrl) return (showError('Faltan datos del archivo para la vista previa'), null)
                                        setPreviewOpen(true)
                                    }} type='button' className={`text-black text-sm px-10 p-1 rounded-full bg-[#FFC107] ${uploadLoading || priceLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>Vista Previa</button>
                                    <button
                                        disabled={uploadLoading || priceLoading}
                                        type='button'
                                        onClick={() => {
                                            if (uploadLoading || priceLoading) return
                                            if (!priceData) return (showError('Calcula el precio primero'), null)
                                            console.log('[DocsPage] abriendo modal de pago, priceData:', priceData ? { totalPrice: priceData.totalPrice } : null)
                                            setPaymentOpen(true)
                                        }}
                                        className={`text-black text-sm px-10 p-1 rounded-full bg-gradient-to-r from-[#7BCE6D] to-[#A8D860] ${uploadLoading || priceLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >Aceptar</button>
                                </div>
                                <div className='margin-[-50px] bg-transparent'></div>
                            </form>
                            <PaymentModal
                                open={paymentOpen}
                                onClose={() => setPaymentOpen(false)}
                                amount={priceData?.totalPrice ?? 0}
                                currency={'MXN'}
                                context={{ lastUpload, printType, paperSize, rangeValue, bothSides, quantity, priceData, docType, deliveryDate, observations }}
                                onPay={(res) => handlePayResult(res)}
                            />
                            {previewMounted && (
                                <div onClick={() => setPreviewOpen(false)} className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-${ANIM_DURATION} ${previewVisible ? 'opacity-100' : 'opacity-0'}`}>
                                    <div onClick={(e) => e.stopPropagation()} className={`bg-white rounded-xl max-w-[60vw] w-full p-6 overflow-auto transform transition-all duration-${ANIM_DURATION} ${previewVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}`} style={{ maxHeight: '80vh' }}>
                                        <div className='flex justify-between items-center'>
                                            <h3 className='text-lg text-black font-semibold'>Vista previa</h3>
                                            <button onClick={() => setPreviewOpen(false)} className='text-gray-600 cursor-pointer'>Cerrar</button>
                                        </div>
                                        <div className='mt-4'>
                                            {lastUpload ? (
                                                <div className='space-y-3'>
                                                    <div className='text-sm text-gray-700'>Nombre: <span className='font-medium'>{lastUpload.filename || lastUpload.originalName || lastUpload.name}</span></div>
                                                    {previewFileUrl ? (
                                                        <div className='mt-3 space-y-3'>
                                                            <div className='flex items-center gap-3 text-sm text-gray-700'>
                                                                <button
                                                                    type='button'
                                                                    className='px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 cursor-pointer'
                                                                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                                                                    disabled={pageNumber <= 1}
                                                                >
                                                                    Anterior
                                                                </button>
                                                                <button
                                                                    type='button'
                                                                    className='px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 cursor-pointer'
                                                                    onClick={() => setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p + 1))}
                                                                    disabled={numPages ? pageNumber >= numPages : false}
                                                                >
                                                                    Siguiente
                                                                </button>
                                                                <span>Página {pageNumber}{numPages ? ` de ${numPages}` : ''}</span>
                                                            </div>
                                                            <div className='border rounded overflow-hidden flex justify-center bg-gray-50'>
                                                                <Document
                                                                    file={previewFileUrl}
                                                                    onLoadSuccess={({ numPages: n }) => {
                                                                        setNumPages(n)
                                                                        setPageNumber((p) => (p > n ? n : p))
                                                                    }}
                                                                    onLoadError={(e) => showError(`No se pudo cargar el PDF: ${e.message || e}`)}
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
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <p className='text-sm text-gray-600'>No hay datos de previsualización.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className='py-4'></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}