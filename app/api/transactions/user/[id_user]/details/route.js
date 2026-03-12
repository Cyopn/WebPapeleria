import { NextResponse } from 'next/server'
import { getAuthHeaderFromRequest } from '@/lib/get_auth_header'

export async function GET(request, { params }) {
    const { id_user } = (await params) || {}
    if (!id_user) {
        return NextResponse.json({ error: 'Missing id_user' }, { status: 400 })
    }

    try {
        const API_URL = process.env.API_URL
        const authHeader = getAuthHeaderFromRequest(request)

        const response = await fetch(`${API_URL}/transactions/user/${encodeURIComponent(id_user)}/details`, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                ...(authHeader ? { 'Authorization': authHeader } : {}),
            },
            cache: 'no-store',
        })

        const data = await response.json().catch(() => null)
        return NextResponse.json(data, { status: response.status })
    } catch (err) {
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 })
    }
}
