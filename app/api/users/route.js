import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const body = await request.json()
        if (!body.role) body.role = 'default'
        const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'
        const upstream = `${API_URL}/users`

        const res = await fetch(upstream, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        const txt = await res.text().catch(() => '')
        let resp = null
        try { resp = txt ? JSON.parse(txt) : null } catch (e) { resp = txt }
        return new NextResponse(typeof resp === 'string' ? resp : JSON.stringify(resp), { status: res.status, headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 })
    }
}

export async function GET(request) {
    try {
        const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'
        const BEARER_TOKEN = process.env.BEARER_TOKEN
        const upstream = `${API_URL}/users`
        const res = await fetch(upstream, {
            method: 'GET', headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${BEARER_TOKEN}`,
            }
        })
        const txt = await res.text().catch(() => '')
        let body = null
        try { body = txt ? JSON.parse(txt) : null } catch (e) { body = txt }
        return new NextResponse(typeof body === 'string' ? body : JSON.stringify(body), { status: res.status, headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 })
    }
}
