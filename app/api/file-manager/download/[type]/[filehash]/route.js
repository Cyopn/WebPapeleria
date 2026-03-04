import { NextResponse } from 'next/server'
import { getAuthHeaderFromRequest } from '../../../../../../lib/get_auth_header.js'

export async function GET(request, { params }) {
    const resolvedParams = await Promise.resolve(params)
    const { type, filehash } = resolvedParams || {}
    if (!type || !filehash || type === 'undefined' || filehash === 'undefined') {
        return NextResponse.json({ error: 'Missing file type or hash' }, { status: 400 })
    }

    const API_URL = process.env.API_URL || 'http://localhost:5000/api'
    const candidateBases = [
        API_URL,
        'http://localhost:5000/api',
        'http://192.168.1.43:5000/api',
    ].filter(Boolean)

    try {
        const token = getAuthHeaderFromRequest(request)
        let res = null
        let lastErrorText = ''
        let lastStatus = 500

        for (const base of candidateBases) {
            const upstream = `${base}/file-manager/download/${type}/${filehash}`
            const attempt = await fetch(upstream, {
                headers: {
                    'User-Agent': 'NextFileProxy/1.0',
                    'Accept': '*/*',
                    ...(token ? { 'Authorization': token } : {}),
                },
            })
            if (attempt.ok) {
                res = attempt
                break
            }
            lastStatus = attempt.status
            lastErrorText = await attempt.text().catch(() => '')
            console.error(`[Proxy File] Falló ${upstream} con ${attempt.status}: ${lastErrorText}`)
        }

        if (!res) {
            return NextResponse.json({ error: 'Upstream fetch failed', status: lastStatus, details: lastErrorText }, { status: 502 })
        }

        const arrayBuffer = await res.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        const upstreamContentType = res.headers.get('content-type') || 'application/octet-stream'
        const upstreamContentDisposition = res.headers.get('content-disposition') || null

        let inferredContentType = upstreamContentType
        if (!String(upstreamContentType).startsWith('image/')) {
            const isJpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
            const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
            const isWebp = bytes.length > 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
            if (isJpeg) inferredContentType = 'image/jpeg'
            else if (isPng) inferredContentType = 'image/png'
            else if (isWebp) inferredContentType = 'image/webp'
        }

        const headers = {
            'Content-Type': inferredContentType,
            'Content-Length': String(arrayBuffer.byteLength),
            'Content-Disposition': upstreamContentDisposition || `inline; filename="${filehash}"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
        return new Response(arrayBuffer, { status: 200, headers })
    } catch (err) {
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 })
    }
}
