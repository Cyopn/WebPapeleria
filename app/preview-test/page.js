'use client'

import { useEffect, useState, useRef } from 'react'
import { Document, Page } from 'react-pdf'
import setupPdfWorker from '@/lib/setup_pdf_worker'

export default function PreviewTestPage() {
    const [fileUrl, setFileUrl] = useState(null)
    const [numPages, setNumPages] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const [scale, setScale] = useState(1)
    const [bg, setBg] = useState('#ffffff')
    const [shadow, setShadow] = useState(true)
    const fileInputRef = useRef(null)

    useEffect(() => {
        try { setupPdfWorker() } catch (e) { }
    }, [])

    useEffect(() => {
        return () => {
            if (fileUrl) {
                try { URL.revokeObjectURL(fileUrl) } catch (e) { }
            }
        }
    }, [fileUrl])

    function handleFile(e) {
        const f = e.target.files?.[0]
        if (!f) return
        try {
            if (fileUrl) try { URL.revokeObjectURL(fileUrl) } catch (e) { }
            const url = URL.createObjectURL(f)
            setFileUrl(url)
            setPageNumber(1)
        } catch (err) {
            console.error(err)
        }
    }

    function onDocumentLoadSuccess({ numPages: n }) {
        setNumPages(n)
        setPageNumber((p) => (p > n ? n : p))
    }

    return (
        <section className="p-8">
            <h1 className="text-2xl font-bold mb-4">Preview test — PDF</h1>

            <div className="mb-4 flex gap-3 items-center">
                <label className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer">
                    Cargar PDF
                    <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
                </label>
                <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => { setFileUrl('/api/pdf-cache?hash=example&type=local') }}>Cargar ejemplo (si aplica)</button>

                <div className="flex items-center gap-2">
                    <label>Escala</label>
                    <input type="range" min={0.5} max={2} step={0.1} value={scale} onChange={(e) => setScale(Number(e.target.value))} />
                    <span>{scale.toFixed(1)}x</span>
                </div>

                <div className="flex items-center gap-2">
                    <label>Fondo</label>
                    <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
                </div>

                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={shadow} onChange={(e) => setShadow(e.target.checked)} /> Sombra
                </label>
            </div>

            <div className="mb-4 flex gap-2 items-center">
                <button disabled={!fileUrl || pageNumber <= 1} onClick={() => setPageNumber((p) => Math.max(1, p - 1))} className="px-3 py-1 bg-gray-100 rounded">Anterior</button>
                <button disabled={!fileUrl || (numPages ? pageNumber >= numPages : false)} onClick={() => setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p + 1))} className="px-3 py-1 bg-gray-100 rounded">Siguiente</button>
                <span>Página {pageNumber}{numPages ? ` de ${numPages}` : ''}</span>
            </div>

            <div style={{ background: bg }} className={`p-6 rounded ${shadow ? 'shadow-lg' : ''}`}>
                {fileUrl ? (
                    <div className="flex justify-center">
                        <Document
                            file={fileUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={<div className="p-4">Cargando PDF…</div>}
                            onLoadError={(e) => console.error('PDF load error', e)}
                        >
                            <Page pageNumber={pageNumber} scale={scale} renderAnnotationLayer={false} renderTextLayer={false} />
                        </Document>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-600">Sube un PDF para ver su vista previa. Usa controles para ajustar escala, fondo y sombra.</div>
                )}
            </div>

            <div className="mt-6 text-sm text-gray-600">Esta página es solo una prueba para ajustar el diseño de previsualización de PDFs.</div>
        </section>
    )
}
