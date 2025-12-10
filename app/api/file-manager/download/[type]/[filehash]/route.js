import { NextResponse } from 'next/server'

// Proxy PDF download to avoid ngrok middleware altering response; sets a neutral User-Agent
export async function GET(_req, { params }) {
    const { type, filehash } = params || {}
    if (!type || !filehash || type === 'undefined' || filehash === 'undefined') {
        return NextResponse.json({ error: 'Missing file type or hash' }, { status: 400 })
    }

    const API_BASE = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'
    const upstream = `${API_BASE}/file-manager/download/${type}/${filehash}`

    try {
        console.log(`[PDF Proxy] Fetching from upstream: ${upstream}`)
        const res = await fetch(upstream, {
            headers: {
                'User-Agent': 'NextPDFProxy/1.0',
                'Accept': 'application/pdf',
            },
        })

        if (!res.ok) {
            const txt = await res.text().catch(() => '')
            console.error(`[PDF Proxy] Upstream error: ${res.status}`, txt)
            return NextResponse.json({ error: 'Upstream fetch failed', status: res.status, details: txt }, { status: 502 })
        }

        console.log(`[PDF Proxy] Upstream response OK:`, {
            status: res.status,
            contentType: res.headers.get('content-type'),
            contentLength: res.headers.get('content-length'),
            contentEncoding: res.headers.get('content-encoding'),
            transferEncoding: res.headers.get('transfer-encoding'),
        })

        const arrayBuffer = await res.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const firstBytes = buffer.slice(0, 20).toString('hex')
        console.log(`[PDF Proxy] Buffer received: ${buffer.length} bytes, first 20 bytes (hex): ${firstBytes}`)

        // Check if it's a valid PDF (should start with %PDF)
        const isPDF = buffer.toString('utf8', 0, 4) === '%PDF'
        console.log(`[PDF Proxy] Valid PDF header: ${isPDF}`)

        const headers = {
            'Content-Type': 'application/pdf',
            'Content-Length': String(buffer.length),
            'Content-Disposition': `inline; filename="${filehash}.pdf"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
        console.log(`[PDF Proxy] Returning PDF with headers:`, headers)
        return new Response(buffer, { status: 200, headers })
    } catch (err) {
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 })
    }
}
