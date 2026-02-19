'use client'
import Image from 'next/image'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import Cropper from 'react-easy-crop'
import { useToast } from '@/context/toast_context'
import setupPdfWorker from '@/lib/setup_pdf_worker'
import PaymentModal from '@/components/payment_modal'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function PhotoPage() {
    const [rangeValue, setRangeValue] = useState('');
    const [bothSides, setBothSides] = useState(false)
    const [lastUpload, setLastUpload] = useState(null)
    const [uploads, setUploads] = useState([])
    const [selectedUploadIndex, setSelectedUploadIndex] = useState(0)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewMounted, setPreviewMounted] = useState(false)
    const [previewVisible, setPreviewVisible] = useState(false)
    const [quantity, setQuantity] = useState(1)
    const [localPreview, setLocalPreview] = useState(null)
    const [cropOpen, setCropOpen] = useState(false)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const [paperSize, setPaperSize] = useState('ti')
    const [printType, setPrintType] = useState('blanco_negro')
    const [photoPaper, setPhotoPaper] = useState('pb')
    const [priceData, setPriceData] = useState(null)
    const [priceLoading, setPriceLoading] = useState(false)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null)
    const [paymentOpen, setPaymentOpen] = useState(false)
    const [numPages, setNumPages] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const { showToast } = useToast();
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

    function showError(msg) { try { showToast(msg, { type: 'error' }) } catch (e) { } }
    const previewLockRef = useRef(false)
    const ANIM_DURATION = 200
    const genTimeoutRef = useRef(null)

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
        }
    }, [])

    useEffect(() => {
        let tIn, tOut, tMount
        if (previewOpen) {
            tMount = setTimeout(() => setPreviewMounted(true), 0)
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
            clearTimeout(tMount)
            clearTimeout(tIn)
            clearTimeout(tOut)
            if (previewLockRef.current) {
                unlockBody()
            }
        }
    }, [previewOpen, previewMounted])

    function handleFileChange(e) {
        e.preventDefault();
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        if (files.length > 1) {
            try { if (localPreview) URL.revokeObjectURL(localPreview) } catch (e) { }
            setLocalPreview(null)
            setCropOpen(false)
            createAndStorePdfsFromFiles(files)
            try { e.target.value = '' } catch (e) { }
            return
        }

        const file = files[0]
        try {
            try { if (localPreview) URL.revokeObjectURL(localPreview) } catch (e) { }
            const url = URL.createObjectURL(file)
            setLocalPreview(url)
        } catch (err) {
            console.error('[PhotoPage] error al generar la vista previa', err)
            showError('No se pudo generar la vista previa')
        }
        try { e.target.value = '' } catch (e) { }
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
            try { calculatePrice(next) } catch (e) { }
            return next
        })
    }

    useEffect(() => {
        return () => {
            if (localPreview) {
                try { URL.revokeObjectURL(localPreview) } catch (e) { }
            }
        }
    }, [localPreview])
    useEffect(() => {
        if (!localPreview) return
        createAndStorePdf()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localPreview])

    function onCropComplete(_croppedArea, croppedAreaPixels) {
        setCroppedAreaPixels(croppedAreaPixels)
    }

    const aspect = useMemo(() => {
        const map = {
            ti: 2.5 / 3,
            tc: 4 / 4,
            tap: 9 / 13,
        }
        return map[paperSize] || (4 / 3)
    }, [paperSize])

    function openCropOrUpload() {
        if (localPreview) {
            setCropOpen(true)
        } else {
            const el = document.getElementById('file-upload')
            if (el) el.click()
        }
    }

    function closeCrop() {
        setCropOpen(false)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
    }

    async function getCroppedImg(imageSrc, pixelCrop) {
        const createImage = (url) => new Promise((resolve, reject) => {
            const img = (typeof window !== 'undefined' && window.Image) ? new window.Image() : document.createElement('img')
            img.setAttribute('crossOrigin', 'anonymous')
            img.onload = () => resolve(img)
            img.onerror = (e) => reject(e)
            img.src = url
        })

        const image = await createImage(imageSrc)
        const canvas = document.createElement('canvas')
        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height
        const ctx = canvas.getContext('2d')

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        )

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'))
                    return
                }
                resolve(blob)
            }, 'image/jpeg')
        })
    }

    async function applyCrop() {
        if (!localPreview || !croppedAreaPixels) return
        try {
            const blob = await getCroppedImg(localPreview, croppedAreaPixels)
            try { if (localPreview) URL.revokeObjectURL(localPreview) } catch (e) { }
            const newUrl = URL.createObjectURL(blob)
            setLocalPreview(newUrl)
            closeCrop()
        } catch (err) {
            console.error('[PhotoPage] error al recortar la imagen', err)
            showError('No se pudo recortar la imagen')
        }
    }

    function cmToPx(cm, dpi = 300) {
        return Math.round((cm / 2.54) * dpi)
    }

    async function handleGeneratePdf() {
        if (!localPreview && !(lastUpload && (lastUpload.filehash || lastUpload.storedName))) return showError('No hay imagen subida para generar el PDF')

        try {
            if (lastUpload && (lastUpload.filehash || lastUpload.storedName)) {
                const hash = lastUpload.filehash || lastUpload.storedName
                const type = lastUpload.type || lastUpload.service || 'local'
                const cacheUrl = `/api/pdf-cache?hash=${encodeURIComponent(hash)}&type=${encodeURIComponent(type)}`
                const res = await fetch(cacheUrl)
                if (!res.ok) {
                    const txt = await res.text().catch(() => '')
                    console.error('[PhotoPage] error al obtener pdf-cache', res.status, txt)
                    return showError('Error al obtener el PDF en vista previa')
                }
                const pdfBlob = await res.blob()
                const url = URL.createObjectURL(pdfBlob)
                try { if (generatedPdfUrl) URL.revokeObjectURL(generatedPdfUrl) } catch (e) { }
                setGeneratedPdfUrl(url)
                setPreviewOpen(true)
                return
            }

            const resp = await fetch(localPreview)
            const blob = await resp.blob()
            const arrayBuffer = await blob.arrayBuffer()
            const base64 = `data:${blob.type};base64,${Buffer.from(arrayBuffer).toString('base64')}`

            const res = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64, paperSize, quantity }),
            })

            if (!res.ok) {
                const errText = await res.text()
                console.error('[PhotoPage] error del servidor al generar pdf', errText)
                return showError('Error del servidor al generar el PDF')
            }

            const pdfBlob = await res.blob()
            const url = URL.createObjectURL(pdfBlob)
            try { if (generatedPdfUrl) URL.revokeObjectURL(generatedPdfUrl) } catch (e) { }
            setGeneratedPdfUrl(url)
            setPreviewOpen(true)
        } catch (err) {
            console.error('[PhotoPage] error cliente al generar pdf', err)
            showError('No se pudo generar el PDF')
        }
    }

    async function createAndStorePdfsFromFiles(files, opts = {}) {
        if (!files || files.length === 0) return
        const genQty = typeof opts.quantity === 'number' ? opts.quantity : quantity
        const genPaperSize = opts.paperSize || paperSize
        setUploadLoading(true)
        try {
            const pdfFiles = []
            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer()
                const base64 = `data:${file.type};base64,${Buffer.from(arrayBuffer).toString('base64')}`
                const gen = await fetch('/api/generate-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64, paperSize: genPaperSize, quantity: genQty }),
                })
                if (!gen.ok) {
                    const txt = await gen.text().catch(() => '')
                    console.error('[PhotoPage] falló la generación del PDF', gen.status, txt)
                    continue
                }
                const pdfBlob = await gen.blob()
                const filename = `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.pdf`
                pdfFiles.push(new File([pdfBlob], filename, { type: 'application/pdf' }))
            }

            if (pdfFiles.length === 0) return

            const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {} } catch (e) { return {} } })()
            const token = user?.token
            const fd = new FormData()
            pdfFiles.forEach((file) => fd.append('files', file))
            fd.append('username', user?.user?.username || '')

            const upload = await fetch('/api/file-manager', {
                method: 'POST',
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: fd,
            })

            if (!upload.ok) {
                let body = ''
                try {
                    const data = await upload.json()
                    body = data?.message || data?.error || JSON.stringify(data)
                } catch (jsonErr) {
                    body = await upload.text().catch(() => '')
                }
                console.error('[PhotoPage] Error en file-manager, body:', body)
                return
            }

            const responseList = await upload.json()

            const payload = {
                id_user: user?.user?.id_user || user?.user?.id || 1,
                resList: responseList,
            }

            const reg = await fetch('/api/file', {
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json; charset=utf-8',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            })

            if (!reg.ok) {
                let body = ''
                try {
                    const data = await reg.json()
                    body = data?.message || data?.error || JSON.stringify(data)
                } catch (jsonErr) {
                    body = await reg.text().catch(() => '')
                }
                console.error('[PhotoPage] Error en /api/file, body:', body)
                return
            }

            const final = await reg.json().catch(() => null)
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
                    try { calculatePrice(merged) } catch (e) { }
                }
                return merged
            })
            try { if (typeof window !== 'undefined') showToast(files.length > 1 ? 'Archivos subidos y registrados' : 'Archivo subido y registrado', { type: 'success' }) } catch (e) { }
        } catch (err) {
            console.error('[PhotoPage] Error al crear y guardar PDF', err)
        } finally {
            try { setUploadLoading(false) } catch (e) { }
        }
    }

    async function createAndStorePdf(opts = {}) {
        if (!localPreview) return
        const genQty = typeof opts.quantity === 'number' ? opts.quantity : quantity
        const genPaperSize = opts.paperSize || paperSize
        setUploadLoading(true)
        try {
            const resp = await fetch(localPreview)
            const imgBlob = await resp.blob()
            const arrayBuffer = await imgBlob.arrayBuffer()
            const base64 = `data:${imgBlob.type};base64,${Buffer.from(arrayBuffer).toString('base64')}`

            const gen = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64, paperSize: genPaperSize, quantity: genQty }),
            })

            if (!gen.ok) {
                const txt = await gen.text().catch(() => '')
                console.error('[PhotoPage] falló la generación del PDF', gen.status, txt)
                return
            }

            const pdfBlob = await gen.blob()

            const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {} } catch (e) { return {} } })()
            const token = user?.token

            const fd = new FormData()
            const filename = `photo-${Date.now().toString(36)}.pdf`
            const file = new File([pdfBlob], filename, { type: 'application/pdf' })
            fd.append('files', file)
            fd.append('username', user?.user?.username || '')

            const upload = await fetch('/api/file-manager', {
                method: 'POST',
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: fd,
            })

            if (!upload.ok) {
                let body = ''
                try {
                    const data = await upload.json()
                    body = data?.message || data?.error || JSON.stringify(data)
                } catch (jsonErr) {
                    body = await upload.text().catch(() => '')
                }
                console.error('[PhotoPage] Error en file-manager, body:', body)
                return
            }

            const responseList = await upload.json()

            const payload = {
                id_user: user?.user?.id_user || user?.user?.id || 1,
                resList: responseList,
            }

            const reg = await fetch('/api/file', {
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json; charset=utf-8',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            })

            if (!reg.ok) {
                let body = ''
                try {
                    const data = await reg.json()
                    body = data?.message || data?.error || JSON.stringify(data)
                } catch (jsonErr) {
                    body = await reg.text().catch(() => '')
                }
                console.error('[PhotoPage] Error en /api/file, body:', body)
                return
            }

            const final = await reg.json().catch(() => null)
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
                    try { calculatePrice(merged) } catch (e) { }
                }
                return merged
            })
            try { if (typeof window !== 'undefined') showToast('Archivo subido y registrado', { type: 'success' }) } catch (e) { }
        } catch (err) {
            console.error('[PhotoPage] Error al crear y guardar PDF', err)
        }
        finally {
            try { setUploadLoading(false) } catch (e) { }
        }
    }

    useEffect(() => {
        return () => {
            if (generatedPdfUrl) {
                try { URL.revokeObjectURL(generatedPdfUrl) } catch (e) { }
            }
        }
    }, [generatedPdfUrl])

    const previewFileUrl = useMemo(() => {
        const type = lastUpload?.type || lastUpload?.service
        let hash = lastUpload?.filehash || lastUpload?.storedName
        if (!type || !hash || type === 'undefined' || hash === 'undefined') return null
        if (hash.endsWith('.pdf')) hash = hash.slice(0, -4)
        return `/api/pdf-cache?hash=${encodeURIComponent(hash)}&type=${encodeURIComponent(type)}`
    }, [lastUpload])

    useEffect(() => {
        setPageNumber(1)
        setNumPages(null)
    }, [generatedPdfUrl, previewFileUrl])

    const fmt = (v) => {
        try {
            if (v === null || typeof v === 'undefined') return '—'
            return `$ ${Number(v).toFixed(2)}`
        } catch (e) { return '—' }
    }

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
        const ppaper = overrides.photoPaper ?? photoPaper

        const mapPaper = { pb: 'brillante', pm: 'mate', ps: 'satinado' }

        const filenames = filesPayload.map((f) => f.filename)
        const payload = {
            filename: filenames.length > 1 ? filenames : filenames[0],
            service: filesPayload[0]?.service || 'file',
            colorModes: pt === 'color' ? 'color' : 'bw',
            type: 'photo',
            paperType: mapPaper[ppaper] || 'brillante',
        }

        setPriceLoading(true)
        try {
            const headers = { 'Content-Type': 'application/json' }
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}')
                if (user?.token) headers.Authorization = `Bearer ${user.token}`
            } catch (e) { }

            const res = await fetch('/api/printing-price', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                let msg = `Error ${res.status}`
                try {
                    const body = await res.json().catch(() => null)
                    msg = body?.message || body?.error || msg
                } catch (e) { }
                showError(msg)
                setPriceData(null)
                return
            }

            const data = await res.json().catch(() => null)
            setPriceData(normalizePriceData(data))
        } catch (err) {
            console.error('[PhotoPage] Error al calcular precio', err)
            showError(err?.message || 'Error calculando precio')
            setPriceData(null)
        } finally {
            setPriceLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [printType, photoPaper, showToast])

    useEffect(() => {
        if (!uploads.length) return
        const t = setTimeout(() => calculatePrice(uploads), 250)
        return () => clearTimeout(t)
    }, [uploads, calculatePrice])

    function handlePayResult(result) {
        try {
            setPaymentOpen(false)
            console.log('[PhotoPage] resultado de pago', result)
            const m = result?.method || 'unknown'
            const a = result?.amount ?? (priceData?.totalPrice ?? 0)
            showToast(`Pago recibido: ${m} — $ ${a}`, { type: 'success' })
        } catch (e) {
            console.error('[PhotoPage] Error inesperado:', e)
        }
    }

    return (
        <section className='text-center'>
            <style jsx>{`
                /* Use :global so styled-jsx doesn't scope pseudo-element selectors */
                :global(input.no-spin::-webkit-outer-spin-button),
                :global(input.no-spin::-webkit-inner-spin-button) {
                    -webkit-appearance: none;
                    margin: 0;
                }
                :global(input.no-spin) {
                    -moz-appearance: textfield;
                    -webkit-appearance: none;
                    appearance: textfield;
                }
                /* also cover explicit type selector for broader compatibility */
                :global(input[type='number'].no-spin)::-webkit-outer-spin-button,
                :global(input[type='number'].no-spin)::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
            `}</style>
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
                    <div className='top-0 w-full h-[80%] z-[1]'>
                        <Image
                            src='/images/bg-services-photo.png'
                            alt='bg'
                            className='w-full h-full object-cover'
                            width={1055}
                            height={1562}
                            loading='eager' />
                    </div>
                    <div className='w-full h-[100%] bg-white z-[2] flex justify-center items-center end-0'>
                        <div className='absolute flex flex-col items-center top-[23%] w-[85%]'>
                            <form className='flex flex-col items-center w-full bg-white rounded-xl p-6 shadow-lg inset-shadow-sm inset-shadow-gray-500'>
                                <div className='flex flex-col items-center justify-center w-full text-black'>
                                    <div className='font-bold text-4xl pb-5 italic'>Impresion de Fotografia</div>
                                    <div className='p-2'>
                                        <div className='relative h-[150px]'>
                                            {localPreview ? (
                                                <Image src={localPreview} alt='preview' className='w-full h-full object-cover rounded' width={200} height={200} loading='eager' />
                                            ) : (
                                                <Image src='/images/tm-image.png'
                                                    alt='bg'
                                                    className='w-full h-full object-cover rounded'
                                                    width={200}
                                                    height={200}
                                                    loading='eager' />
                                            )}
                                            <div className='absolute inset-0 flex items-center justify-center text-white text-sm font-medium'>
                                                <button type='button' onClick={openCropOrUpload} className='bg-[#D9D9D9C9] p-2 rounded-full text-black font-bold cursor-pointer'>Ajustar tamaño</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='p-2 flex flex-col items-center justify-center'>
                                        <label htmlFor='file-upload' className={`text-white text-bold text-center text-lg p-2 px-5 rounded-xl bg-[#007BFF] flex gap-[10px] justify-center items-center ${uploadLoading || priceLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
                                            <div className='start-0 pointer-events-none'>
                                                <span className='items-center text-2xl h-full text-black'>
                                                    <span className='fi fi-br-document'></span>
                                                </span>
                                            </div>
                                            <span className='px-5'>Subir imagen</span>
                                            <div className='end-0 pointer-events-none'>
                                                <span className='items-center text-2xl h-full text-black'>
                                                    <span className='fi fi-br-upload'></span>
                                                </span>
                                            </div>
                                        </label>
                                        <input id='file-upload' type='file' multiple accept='image/*' className='hidden' onChange={handleFileChange} />
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
                                                            onClick={() => {
                                                                setSelectedUploadIndex(idx)
                                                                setLastUpload(u)
                                                                setPageNumber(1)
                                                            }}
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
                                <div className='w-[80%] p-2 text-black grid grid-cols-[repeat(3,1fr)] grid-rows-[1fr] gap-y-[10px]'>
                                    <div className='w-full p-2'>
                                        <div className='w-full text-left py-1'>
                                            <span>Tipo de impresion</span>
                                        </div>
                                        <div className='w-full flex gap-[24px] flex-col justify-between'>
                                            <div className='flex items-center ps-4 w-full rounded-xl border border-gray-400 mb-2'>
                                                <input id='br1' type='radio' value='blanco_negro' name='br' className='w-5 h-5' checked={printType === 'blanco_negro'} onChange={() => { setPrintType('blanco_negro'); if (localPreview) { if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current); genTimeoutRef.current = setTimeout(() => createAndStorePdf(), 600) } else if (uploads.length) calculatePrice(uploads, { printType: 'blanco_negro' }) }} />
                                                <label htmlFor='br1' className='w-full py-2 text-left pl-4'>Impresion Blanco y Negro</label>
                                            </div>
                                            <div className='flex items-center ps-4 w-full rounded-xl border border-gray-400 mb-2'>
                                                <input id='br2' type='radio' value='color' name='br' className='w-5 h-5' checked={printType === 'color'} onChange={() => { setPrintType('color'); if (localPreview) { if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current); genTimeoutRef.current = setTimeout(() => createAndStorePdf(), 600) } else if (uploads.length) calculatePrice(uploads, { printType: 'color' }) }} />
                                                <label htmlFor='br2' className='w-full py-2 text-left pl-4'>Impresion a Color</label>
                                            </div>
                                        </div>
                                        <div className='w-full text-left py-1'>
                                            <span>Tamaño</span>
                                        </div>
                                        <div className='w-full flex flex-col items-center content-stretch justify-center'>
                                            <select id='paper' name='paper' value={paperSize} onChange={(e) => { const v = e.target.value; setPaperSize(v); if (localPreview) { if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current); genTimeoutRef.current = setTimeout(() => createAndStorePdf({ paperSize: v }), 600) } else if (uploads.length) calculatePrice(uploads, { paperSize: v }) }} className='w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500'>
                                                <option value='ti'>Tamaño infantil (2.5x3cm)</option>
                                                <option value='tc'>Tamaño carnet (4x4cm)</option>
                                                <option value='tap'>Tamaño album pequeño (9x13cm)</option>
                                            </select>
                                        </div>
                                        <div className='w-full text-left py-1'>
                                            <span>Tipo de papel</span>
                                        </div>
                                        <div className='w-full flex flex-col items-center content-stretch justify-center'>
                                            <select id='bound' name='bound' value={photoPaper} onChange={(e) => { const v = e.target.value; setPhotoPaper(v); if (localPreview) { if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current); genTimeoutRef.current = setTimeout(() => createAndStorePdf(), 600) } else if (uploads.length) calculatePrice(uploads, { photoPaper: v }) }} className='w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500'>
                                                <option value='pb'>Papel brillante</option>
                                                <option value='pm'>Papel mate</option>
                                                <option value='ps'>Papel satinado</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className='w-full p-2'>
                                        <div className='w-full text-left py-1'>
                                            <span>Cantidad de fotos</span>
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
                                                        if (localPreview) {
                                                            if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current)
                                                            genTimeoutRef.current = setTimeout(() => createAndStorePdf({ quantity: nv }), 600)
                                                        } else if (uploads.length) calculatePrice(uploads, { quantity: nv })
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
                                                            if (localPreview) {
                                                                if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current)
                                                                genTimeoutRef.current = setTimeout(() => createAndStorePdf({ quantity: nv }), 600)
                                                            } else if (uploads.length) calculatePrice(uploads, { quantity: nv })
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
                                                            if (localPreview) {
                                                                if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current)
                                                                genTimeoutRef.current = setTimeout(() => createAndStorePdf({ quantity: nv }), 600)
                                                            } else if (uploads.length) calculatePrice(uploads, { quantity: nv })
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
                                            <span>Precios de fotografia</span>
                                        </div>
                                        <div className='bg-[#BABABA47] w-full rounded-lg'>
                                            <div className='w-full flex flex-col content-stretch p-1 pl-3'>
                                                {priceData ? (
                                                    (() => {
                                                        const breakdown = priceData.breakdownPerSet || priceData.breakdownTotal || {}
                                                        const paperTypeLabel = breakdown.photoPaperType || (photoPaper === 'pb' ? 'brillante' : photoPaper === 'pm' ? 'mate' : 'satinado')
                                                        const photoPaperCost = typeof breakdown.photoPaperCost === 'number' ? breakdown.photoPaperCost : null
                                                        const inkCost = typeof breakdown.inkCost === 'number' ? breakdown.inkCost : null
                                                        const perSet = typeof priceData.pricePerSet === 'number' ? priceData.pricePerSet : null
                                                        const total = typeof priceData.totalPrice === 'number' ? priceData.totalPrice : (perSet !== null ? perSet : null)
                                                        return (
                                                            <>
                                                                <label className='w-full py-2 text-sm text-left text-[#3C3C3C] font-bold'>Concepto</label>
                                                                <div className='text-sm text-left py-1'>Tipo papel ({paperTypeLabel}): <strong>{photoPaperCost !== null ? fmt(photoPaperCost) : '—'}</strong></div>
                                                                <div className='text-sm text-left py-1'>Tinta: <strong>{inkCost !== null ? fmt(inkCost) : '—'}</strong></div>
                                                                <div className='text-sm text-left py-1'>Precio por set: <strong>{perSet !== null ? fmt(perSet) : '—'}</strong></div>
                                                                <div className='text-sm text-left py-1'>Precio total impresión: <strong>{total !== null ? fmt(total) : '—'}</strong></div>
                                                            </>
                                                        )
                                                    })()
                                                ) : (
                                                    <>
                                                        <span className='text-sm text-left py-2'>Tamaño infantil: <label id='til'></label></span>
                                                        <span className='text-sm text-left py-2'>Tamaño carnet: <label id='tcl'></label></span>
                                                        <span className='text-sm text-left py-2'>Tamaño album pequeño: <label id='tapl'></label></span>
                                                    </>
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
                                    <button onClick={() => { handleGeneratePdf() }} type='button' className='text-black text-sm px-10 p-1 rounded-full bg-[#FFC107] cursor-pointer'>Vista Previa</button>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            if (priceLoading) return
                                            if (!priceData) return (showError('Calcula el precio primero'), null)
                                            console.log('[PhotoPage] abriendo modal de pago, priceData:', priceData ? { totalPrice: priceData.totalPrice } : null)
                                            setPaymentOpen(true)
                                        }}
                                        className='text-black text-sm px-10 p-1 rounded-full bg-gradient-to-r from-[#7BCE6D] to-[#A8D860] cursor-pointer'
                                    >Aceptar</button>
                                </div>
                                <div className='margin-[-50px] bg-transparent'></div>
                            </form>
                            {previewMounted && (
                                <div onClick={() => setPreviewOpen(false)} className={`fixed inset-0 z-[50] flex items-center justify-center bg-black/50 transition-opacity duration-${ANIM_DURATION} ${previewVisible ? 'opacity-100' : 'opacity-0'}`}>
                                    <div onClick={(e) => e.stopPropagation()} className={`bg-white rounded-xl w-[60vw] h-[90vh] p-6 overflow-auto transform transition-all duration-${ANIM_DURATION} ${previewVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}`}>
                                        <div className='flex justify-between items-center'>
                                            <h3 className='text-lg text-black font-semibold'>Vista previa</h3>
                                            <button onClick={() => setPreviewOpen(false)} className='text-gray-600 cursor-pointer'>Cerrar</button>
                                        </div>
                                        <div className='mt-2'>
                                            {(() => {
                                                const effectivePreviewUrl = generatedPdfUrl || previewFileUrl
                                                if (effectivePreviewUrl) {
                                                    return (
                                                        <div className='mt-3 space-y-3'>
                                                            <div className='border rounded overflow-scroll overflow-x-hidden flex justify-center bg-gray-50 h-[64vh]'>
                                                                <Document
                                                                    file={effectivePreviewUrl}
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
                                                    )
                                                }

                                                if (lastUpload) {
                                                    return lastUpload.url ? <div className='mt-2'><a className='text-blue-600 hover:underline' href={lastUpload.url} target='_blank' rel='noreferrer'>Abrir archivo</a></div> : <p className='text-sm text-gray-600'>No hay datos de previsualización.</p>
                                                }
                                                return <p className='text-sm text-gray-600'>No hay datos de previsualización.</p>
                                            })()}
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
                                    </div>
                                </div>
                            )}

                            {cropOpen && (
                                <div onClick={closeCrop} className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/60`}>
                                    <div onClick={(e) => e.stopPropagation()} className='bg-white rounded-xl w-[80vw] max-w-3xl p-4'>
                                        <div className='flex justify-between items-center mb-3'>
                                            <h3 className='text-lg font-semibold text-black'>Recortar imagen</h3>
                                            <div className='flex gap-2'>
                                                <button onClick={closeCrop} className='px-3 py-1 rounded bg-gray-200'>Cancelar</button>
                                                <button onClick={applyCrop} className='px-3 py-1 rounded bg-blue-600 text-white'>Aplicar</button>
                                            </div>
                                        </div>
                                        <div className='relative h-[60vh]'>
                                            <Cropper
                                                image={localPreview}
                                                crop={crop}
                                                zoom={zoom}
                                                rotation={rotation}
                                                aspect={aspect}
                                                onCropChange={setCrop}
                                                onZoomChange={setZoom}
                                                onRotationChange={setRotation}
                                                onCropComplete={onCropComplete}
                                            />
                                        </div>
                                        <div className='mt-3 flex items-center gap-3'>
                                            <label className='text-sm text-black'>Zoom</label>
                                            <input type='range' min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
                                            <label className='text-sm text-black'>{zoom}</label>
                                        </div>
                                        <div className='mt-3 flex items-center gap-3'>
                                            <label className='text-sm text-black'>Rotación</label>
                                            <input type='range' min={0} max={360} step={1} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
                                            <label className='text-sm text-black'>{rotation}°</label>
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
                                context={{ lastUpload, uploads, printType, paperSize, rangeValue, bothSides, quantity: 1, priceData, deliveryDate, observations, photoPaper }}
                                onPay={(res) => handlePayResult(res)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
} 