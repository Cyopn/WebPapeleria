import { pdfjs } from 'react-pdf'

if (typeof window !== 'undefined') {
    ; (async () => {
        try {
            const candidates = [
                '/build/pdf.worker.min.mjs',
                '/build/pdf.worker.min.js',
                '/build/pdf.worker.mjs',
                '/build/pdf.worker.js',
                '/pdf.worker.min.mjs',
                '/pdf.worker.min.js',
                '/pdf.worker.mjs',
                '/pdf.worker.js',
            ]
            for (const p of candidates) {
                try {
                    const res = await fetch(p, { method: 'HEAD' })
                    if (res.ok) {
                        try { pdfjs.GlobalWorkerOptions.workerSrc = p } catch (e) { }
                        break
                    }
                } catch (e) {
                }
            }
        } catch (e) {
        }
    })()
}

export default function setupPdfWorker() {  }
