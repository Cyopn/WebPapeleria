import { NextResponse } from 'next/server'
import { getAuthHeaderFromRequest } from '@/lib/get_auth_header'

export async function GET(request, { params }) {
    try {
        const API_URL = process.env.API_URL
        if (!API_URL) return NextResponse.json({ error: 'API_URL not configured' }, { status: 500 })

        const resolvedParams = await params
        const idUser = resolvedParams?.id_user
        if (!idUser) return NextResponse.json({ error: 'id_user is required' }, { status: 400 })

        const upstreamBase = String(API_URL).replace(/\/$/, '')
        const upstream = `${upstreamBase}/notifications/user/${encodeURIComponent(String(idUser))}`

        const authHeader = getAuthHeaderFromRequest(request)
        const headers = {
            Accept: 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
        }

        const res = await fetch(upstream, { method: 'GET', headers, cache: 'no-store' })

        if (!res.ok) {
            let text = ''
            try { text = await res.text() } catch (e) { text = String(e) }
            console.error('[proxy notifications user] upstream error', { upstream, status: res.status, body: text })
            return NextResponse.json({ error: 'Upstream error', upstream, status: res.status, body: text }, { status: 502 })
        }

        const body = await res.text()
        return new NextResponse(body, { status: res.status, headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
        console.error('[proxy notifications user] error', err)
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 502 })
    }
}
