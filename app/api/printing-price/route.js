import { NextResponse } from 'next/server'

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body', details: String(err) }, { status: 400 })
  }

  const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'

  let user = null
  if (body.user) {
    try {
      user = typeof body.user === 'string' ? JSON.parse(body.user) : body.user
    } catch (e) {
      user = { user: { username: String(body.user) } }
    }
  }

  let authHeader = request.headers.get('authorization') || (user && user.token ? `Bearer ${user.token}` : null)
  if (!authHeader) {
    try {
      const cookieHeader = request.headers.get('cookie') || ''
      const cookies = Object.fromEntries(cookieHeader.split(';').map(s => s.trim()).filter(Boolean).map(s => {
        const idx = s.indexOf('=')
        if (idx === -1) return [s, '']
        return [s.slice(0, idx), s.slice(idx + 1)]
      }))
      if (cookies.token) {
        authHeader = `Bearer ${decodeURIComponent(cookies.token)}`
      } else if (cookies.user) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookies.user))
          if (parsed && parsed.token) authHeader = `Bearer ${parsed.token}`
        } catch (e) {
        }
      }
    } catch (e) {
    }
  }

  const payload = {
    filename: body.filename || body.filehash || body.storedName || null,
    colorModes: body.colorModes || body.color || (body.printType === 'color' ? 'color' : 'bw') || 'bw',
    paperSizes: body.paperSizes || body.paperSize || body.paper || 'carta',
    ranges: body.ranges || (body.br3Selected ? 'all' : (body.rangeValue || 'all')) || 'all',
    bothSides: typeof body.bothSides === 'boolean' ? body.bothSides : !!body.bothSides,
    service: body.service || 'file',
    sets: Number(body.sets || body.quantity || 1),
    type: body.type || null,
    ringType: body.ringType || body.ring || null,
    documentType: body.documentType || body.docType || null,
    coverType: body.coverType || null,
    bindingType: body.bindingType || null,
  }

  if (!payload.filename) {
    return NextResponse.json({ error: 'Missing filename/filehash in request' }, { status: 400 })
  }

  try {
    const res = await fetch(`${API_URL}/printing-price`, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json; charset=utf-8',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return NextResponse.json({ error: data?.error || data?.message || 'External API error', details: data }, { status: res.status })
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 })
  }
}

export const runtime = 'nodejs'
