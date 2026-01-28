import { NextResponse } from 'next/server'
import { getAuthHeaderFromRequest } from '../../../../../lib/getAuthHeader'

export async function GET(request, { params }) {
    const { type, filehash } = params || {}
    if (!type || !filehash || type === 'undefined' || filehash === 'undefined') {
        return NextResponse.json({ error: 'Missing file type or hash' }, { status: 400 })
    }

    const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'
    const upstream = `${API_URL}/file-manager/download/${type}/${filehash}`

    try {
        const token = getAuthHeaderFromRequest(request)
        const res = await fetch(upstream, {
            headers: {
                'User-Agent': 'NextPDFProxy/1.0',
                'Accept': 'application/pdf',
                ...(token ? { 'Authorization': token } : {}),
            },
        })

        if (!res.ok) {
            const txt = await res.text().catch(() => '')
            console.error(`[Proxy PDF] Error en origen: ${res.status}`, txt)
            return NextResponse.json({ error: 'Upstream fetch failed', status: res.status, details: txt }, { status: 502 })
        }


        const arrayBuffer = await res.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const firstBytes = buffer.slice(0, 20).toString('hex')

        const isPDF = buffer.toString('utf8', 0, 4) === '%PDF'

        const headers = {
            'Content-Type': 'application/pdf',
            'Content-Length': String(buffer.length),
            'Content-Disposition': `inline; filename='${filehash}.pdf'`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
        return new Response(buffer, { status: 200, headers })
    } catch (err) {
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 })
    }
}
