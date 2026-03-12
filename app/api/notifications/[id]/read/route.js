import { NextResponse } from 'next/server'
import { getAuthHeaderFromRequest } from '@/lib/get_auth_header'

export async function PATCH(request, { params }) {
    try {
        const API_URL = process.env.API_URL
        if (!API_URL) return NextResponse.json({ error: 'API_URL not configured' }, { status: 500 })

        const resolvedParams = await params
        const id = resolvedParams?.id
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

        const upstreamBase = String(API_URL).replace(/\/$/, '')
        const upstream = `${upstreamBase}/notifications/${encodeURIComponent(String(id))}/read`

        const authHeader = getAuthHeaderFromRequest(request)
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
        }

        const res = await fetch(upstream, { method: 'PATCH', headers, cache: 'no-store' })

        if (!res.ok) {
            let text = ''
            try { text = await res.text() } catch (e) { text = String(e) }
            console.error('[proxy notifications mark read] upstream error', { upstream, status: res.status, body: text })
            return NextResponse.json({ error: 'Upstream error', upstream, status: res.status, body: text }, { status: 502 })
        }

        const body = await res.text()
        return new NextResponse(body, { status: res.status, headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
        console.error('[proxy notifications mark read] error', err)
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 502 })
    }
}
