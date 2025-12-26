'use client'
import Image from 'next/image'
import { useEffect, useMemo, useState, useRef } from 'react'
import { Document, Page } from 'react-pdf'
import { useToast } from '@/context/toast_context'

export default function BoundPage() {
    const [rangeValue, setRangeValue] = useState('');
    const [br3Selected, setBr3Selected] = useState(false);
    const [lastUpload, setLastUpload] = useState(null)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewMounted, setPreviewMounted] = useState(false)
    const [previewVisible, setPreviewVisible] = useState(false)
    const [numPages, setNumPages] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const { showToast } = useToast()
    function showError(msg) { try { showToast(msg, { type: 'error' }) } catch (e) { } }
    const previewLockRef = useRef(false)
    const ANIM_DURATION = 200

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
                setLastUpload(final || payload)
                showToast('Archivo subido correctamente', { type: 'success' })
            } catch (err) {
                showError(err.message)
            }
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


    return (
        <section className="text-center">
            <div className="absolute top-0 w-full h-full flex justify-center items-center">
                <div className="relative top-0 w-full h-full flex flex-col justify-center items-center">
                    <div className="top-0 w-full h-[55%] z-[1]">
                        <div className="absolute left-0 w-[65%] z-[2] rounded-r-[300px] top-0 h-[55%] flex flex-col justify-center items-start font-bold text-5xl" style={{
                            background: 'linear-gradient(to bottom right, rgba(8, 114, 234,0.5) 0%, rgba(8, 114, 234,0.4) 66.666%, rgba(76, 184, 238,0.4) 66.666%, rgba(76, 184, 238,0.6) 100%)'
                        }}>
                            <span className="text-white px-20 italic">Encuadernado e impresion</span>
                        </div>
                        <Image
                            src="/images/bg-services-bound.png"
                            alt="bg"
                            className="w-full h-full object-cover"
                            width={479}
                            height={307}
                            loading="eager" />
                    </div>
                    <div className="w-full h-[100%] bg-white z-[2] flex justify-center items-center end-0">
                        <div className="absolute flex flex-col items-center top-[43%] w-[85%]">
                            <form className="flex flex-col items-center w-full bg-white rounded-xl p-6 shadow-lg inset-shadow-sm inset-shadow-gray-500">
                                <div className="flex flex-col items-center justify-center w-full text-black">
                                    <div>
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
                                        <input id="file-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                                    </div>
                                </div>
                                <div className="w-[80%] p-2 text-black grid grid-cols-[repeat(4,1fr)] grid-rows-[1fr] gap-y-[10px]">
                                    <div className="w-full p-2">
                                        <div className="w-full text-left py-1">
                                            <span>Tipo de impresion</span>
                                        </div>
                                        <div className="w-full flex gap-[24px] flex-col justify-between">
                                            <div className="flex items-center ps-4 w-full rounded-xl border border-gray-400 mb-2">
                                                <input id="br1" type="radio" value="blanco_negro" name="br" className="w-5 h-5" />
                                                <label htmlFor="br1" className="w-full py-2 text-left pl-4">Impresion Blanco y Negro</label>
                                            </div>
                                            <div className="flex items-center ps-4 w-full rounded-xl border border-gray-400 mb-2">
                                                <input id="br2" type="radio" value="color" name="br" className="w-5 h-5" />
                                                <label htmlFor="br2" className="w-full py-2 text-left pl-4">Impresion a Color</label>
                                            </div>
                                        </div>
                                        <div className="w-full px-2 pb-2">
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
                                                        setBr3Selected(true);
                                                        setRangeValue('');
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
                                                        setRangeValue(e.target.value);
                                                        if (br3Selected) setBr3Selected(false);
                                                    }}
                                                    className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-3 py-1 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
                                                    placeholder="1, 3-6"
                                                />
                                            </div>
                                            <div className="w-full text-left py-1">
                                                <span>Tamaño de hoja</span>
                                            </div>
                                            <div className="w-full flex flex-col items-center content-stretch justify-center">
                                                <select id="paper" name="paper" className="w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500">
                                                    <option defaultValue={"def"} value="carta">Carta</option>
                                                    <option value="oficio">Oficio</option>
                                                </select>
                                            </div>
                                            <div className="w-full text-left py-1">
                                                <span>Tipo de encuadernado</span>
                                            </div>
                                            <div className="w-full flex flex-col items-center content-stretch justify-center">
                                                <select id="bound" name="bound" className="w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500">
                                                    <option defaultValue={"def"} value="p_dura">Pasta dura</option>
                                                    <option value="p_blanda">Pasta blanda</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full p-2">
                                        <div className="w-full text-left py-1">
                                            <span>Imprimir por:</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <select id="paper" name="paper" className="w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500">
                                                <option defaultValue={"def"} value="oc">Una cara</option>
                                                <option value="ac">Ambas caras</option>
                                            </select>
                                        </div>
                                        <div className="w-full text-left py-1">
                                            <span>Color de cubierta</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <select id="paper" name="paper" className="w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500">
                                                <option defaultValue={"def"} value="oc">Una cara</option>
                                                <option value="ac">Ambas caras</option>
                                            </select>
                                        </div>
                                        <div className="w-full text-left py-1">
                                            <span>Total de hojas</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <div className="flex items-center w-full rounded-xl border border-gray-400 mb-2">
                                                <label className="w-full py-2 text-center">0</label>
                                            </div>
                                        </div>
                                        <div className="w-full text-left">
                                            <span>Cantidad de juegos</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <div className="flex items-center w-full rounded-xl border border-gray-400 mb-2">
                                                <label className="w-full py-2 text-center">0</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full p-2">
                                        <div className="w-full text-left">
                                            <span>Precios de encuadernado</span>
                                        </div>
                                        <div className="bg-[#BABABA47] w-full rounded-lg">
                                            <div className="w-full flex flex-col content-stretch p-1 pl-3">
                                                <span className="text-sm text-left py-2">Espiral plastico: <label id="ep"></label></span>
                                                <span className="text-sm text-left py-2">Encolada: <label id="en"></label></span>
                                                <span className="text-sm text-left py-2">Pasta blanda: <label id="pb"></label></span>
                                                <span className="text-sm text-left py-2">Pasta dura: <label id="pd"></label></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full p-2">
                                        <div className="w-full text-left">
                                            <span>Cálculo de precios</span>
                                        </div>
                                        <div className="bg-[#BABABA47] w-full rounded-lg">
                                            <div className="w-full flex flex-col content-stretch p-1 pl-3">
                                                <label className="w-full py-2 text-sm text-left text-[#3C3C3C] font-bold">Concepto</label>
                                            </div>
                                        </div>
                                        <div className="w-full text-left py-1">
                                            <span>Precio total</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <div className="flex items-center w-full rounded-xl bg-[#77ADFF52] border border-[#77ADFFBD] mb-2">
                                                <label className="w-full py-2 text-center">$ 0</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full gap-5 flex flex-row justify-end content-end items-end">
                                    <button onClick={() => {
                                        if (!lastUpload) return (showError('No hay archivo subido para previsualizar'), null)
                                        if (!previewFileUrl) return (showError('Faltan datos del archivo para la vista previa'), null)
                                        setPreviewOpen(true)
                                    }} type="button" className="text-black text-sm px-10 p-1 rounded-full bg-[#FFC107] cursor-pointer">Vista Previa</button>
                                    <button type="button" className="text-black text-sm px-10 p-1 rounded-full bg-gradient-to-r from-[#7BCE6D] to-[#A8D860] cursor-pointer">Aceptar</button>
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
                                                                    onLoadError={(e) => showError(`No se pudo cargar el PDF: ${e.message || e}`)}
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
                                                    ) : null}
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