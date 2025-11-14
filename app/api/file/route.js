import { NextResponse } from "next/server";

export async function POST(request) {
    const body = await request.json();
    const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api';
    const user = JSON.parse(body.user)
    const res = body.res;
    try {
        const response = await fetch(`${API_URL}/files`, {
            method: 'POST',
            headers: {
                "Accept": "*/*",
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Bearer ${user.token}`
            },
            body: JSON.stringify({ id_user: user.user.id_user, filename: res.originalName, type: res.service, filehash: res.storedName }),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 });
    }
}
