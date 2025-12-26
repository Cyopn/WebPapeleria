'use client'
import Image from 'next/image'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Document, Page } from 'react-pdf'
import setupPdfWorker from '@/lib/setup_pdf_worker'
import { useToast } from '@/context/toast_context'

export default function PrintPage() {
    const [rangeValue, setRangeValue] = useState('');
    const [br3Selected, setBr3Selected] = useState(true);
    const [lastUpload, setLastUpload] = useState(null)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewMounted, setPreviewMounted] = useState(false)
    const [previewVisible, setPreviewVisible] = useState(false)
    const [numPages, setNumPages] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const { showToast } = useToast()
    const previewLockRef = useRef(false)
    const ANIM_DURATION = 200
    const [quantity, setQuantity] = useState(1)
    const [printType, setPrintType] = useState('blanco_negro')
    const [paperSize, setPaperSize] = useState('carta')
    const [bothSides, setBothSides] = useState(false)
    const [priceData, setPriceData] = useState(null)
    const [priceLoading, setPriceLoading] = useState(false)
    const [uploadLoading, setUploadLoading] = useState(false)

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
    async function handleFileChange(e) {
        e.preventDefault();
        const file = e.target.files[0]
        if (file) {
            setUploadLoading(true)
            const user = JSON.parse(localStorage.getItem("user")) || {}
            const token = user?.token
            const fd = new FormData();
            fd.append("files", file);
            fd.append("username", user?.user?.username || '');

            try {
                const res = await fetch('/api/file-manager', {
                    method: 'POST',
                    headers: { "Accept": "*/*", ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
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
                    console.error('file-manager error body:', body)
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
                        "Accept": "*/*",
                        "Content-Type": "application/json; charset=utf-8",
                        ...(token ? { "Authorization": `Bearer ${token}` } : {})
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
                    console.error('/api/file error body:', body)
                    showToast(msg, { type: 'error' })
                    throw new Error(msg)
                }

                const final = await res2.json().catch(() => null)
                console.log('File registered', final)
                const saved = final || payload
                setLastUpload(saved)
                try {
                    calculatePrice(saved)
                } catch (err) { }
                showToast('Archivo subido correctamente', { type: 'success' })
            } catch (err) {
                const msg = err?.message || String(err) || 'Error desconocido'
                console.error(err)
                try { showToast(msg, { type: 'error' }) } catch (e) { }
            } finally {
                try { setUploadLoading(false) } catch (e) { }
            }
        }
    }

    const previewFileUrl = useMemo(() => {
        const { filehash: hash, type } = lastUpload || {}
        if (!type || !hash || type === 'undefined' || hash === 'undefined') return null
        let hashValue = hash
        if (hashValue.endsWith('.pdf')) {
            hashValue = hashValue.slice(0, -4)
        }
        return `/api/pdf-cache?hash=${encodeURIComponent(hashValue)}&type=${encodeURIComponent(type)}`
    }, [lastUpload])

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

        const payload = {
            filename: filename,
            colorModes: pt === 'color' ? 'color' : 'bw',
            paperSizes: ps || 'carta',
            ranges: br3 ? 'all' : (rv || 'all'),
            bothSides: !!bs,
            service: uploadInfo.type || uploadInfo.service || 'file',
            sets: Number(qty || 1),
        }
        try {
            setPriceLoading(true)
            let headers = { 'Content-Type': 'application/json' }
            try {
                const user = JSON.parse(localStorage.getItem('user')) || {}
                const token = user?.token
                if (token) headers = { ...headers, Accept: '*/*', Authorization: `Bearer ${token}` }
            } catch (e) {
            }

            const res = await fetch('/api/printing-price', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                const msg = data?.error || data?.message || `Error calculando precio: ${res.status}`
                showToast(msg, { type: 'error' })
                setPriceData(null)
                return
            }
            setPriceData(data)
        } catch (err) {
            console.error('calculatePrice error', err)
            showToast(err?.message || 'Error calculando precio', { type: 'error' })
            setPriceData(null)
        } finally {
            try { setPriceLoading(false) } catch (e) { }
        }
    }, [printType, paperSize, br3Selected, rangeValue, bothSides, quantity, showToast])

    useEffect(() => {
        if (!lastUpload) return
        const t = setTimeout(() => calculatePrice(lastUpload), 250)
        return () => clearTimeout(t)
    }, [lastUpload, calculatePrice])


    return (
        <section className="text-center">
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
                    <div className="top-0 w-full h-[50%] z-[1]">
                        <div className="flex pt-[100px] flex-row justify-end items-center content-end absolute top-0 z-[3] w-full h-[50%]">
                            <div className="w-full flex justify-center">
                                <div className="text-black font-bold text-4xl px-5 p-3 rounded-full bg-[#FFFFFF9E]">
                                    <span className="px-10">Impresiones</span>
                                </div>
                            </div>
                        </div>
                        <Image
                            src="/images/bg-print.png"
                            alt="bg"
                            className="h-full w-full object-cover"
                            width={2048}
                            height={1231}
                            loading="eager" />
                    </div>
                    <div className="w-full h-[100%] bg-white z-[2] flex justify-center items-center end-0">
                        <div className="absolute flex flex-col items-center top-[43%] w-[70%]">
                            <form className="flex flex-col items-center w-full bg-white rounded-xl p-6 shadow-lg inset-shadow-sm inset-shadow-gray-500">
                                <div className="flex flex-col items-center justify-center w-full text-black">
                                    <div className="">
                                        <label htmlFor="file-upload" className="text-white text-bold text-center text-lg p-2 px-5 rounded-xl bg-[#007BFF] cursor-pointer flex gap-[10px] justify-center items-center">
                                            <div className="start-0 pointer-events-none">
                                                <span className="items-center text-2xl h-full text-black">
                                                    <span className="fi fi-br-document"></span>
                                                </span>
                                            </div>
                                            <span className="px-5">Subir archivo</span>
                                            <div className="end-0 pointer-events-none">
                                                <span className="items-center text-2xl h-full text-black">
                                                    <span className="fi fi-br-upload"></span>
                                                </span>
                                            </div>
                                        </label>
                                        <input id="file-upload" type="file" onChange={handleFileChange} className="hidden" disabled={uploadLoading} />
                                    </div>
                                </div>
                                <div className="w-[60%] p-2 text-black grid grid-cols-[70%_30%] grid-rows-[repeat(1,1fr)]">
                                    <div className="w-full p-2">
                                        <div className="w-full text-left py-1">
                                            <span>Tipo de impresion</span>
                                        </div>
                                        <div className="w-full flex gap-[24px] flex-col justify-between">
                                            <div className="flex items-center ps-4 w-full rounded-xl border border-gray-400 mb-2">
                                                <input id="br1" type="radio" value="blanco_negro" name="br" className="w-5 h-5" checked={printType === 'blanco_negro'} onChange={() => { const v = 'blanco_negro'; setPrintType(v); if (lastUpload) calculatePrice(lastUpload, { printType: v }); }} />
                                                <label htmlFor="br1" className="w-full py-2 text-left pl-4">Impresion Blanco y Negro</label>
                                            </div>
                                            <div className="flex items-center ps-4 w-full rounded-xl border border-gray-400 mb-2">
                                                <input id="br2" type="radio" value="color" name="br" className="w-5 h-5" checked={printType === 'color'} onChange={() => { const v = 'color'; setPrintType(v); if (lastUpload) calculatePrice(lastUpload, { printType: v }); }} />
                                                <label htmlFor="br2" className="w-full py-2 text-left pl-4">Impresion a Color</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full flex flex-col p-2">
                                        <div className="w-full text-left py-1">
                                            <span>Total de hojas</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <div className="flex items-center w-full rounded-xl border border-gray-400 mb-2">
                                                <label className="w-full py-2 text-center">{priceData ? `${priceData.sheets || 0}` : '—'}</label>
                                            </div>
                                        </div>
                                        <div className="w-full text-left">
                                            <span>Cantidad de juegos</span>
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
                                                        if (lastUpload) calculatePrice(lastUpload, { quantity: nv })
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
                                                            if (lastUpload) calculatePrice(lastUpload, { quantity: nv })
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
                                                            if (lastUpload) calculatePrice(lastUpload, { quantity: nv })
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
                                    <div className="w-full px-2 pb-2">
                                        <div className="w-full text-left py-1">
                                            <span>Tamaño de hoja</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <select id="paper" name="paper" value={paperSize} onChange={(e) => { const v = e.target.value; setPaperSize(v); if (lastUpload) calculatePrice(lastUpload, { paperSize: v }); }} className="w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500">
                                                <option defaultValue={"def"} value="carta">Carta</option>
                                                <option value="oficio">Oficio</option>
                                            </select>
                                        </div>
                                        <div className="w-full text-left py-1">
                                            <span>Rango</span>
                                        </div>
                                        <div className="flex items-center ps-1 w-full mb-2">
                                            <input
                                                id="br3"
                                                type="radio"
                                                value="todas"
                                                name="br3"
                                                className="w-5 h-5"
                                                checked={br3Selected}
                                                onChange={() => {
                                                    const v = true
                                                    setBr3Selected(v);
                                                    setRangeValue('');
                                                    if (lastUpload) calculatePrice(lastUpload, { br3Selected: v, rangeValue: '' });
                                                }}
                                            />
                                            <label htmlFor="br3" className="w-full h-full  text-left pl-2">Todas</label>
                                        </div>
                                        <div className="w-full text-left">
                                            <span className="pr-3">Paginas</span>
                                            <input
                                                type="text"
                                                id="rangep"
                                                value={rangeValue}
                                                onChange={(e) => {
                                                    const v = e.target.value
                                                    setRangeValue(v);
                                                    if (br3Selected) setBr3Selected(false);
                                                    if (lastUpload) calculatePrice(lastUpload, { br3Selected: false, rangeValue: v });
                                                }}
                                                className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-3 py-1 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
                                                placeholder="1, 3-6"
                                            />
                                        </div>
                                    </div>
                                    <div className="w-full py-1 flex items-center content-stretch justify-center">
                                        <div className="bg-[#BABABA47] w-full rounded-lg">
                                            <div className="w-full flex flex-col content-stretch p-1 pl-3">
                                                <label className="w-full py-2 text-sm text-left">Precios</label>
                                                {priceData ? (
                                                    <>
                                                        <div className="text-sm text-left py-1">Precio por juego: <strong>{priceData.pricePerSet ?? '—'}</strong></div>
                                                        <div className="text-sm text-left py-1">Páginas: {priceData.pages ?? '—'}</div>
                                                        <div className="text-sm text-left py-1">Hojas: {priceData.sheets ?? '—'}</div>
                                                        <div className="text-sm text-left py-1">Juegos: {priceData.sets ?? quantity}</div>
                                                    </>
                                                ) : (
                                                    <div className="text-sm text-left py-2">Seleccione opciones o suba un archivo para calcular precio.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full px-2 pb-2">
                                        <div className="w-full text-left py-1">
                                            <span>Imprimir por:</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <select id="sides" name="sides" value={bothSides ? 'ac' : 'oc'} onChange={(e) => { const v = e.target.value === 'ac'; setBothSides(v); if (lastUpload) calculatePrice(lastUpload, { bothSides: v }); }} className="w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500">
                                                <option defaultValue={"def"} value="oc">Una cara</option>
                                                <option value="ac">Ambas caras</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="w-full px-2 pb-2">
                                        <div className="w-full text-left py-1">
                                            <span>Precio total</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <div className="flex items-center w-full rounded-xl border border-gray-400 mb-2">
                                                <label className="w-full py-2 text-center">{priceData ? (priceData.totalPrice ?? '—') : '0'}</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full gap-5 flex flex-row justify-end content-end items-end">
                                    <button onClick={() => {
                                        if (!lastUpload) { try { showToast('No hay archivo subido para previsualizar', { type: 'error' }) } catch (e) { }; return }
                                        if (!previewFileUrl) { try { showToast('Faltan datos del archivo para la vista previa', { type: 'error' }) } catch (e) { }; return }
                                        setPreviewOpen(true)
                                    }} type="button" className="text-black text-sm px-10 p-1 rounded-full bg-[#FFC107] cursor-pointer">Vista Previa</button>
                                    <button type="button" disabled={priceLoading} className={`text-black text-sm px-10 p-1 rounded-full bg-gradient-to-r from-[#7BCE6D] to-[#A8D860] ${priceLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>Aceptar</button>
                                </div>
                                <div className="margin-[-50px] bg-transparent"></div>
                            </form>
                            {previewMounted && (
                                <div onClick={() => setPreviewOpen(false)} className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-${ANIM_DURATION} ${previewVisible ? 'opacity-100' : 'opacity-0'}`}>
                                    <div onClick={(e) => e.stopPropagation()} className={`bg-white rounded-xl max-w-[60vw] w-full p-6 overflow-auto transform transition-all duration-${ANIM_DURATION} ${previewVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}`} style={{ maxHeight: '80vh' }}>
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg text-black font-semibold">Vista previa</h3>
                                            <button onClick={() => setPreviewOpen(false)} className="text-gray-600 cursor-pointer">Cerrar</button>
                                        </div>
                                        <div className="mt-4">
                                            {lastUpload ? (
                                                <div className="space-y-3">
                                                    <div className="text-sm text-gray-700">Nombre: <span className="font-medium">{lastUpload.filename || lastUpload.originalName || lastUpload.name}</span></div>
                                                    {previewFileUrl ? (
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
                                                                    file={previewFileUrl}
                                                                    onLoadSuccess={({ numPages: n }) => {
                                                                        setNumPages(n)
                                                                        setPageNumber((p) => (p > n ? n : p))
                                                                    }}
                                                                    onLoadError={(e) => { try { showToast(`No se pudo cargar el PDF: ${e.message || e}`, { type: 'error' }) } catch (err) { console.error(err) } }}
                                                                    loading={<div className="p-4 text-gray-600">Cargando PDF…</div>}
                                                                >
                                                                    <Page pageNumber={pageNumber} width={800} renderAnnotationLayer={false} renderTextLayer={false} />
                                                                </Document>
                                                            </div>
                                                        </div>
                                                    ) : lastUpload.url ? (
                                                        <div className="mt-2">
                                                            <a className="text-blue-600 hover:underline" href={lastUpload.url} target="_blank" rel="noreferrer">Abrir archivo</a>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-red-600">No hay datos suficientes para mostrar la vista previa.</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-600">No hay datos de previsualización.</p>
                                            )}
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