import { NextResponse } from 'next/server'

export async function POST(request) {
    let body
    try {
        body = await request.json()
    } catch (err) {
        return NextResponse.json({ error: 'Invalid JSON body', details: String(err) }, { status: 400 })
    }

    const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'
    const authHeader = request.headers.get('authorization') || null

    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json; charset=utf-8',
                ...(authHeader ? { 'Authorization': authHeader } : {}),
            },
            body: JSON.stringify(body),
        })

        const data = await response.json().catch(() => null)
        return NextResponse.json(data, { status: response.status })
    } catch (err) {
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 })
    }
}

export async function GET(request) {
    try {
        const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'
        const authHeader = request.headers.get('authorization') || null
        const url = new URL(request.url)
        const search = url.search || ''

        const response = await fetch(`${API_URL}/transactions${search}`, {
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
