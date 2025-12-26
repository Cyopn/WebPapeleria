import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CACHE_DIR = path.join(process.cwd(), '.pdf-cache')
const TTL_MS = 30 * 60 * 1000

function ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true })
    }
}

function scheduleDelete(filePath, delay = TTL_MS) {
    setTimeout(() => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
            }
        } catch (err) {
            console.error(`[PDF Cache] Failed to delete ${filePath}:`, err.message)
        }
    }, delay)
}

export async function GET(_req, { params }) {
    let { filehash } = params || {}

    if (filehash && filehash.endsWith('.pdf')) {
        filehash = filehash.slice(0, -4)
    }

    if (!filehash || filehash === 'undefined') {
        console.error(`[PDF Cache] Invalid filehash:`, filehash)
        return NextResponse.json({ error: 'Missing filehash' }, { status: 400 })
    }

    ensureCacheDir()
    const filename = `${filehash}.pdf`
    const filePath = path.join(CACHE_DIR, filename)

    if (fs.existsSync(filePath)) {
        try {
            const stat = fs.statSync(filePath)
            const stream = fs.createReadStream(filePath)
            const headers = {
                'Content-Type': 'application/pdf',
                'Content-Length': String(stat.size),
                'Content-Disposition': `inline; filename="${filename}"`,
                'Cache-Control': 'public, max-age=3600',
            }
            return new Response(stream, { status: 200, headers })
        } catch (err) {
            console.error(`[PDF Cache] Error reading cached file:`, err.message)
        }
    }

    const type = _req.nextUrl.searchParams.get('type')
    if (!type) {
        return NextResponse.json({ error: 'Missing type query param' }, { status: 400 })
    }

    const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'
    const upstream = `${API_URL}/file-manager/download/${type}/${filehash}`

    try {
        const res = await fetch(upstream, {
            headers: {
                'User-Agent': 'NextPDFCache/1.0',
                'Accept': 'application/pdf',
            },
        })

        if (!res.ok) {
            const txt = await res.text().catch(() => '')
            console.error(`[PDF Cache] Upstream error: ${res.status}`, txt)
            return NextResponse.json({ error: 'Upstream fetch failed', status: res.status, details: txt }, { status: 502 })
        }

        const arrayBuffer = await res.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const isPDF = buffer.toString('utf8', 0, 4) === '%PDF'

        fs.writeFileSync(filePath, buffer)

        scheduleDelete(filePath)

        const headers = {
            'Content-Type': 'application/pdf',
            'Content-Length': String(buffer.length),
            'Content-Disposition': `inline; filename="${filename}"`,
            'Cache-Control': 'public, max-age=3600',
        }
        return new Response(buffer, { status: 200, headers })
    } catch (err) {
        console.error(`[PDF Cache] Error:`, err.message)
        return NextResponse.json({ error: 'Cache proxy error', details: String(err) }, { status: 500 })
    }
}
