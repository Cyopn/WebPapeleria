import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    const { id } = (await params) || {}
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    try {
        const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'
        const authHeader = request.headers.get('authorization') || null
        const response = await fetch(`${API_URL}/transactions/${encodeURIComponent(id)}`, {
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
