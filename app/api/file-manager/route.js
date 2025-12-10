import { NextResponse } from "next/server";

export async function POST(request) {
    let body
    try {
        body = await request.formData()
    } catch (err) {
        const received = request.headers.get('content-type') || ''
        return NextResponse.json({ error: 'Invalid Content-Type. Expected multipart/form-data or application/x-www-form-urlencoded.', details: String(err), received }, { status: 400 })
    }
    const incomingUserRaw = body.get('user')
    const incomingUsername = body.get('username')
    let user = null
    if (incomingUserRaw) {
        try {
            user = JSON.parse(incomingUserRaw)
        } catch (e) {
            user = { user: { username: String(incomingUserRaw) } }
        }
    } else if (incomingUsername) {
        user = { user: { username: String(incomingUsername) } }
    }
    const authHeader = request.headers.get('authorization') || (user && user.token ? `Bearer ${user.token}` : null)
    const fd = new FormData()
    const filesField = body.get('files')
    if (!filesField) {
        return NextResponse.json({ error: 'No files field in form data' }, { status: 400 })
    }
    fd.append('files', filesField)
    fd.append('username', (user && user.user && user.user.username) ? user.user.username : '')

    const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'
    try {
        const res = await fetch(`${API_URL}/file-manager?service=file`, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                ...(authHeader ? { 'Authorization': authHeader } : {}),
            },
            body: fd,
        })
        const data = await res.json()
        return NextResponse.json(data, { status: res.status })
    } catch (err) {
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 })
    }
}
