import { NextResponse } from 'next/server'
import { getAuthHeaderFromRequest } from '@/lib/get_auth_header'

export async function GET(request, { params }) {
    try {
        const API_URL = process.env.API_URL
        if (!API_URL) return NextResponse.json({ error: 'API_URL not configured' }, { status: 500 })

        const resolvedParams = await params
        const idUser = resolvedParams?.id_user
        if (!idUser) return NextResponse.json({ error: 'id_user is required' }, { status: 400 })

        const incomingUrl = new URL(request.url)
        const upstreamBase = String(API_URL).replace(/\/$/, '')
        const upstream = `${upstreamBase}/notifications/stream/${encodeURIComponent(String(idUser))}`

        const authHeader = getAuthHeaderFromRequest(request)
        const headers = {
            Accept: 'text/event-stream',
            ...(authHeader ? { Authorization: authHeader } : {}),
        }

        const res = await fetch(upstream, {
            method: 'GET',
            headers,
            cache: 'no-store',
        })

        if (!res.ok) {
            let text = ''
            try {
                text = await res.text()
            } catch (e) {
                text = String(e)
            }
            console.error('[proxy notifications stream by id] upstream error', {
                upstream,
                status: res.status,
                body: text,
                hasAuthorization: Boolean(authHeader),
                path: incomingUrl.pathname,
            })
            return NextResponse.json({ error: 'Upstream error', upstream, status: res.status, body: text }, { status: 502 })
        }

        const respHeaders = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
        }

        try {
            for (const [k, v] of res.headers.entries()) {
                const key = k.toLowerCase()
                if (key === 'content-type' || key === 'content-length') continue
                respHeaders[k] = v
            }
        } catch (e) {
        }

        return new NextResponse(res.body, { status: res.status, headers: respHeaders })
    } catch (err) {
        console.error('[proxy notifications stream by id] error', err)
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 502 })
    }
}
