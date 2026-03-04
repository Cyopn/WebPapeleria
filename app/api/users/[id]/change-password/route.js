import { NextResponse } from 'next/server'
import { getAuthHeaderFromRequest } from '@/lib/get_auth_header'

export async function PUT(request, { params }) {
    try {
        const resolvedParams = await Promise.resolve(params)
        const { id } = resolvedParams || {}

        if (!id) {
            return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
        }

        const body = await request.json()
        const API_URL = process.env.API_URL
        const upstream = `${API_URL}/users/${id}/change-password`
        const authHeader = getAuthHeaderFromRequest(request)

        const res = await fetch(upstream, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                ...(authHeader ? { 'Authorization': authHeader } : {}),
            },
            body: JSON.stringify(body),
        })

        const txt = await res.text().catch(() => '')
        let resp = null
        try { resp = txt ? JSON.parse(txt) : null } catch (e) { resp = txt }

        return new NextResponse(
            typeof resp === 'string' ? resp : JSON.stringify(resp),
            { status: res.status, headers: { 'Content-Type': 'application/json' } }
        )
    } catch (err) {
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 })
    }
}
