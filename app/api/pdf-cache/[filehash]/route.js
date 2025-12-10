import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CACHE_DIR = path.join(process.cwd(), '.pdf-cache')
const TTL_MS = 30 * 60 * 1000 // 30 minutes

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
                console.log(`[PDF Cache] Deleted expired cache: ${filePath}`)
            }
        } catch (err) {
            console.error(`[PDF Cache] Failed to delete ${filePath}:`, err.message)
        }
    }, delay)
}

export async function GET(_req, { params }) {
    let { filehash } = params || {}

    // Remove .pdf extension if present (Next adds it to dynamic segments)
    if (filehash && filehash.endsWith('.pdf')) {
        filehash = filehash.slice(0, -4)
    }

    if (!filehash || filehash === 'undefined') {
        console.error(`[PDF Cache] Invalid filehash:`, filehash)
        return NextResponse.json({ error: 'Missing filehash' }, { status: 400 })
    }

    console.log(`[PDF Cache] Request for filehash: ${filehash}`)
    ensureCacheDir()
    const filename = `${filehash}.pdf`
    const filePath = path.join(CACHE_DIR, filename)

    // Check if already cached and return it
    if (fs.existsSync(filePath)) {
        console.log(`[PDF Cache] Serving from cache: ${filePath}`)
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
            // Continue to re-fetch if error
        }
    }

    // Fetch from upstream and cache it
    const type = _req.nextUrl.searchParams.get('type')
    if (!type) {
        return NextResponse.json({ error: 'Missing type query param' }, { status: 400 })
    }

    const API_BASE = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'
    const upstream = `${API_BASE}/file-manager/download/${type}/${filehash}`

    try {
        console.log(`[PDF Cache] Fetching from upstream: ${upstream}`)
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

        console.log(`[PDF Cache] Buffer received: ${buffer.length} bytes`)
        const isPDF = buffer.toString('utf8', 0, 4) === '%PDF'
        console.log(`[PDF Cache] Valid PDF header: ${isPDF}`)

        // Write to cache
        fs.writeFileSync(filePath, buffer)
        console.log(`[PDF Cache] Cached to: ${filePath}`)

        // Schedule delete after TTL
        scheduleDelete(filePath)

        const headers = {
            'Content-Type': 'application/pdf',
            'Content-Length': String(buffer.length),
            'Content-Disposition': `inline; filename="${filename}"`,
            'Cache-Control': 'public, max-age=3600',
        }
        console.log(`[PDF Cache] Returning cached PDF`)
        return new Response(buffer, { status: 200, headers })
    } catch (err) {
        console.error(`[PDF Cache] Error:`, err.message)
        return NextResponse.json({ error: 'Cache proxy error', details: String(err) }, { status: 500 })
    }
}
