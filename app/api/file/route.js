import { NextResponse } from "next/server";

export async function POST(request) {
    let body
    try {
        body = await request.json()
    } catch (err) {
        return NextResponse.json({ error: 'Invalid JSON body', details: String(err) }, { status: 400 })
    }

    const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'

    // support two shapes:
    // 1) { user: JSON-string, res: { originalName, service, storedName } }
    // 2) { id_user, filename, type, filehash, token? }

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

    // determine id_user
    const idUser = body.id_user || (user && user.user && (user.user.id_user || user.user.id))

    if (!resObj) {
        return NextResponse.json({ error: 'Missing file info (res or filename)' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization') || (user && user.token ? `Bearer ${user.token}` : null)

    try {
        const payload = { id_user: idUser || 1, filename: resObj.originalName, type: resObj.service, filehash: resObj.storedName }

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
        return NextResponse.json(data, { status: response.status })
    } catch (err) {
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 })
    }
}
