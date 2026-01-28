import { NextResponse } from 'next/server'
import { getAuthHeaderFromRequest } from '@/lib/get_auth_header'

export async function POST(request) {
    let body
    try {
        body = await request.json()
    } catch (err) {
        return NextResponse.json({ error: 'Invalid JSON body', details: String(err) }, { status: 400 })
    }

    const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'
    const authHeader = getAuthHeaderFromRequest(request)

    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json; charset=utf-8',
                ...(authHeader ? { 'Authorization': authHeader } : {}),
            },
            body: JSON.stringify(body),
        })
        const data = await response.json().catch(() => null)
        console.log('[ProductsAPI] Estado de respuesta de la API externa:', response.status)
        console.log('[ProductsAPI] Datos de respuesta de la API externa:', data)
        return NextResponse.json(data, { status: response.status })
    } catch (err) {
        console.error('[ProductsAPI] Error en proxy:', err)
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 })
    }
}

export async function GET(request) {
    try {
        const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'
        const authHeader = getAuthHeaderFromRequest(request)
        const url = new URL(request.url)
        const search = url.search || ''

        const response = await fetch(`${API_URL}/products${search}`, {
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
