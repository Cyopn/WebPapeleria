'use client'
import Image from 'next/image'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import Cropper from 'react-easy-crop'
import { useToast } from '@/context/toast_context'
import setupPdfWorker from '@/lib/setup_pdf_worker'

export default function PhotoPage() {
    const [lastUpload, setLastUpload] = useState(null)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewMounted, setPreviewMounted] = useState(false)
    const [previewVisible, setPreviewVisible] = useState(false)
    const [quantity, setQuantity] = useState(1)
    const [localPreview, setLocalPreview] = useState(null)
    const [cropOpen, setCropOpen] = useState(false)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const [paperSize, setPaperSize] = useState('ti')
    const [printType, setPrintType] = useState('blanco_negro')
    const [photoPaper, setPhotoPaper] = useState('pb')
    const [priceData, setPriceData] = useState(null)
    const [priceLoading, setPriceLoading] = useState(false)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null)
    const [numPages, setNumPages] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const { showToast } = useToast();

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
        const file = e.target.files?.[0]
        if (!file) return

        try {
            try { if (localPreview) URL.revokeObjectURL(localPreview) } catch (e) { }
            const url = URL.createObjectURL(file)
            setLocalPreview(url)
        } catch (err) {
            console.error('preview error', err)
            showError('No se pudo generar la vista previa')
        }
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
            console.error('crop error', err)
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
                    console.error('pdf-cache fetch error', res.status, txt)
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
                console.error('server pdf error', errText)
                return showError('Error del servidor al generar el PDF')
            }

            const pdfBlob = await res.blob()
            const url = URL.createObjectURL(pdfBlob)
            try { if (generatedPdfUrl) URL.revokeObjectURL(generatedPdfUrl) } catch (e) { }
            setGeneratedPdfUrl(url)
            setPreviewOpen(true)
        } catch (err) {
            console.error('generate pdf client error', err)
            showError('No se pudo generar el PDF')
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
                console.error('generate-pdf failed', gen.status, txt)
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
                let msg = `Upload proxy failed: ${upload.status} ${upload.statusText}`
                let body = ''
                try {
                    const data = await upload.json()
                    body = data?.message || data?.error || JSON.stringify(data)
                } catch (jsonErr) {
                    body = await upload.text().catch(() => '')
                }
                console.error('file-manager error body:', body)
                return
            }

            const response = (await upload.json())[0]

            const payload = {
                id_user: user?.user?.id_user || user?.user?.id || 1,
                filename: response.originalName,
                type: response.service,
                filehash: response.storedName,
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
                let msg = `/api/file failed: ${reg.status} ${reg.statusText}`
                let body = ''
                try {
                    const data = await reg.json()
                    body = data?.message || data?.error || JSON.stringify(data)
                } catch (jsonErr) {
                    body = await reg.text().catch(() => '')
                }
                console.error('/api/file error body:', body)
                return
            }

            const final = await reg.json().catch(() => null)
            const saved = final || payload
            setLastUpload(saved)
            try { if (typeof window !== 'undefined') showToast('Archivo subido y registrado', { type: 'success' }) } catch (e) { }
            try { calculatePrice(saved) } catch (e) { }
        } catch (err) {
            console.error('createAndStorePdf error', err)
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

    const calculatePrice = useCallback(async (uploadInfo, overrides = {}) => {
        if (!uploadInfo) return
        const filename = uploadInfo.filehash || uploadInfo.storedName || uploadInfo.filename
        if (!filename) return

        const pt = overrides.printType ?? printType
        const ppaper = overrides.photoPaper ?? photoPaper

        const mapPaper = { pb: 'brillante', pm: 'mate', ps: 'satinado' }

        const payload = {
            filename: filename,
            colorModes: pt === 'color' ? 'color' : 'bw',
            service: uploadInfo.type || uploadInfo.service || 'file',
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
            const normalized = {
                pricePerSet: data?.pricePerSet ?? null,
                totalPrice: data?.totalPrice ?? null,
                breakdownPerSet: data?.breakdownPerSet ?? null,
                breakdownTotal: data?.breakdownTotal ?? null,
                pages: data?.pages ?? null,
                sheets: data?.sheets ?? null,
                sets: data?.sets ?? null,
            }

            setPriceData(normalized)
        } catch (err) {
            console.error('calculatePrice error', err)
            showError(err?.message || 'Error calculando precio')
            setPriceData(null)
        } finally {
            setPriceLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [printType, photoPaper, showToast])

    useEffect(() => {
        if (!lastUpload) return
        const t = setTimeout(() => calculatePrice(lastUpload), 250)
        return () => clearTimeout(t)
    }, [lastUpload, calculatePrice])

    return (
        <section className="text-center">
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
                :global(input[type="number"].no-spin)::-webkit-outer-spin-button,
                :global(input[type="number"].no-spin)::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
            `}</style>
            {priceLoading && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                    <div className="bg-white p-6 rounded-lg flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full border-4 border-t-transparent border-gray-700 w-12 h-12"></div>
                        <div className="text-black">Calculando precio…</div>
                    </div>
                </div>
            )}
            {uploadLoading && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60">
                    <div className="bg-white p-6 rounded-lg flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full border-4 border-t-transparent border-gray-700 w-12 h-12"></div>
                        <div className="text-black">Subiendo archivo…</div>
                    </div>
                </div>
            )}
            <div className="absolute top-0 w-full h-full flex justify-center items-center">
                <div className="relative top-0 w-full h-full flex flex-col justify-center items-center">
                    <div className="top-0 w-full h-[80%] z-[1]">
                        <Image
                            src="/images/bg-services-photo.png"
                            alt="bg"
                            className="w-full h-full object-cover"
                            width={1055}
                            height={1562}
                            loading="eager" />
                    </div>
                    <div className="w-full h-[100%] bg-white z-[2] flex justify-center items-center end-0">
                        <div className="absolute flex flex-col items-center top-[23%] w-[85%]">
                            <form className="flex flex-col items-center w-full bg-white rounded-xl p-6 shadow-lg inset-shadow-sm inset-shadow-gray-500">
                                <div className="flex flex-col items-center justify-center w-full text-black">
                                    <div className="font-bold text-4xl pb-5 italic">Impresion de Fotografia</div>
                                    <div className="p-2">
                                        <div className="relative h-[150px]">
                                            {localPreview ? (
                                                <Image src={localPreview} alt="preview" className="w-full h-full object-cover rounded" width={200} height={200} loading="eager" />
                                            ) : (
                                                <Image src="/images/tm-image.png"
                                                    alt="bg"
                                                    className="w-full h-full object-cover rounded"
                                                    width={200}
                                                    height={200}
                                                    loading="eager" />
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                                                <button type="button" onClick={openCropOrUpload} className="bg-[#D9D9D9C9] p-2 rounded-full text-black font-bold cursor-pointer">Ajustar tamaño</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 flex flex-col items-center justify-center">
                                        <label htmlFor="file-upload" className={`text-white text-bold text-center text-lg p-2 px-5 rounded-xl bg-[#007BFF] flex gap-[10px] justify-center items-center ${uploadLoading || priceLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
                                            <div className="start-0 pointer-events-none">
                                                <span className="items-center text-2xl h-full text-black">
                                                    <span className="fi fi-br-document"></span>
                                                </span>
                                            </div>
                                            <span className="px-5">Subir imagen</span>
                                            <div className="end-0 pointer-events-none">
                                                <span className="items-center text-2xl h-full text-black">
                                                    <span className="fi fi-br-upload"></span>
                                                </span>
                                            </div>
                                        </label>
                                        <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </div>
                                </div>
                                <div className="w-[80%] p-2 text-black grid grid-cols-[repeat(3,1fr)] grid-rows-[1fr] gap-y-[10px]">
                                    <div className="w-full p-2">
                                        <div className="w-full text-left py-1">
                                            <span>Tipo de impresion</span>
                                        </div>
                                        <div className="w-full flex gap-[24px] flex-col justify-between">
                                            <div className="flex items-center ps-4 w-full rounded-xl border border-gray-400 mb-2">
                                                <input id="br1" type="radio" value="blanco_negro" name="br" className="w-5 h-5" checked={printType === 'blanco_negro'} onChange={() => { setPrintType('blanco_negro'); if (localPreview) { if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current); genTimeoutRef.current = setTimeout(() => createAndStorePdf(), 600) } else if (lastUpload) calculatePrice(lastUpload, { printType: 'blanco_negro' }) }} />
                                                <label htmlFor="br1" className="w-full py-2 text-left pl-4">Impresion Blanco y Negro</label>
                                            </div>
                                            <div className="flex items-center ps-4 w-full rounded-xl border border-gray-400 mb-2">
                                                <input id="br2" type="radio" value="color" name="br" className="w-5 h-5" checked={printType === 'color'} onChange={() => { setPrintType('color'); if (localPreview) { if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current); genTimeoutRef.current = setTimeout(() => createAndStorePdf(), 600) } else if (lastUpload) calculatePrice(lastUpload, { printType: 'color' }) }} />
                                                <label htmlFor="br2" className="w-full py-2 text-left pl-4">Impresion a Color</label>
                                            </div>
                                        </div>
                                        <div className="w-full text-left py-1">
                                            <span>Tamaño</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <select id="paper" name="paper" value={paperSize} onChange={(e) => { const v = e.target.value; setPaperSize(v); if (localPreview) { if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current); genTimeoutRef.current = setTimeout(() => createAndStorePdf({ paperSize: v }), 600) } else if (lastUpload) calculatePrice(lastUpload, { paperSize: v }) }} className="w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500">
                                                <option value="ti">Tamaño infantil (2.5x3cm)</option>
                                                <option value="tc">Tamaño carnet (4x4cm)</option>
                                                <option value="tap">Tamaño album pequeño (9x13cm)</option>
                                            </select>
                                        </div>
                                        <div className="w-full text-left py-1">
                                            <span>Tipo de papel</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <select id="bound" name="bound" value={photoPaper} onChange={(e) => { const v = e.target.value; setPhotoPaper(v); if (localPreview) { if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current); genTimeoutRef.current = setTimeout(() => createAndStorePdf(), 600) } else if (lastUpload) calculatePrice(lastUpload, { photoPaper: v }) }} className="w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500">
                                                <option value="pb">Papel brillante</option>
                                                <option value="pm">Papel mate</option>
                                                <option value="ps">Papel satinado</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="w-full p-2">
                                        <div className="w-full text-left py-1">
                                            <span>Cantidad de fotos</span>
                                        </div>
                                        <div className="w-full">
                                            <div className="relative">
                                                <input
                                                    id="quantity"
                                                    name="quantity"
                                                    type="number"
                                                    min={1}
                                                    value={quantity}
                                                    onChange={(e) => {
                                                        const v = parseInt(e.target.value || '1', 10)
                                                        const nv = isNaN(v) ? 1 : Math.max(1, v)
                                                        setQuantity(nv)
                                                        if (localPreview) {
                                                            if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current)
                                                            genTimeoutRef.current = setTimeout(() => createAndStorePdf({ quantity: nv }), 600)
                                                        } else if (lastUpload) calculatePrice(lastUpload, { quantity: nv })
                                                    }}
                                                    className="w-full border rounded-lg block p-2.5 pl-4 pr-12 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500 no-spin"
                                                />
                                                <label htmlFor="quantity" className="absolute right-12 top-1/2 -translate-y-1/2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            const nv = Math.max(1, quantity - 1)
                                                            setQuantity(nv)
                                                            if (localPreview) {
                                                                if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current)
                                                                genTimeoutRef.current = setTimeout(() => createAndStorePdf({ quantity: nv }), 600)
                                                            } else if (lastUpload) calculatePrice(lastUpload, { quantity: nv })
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-lg font-bold cursor-pointer"
                                                        aria-label="Disminuir cantidad"
                                                    >
                                                        −
                                                    </button>
                                                </label>
                                                <label htmlFor="quantity" className="absolute right-2 top-1/2 -translate-y-1/2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            const nv = quantity + 1
                                                            setQuantity(nv)
                                                            if (localPreview) {
                                                                if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current)
                                                                genTimeoutRef.current = setTimeout(() => createAndStorePdf({ quantity: nv }), 600)
                                                            } else if (lastUpload) calculatePrice(lastUpload, { quantity: nv })
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-lg font-bold cursor-pointer"
                                                        aria-label="Aumentar cantidad"
                                                    >
                                                        +
                                                    </button>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full p-2">
                                        <div className="w-full text-left">
                                            <span>Precios de fotografia</span>
                                        </div>
                                        <div className="bg-[#BABABA47] w-full rounded-lg">
                                            <div className="w-full flex flex-col content-stretch p-1 pl-3">
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
                                                                <label className="w-full py-2 text-sm text-left text-[#3C3C3C] font-bold">Concepto</label>
                                                                <div className="text-sm text-left py-1">Tipo papel ({paperTypeLabel}): <strong>{photoPaperCost !== null ? fmt(photoPaperCost) : '—'}</strong></div>
                                                                <div className="text-sm text-left py-1">Tinta: <strong>{inkCost !== null ? fmt(inkCost) : '—'}</strong></div>
                                                                <div className="text-sm text-left py-1">Precio por set: <strong>{perSet !== null ? fmt(perSet) : '—'}</strong></div>
                                                                <div className="text-sm text-left py-1">Precio total impresión: <strong>{total !== null ? fmt(total) : '—'}</strong></div>
                                                            </>
                                                        )
                                                    })()
                                                ) : (
                                                    <>
                                                        <span className="text-sm text-left py-2">Tamaño infantil: <label id="til"></label></span>
                                                        <span className="text-sm text-left py-2">Tamaño carnet: <label id="tcl"></label></span>
                                                        <span className="text-sm text-left py-2">Tamaño album pequeño: <label id="tapl"></label></span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-full text-left py-1">
                                            <span>Precio total</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <div className="flex items-center w-full rounded-xl bg-[#77ADFF52] border border-[#77ADFFBD] mb-2">
                                                <label className="w-full py-2 text-center">{priceData ? fmt(priceData.totalPrice ?? priceData.pricePerSet) : '$ 0'}</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full gap-5 flex flex-row justify-end content-end items-end">
                                    <button onClick={() => { handleGeneratePdf() }} type="button" className="text-black text-sm px-10 p-1 rounded-full bg-[#FFC107] cursor-pointer">Vista Previa</button>
                                    <button type="button" className="text-black text-sm px-10 p-1 rounded-full bg-gradient-to-r from-[#7BCE6D] to-[#A8D860] cursor-pointer">Aceptar</button>
                                </div>
                                <div className="margin-[-50px] bg-transparent"></div>
                            </form>
                            {previewMounted && (
                                <div onClick={() => setPreviewOpen(false)} className={`fixed inset-0 z-[50] flex items-center justify-center bg-black/50 transition-opacity duration-${ANIM_DURATION} ${previewVisible ? 'opacity-100' : 'opacity-0'}`}>
                                    <div onClick={(e) => e.stopPropagation()} className={`bg-white mt-[104px] rounded-xl max-w-[60vw] w-full p-6 overflow-auto transform transition-all duration-${ANIM_DURATION} ${previewVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}`} style={{ maxHeight: '80vh' }}>
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg text-black font-semibold">Vista previa</h3>
                                            <button onClick={() => setPreviewOpen(false)} className="text-gray-600 cursor-pointer">Cerrar</button>
                                        </div>
                                        <div className="mt-4">
                                            {(() => {
                                                const effectivePreviewUrl = generatedPdfUrl || previewFileUrl
                                                if (effectivePreviewUrl) {
                                                    return (
                                                        <div className="mt-3 space-y-3">
                                                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                                                <button
                                                                    type="button"
                                                                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 cursor-pointer"
                                                                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                                                                    disabled={pageNumber <= 1}
                                                                >
                                                                    Anterior
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 cursor-pointer"
                                                                    onClick={() => setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p + 1))}
                                                                    disabled={numPages ? pageNumber >= numPages : false}
                                                                >
                                                                    Siguiente
                                                                </button>
                                                                <span>Página {pageNumber}{numPages ? ` de ${numPages}` : ''}</span>
                                                            </div>
                                                            <div className="border rounded overflow-hidden flex justify-center bg-gray-50">
                                                                <Document
                                                                    file={effectivePreviewUrl}
                                                                    onLoadSuccess={({ numPages: n }) => {
                                                                        setNumPages(n)
                                                                        setPageNumber((p) => (p > n ? n : p))
                                                                    }}
                                                                    onLoadError={(e) => showError(`No se pudo cargar el PDF: ${e.message || e}`)}
                                                                    loading={<div className="p-4 text-gray-600">Cargando PDF…</div>}
                                                                >
                                                                    <Page pageNumber={pageNumber} width={800} renderAnnotationLayer={false} renderTextLayer={false} />
                                                                </Document>
                                                            </div>
                                                        </div>
                                                    )
                                                }

                                                if (lastUpload) {
                                                    return lastUpload.url ? <div className="mt-2"><a className="text-blue-600 hover:underline" href={lastUpload.url} target="_blank" rel="noreferrer">Abrir archivo</a></div> : <p className="text-sm text-gray-600">No hay datos de previsualización.</p>
                                                }

                                                return <p className="text-sm text-gray-600">No hay datos de previsualización.</p>
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {cropOpen && (
                                <div onClick={closeCrop} className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/60`}>
                                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl w-[80vw] max-w-3xl p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-lg font-semibold">Recortar imagen</h3>
                                            <div className="flex gap-2">
                                                <button onClick={closeCrop} className="px-3 py-1 rounded bg-gray-200">Cancelar</button>
                                                <button onClick={applyCrop} className="px-3 py-1 rounded bg-blue-600 text-white">Aplicar</button>
                                            </div>
                                        </div>
                                        <div className="relative h-[60vh]">
                                            <Cropper
                                                image={localPreview}
                                                crop={crop}
                                                zoom={zoom}
                                                aspect={aspect}
                                                onCropChange={setCrop}
                                                onZoomChange={setZoom}
                                                onCropComplete={onCropComplete}
                                            />
                                        </div>
                                        <div className="mt-3 flex items-center gap-3">
                                            <label className="text-sm">Zoom</label>
                                            <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="py-4"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
} 