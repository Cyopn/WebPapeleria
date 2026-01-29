import { NextResponse } from 'next/server';
import { getAuthHeaderFromRequest } from '@/lib/get_auth_header';

export async function POST(request) {
    let body
    try {
        body = await request.json()
    } catch (err) {
        return NextResponse.json({ error: 'Invalid JSON body', details: String(err) }, { status: 400 })
    }

    const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'
    let user = null
    let resObj = null
    if (body.user) {
        try {
            user = typeof body.user === 'string' ? JSON.parse(body.user) : body.user
        } catch (e) {
            user = { user: { username: String(body.user) } }
        }
    }

    if (body.res) {
        resObj = body.res
    } else if (body.filename) {
        resObj = { originalName: body.filename, service: body.type || '', storedName: body.filehash || '' }
    }

    const idUser = body.id_user || (user && user.user && (user.user.id_user || user.user.id))

    const normalizeList = (input) => {
        if (!input) return []
        if (Array.isArray(input)) return input
        return [input]
    }

    const resList = normalizeList(body.resList || body.files || body.items)
    const resolvedList = resList.length > 0 ? resList : (resObj ? [resObj] : [])

    if (!resolvedList.length) {
        return NextResponse.json({ error: 'Missing file info (res, resList, files or filename)' }, { status: 400 })
    }

    const authHeader = getAuthHeaderFromRequest(request) || (user && user.token ? `Bearer ${user.token}` : null)

    try {
        const results = []
        for (const item of resolvedList) {
            const payload = {
                id_user: idUser,
                filename: item.originalName || item.filename || item.name || '',
                type: item.service || item.type || '',
                filehash: item.storedName || item.filehash || '',
            }

            const response = await fetch(`${API_URL}/files`, {
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json; charset=utf-8',
                    ...(authHeader ? { 'Authorization': authHeader } : {}),
                },
                body: JSON.stringify(payload),
            })

            const data = await response.json()
            results.push({ status: response.status, data, payload })
        }

        if (resolvedList.length === 1) {
            const single = results[0]
            return NextResponse.json(single.data || single.payload, { status: single.status || 200 })
        }

        return NextResponse.json({ ok: true, items: results }, { status: 200 })
    } catch (err) {
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 })
    }
}
