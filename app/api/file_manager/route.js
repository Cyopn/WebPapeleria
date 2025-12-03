import { NextResponse } from "next/server";

export async function POST(request) {
    const body = await request.formData();
    const fd = new FormData();
    const user = JSON.parse(body.get("user"))
    fd.append("files", body.get("files"))
    fd.append("username", user.user.username)
    const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api';
    try {
        const res = await fetch(`${API_URL}/file_manager?service=file`, {
            method: 'POST',
            headers: {
                "Accept": "*/*",
                "Authorization": `Bearer ${user.token}`
            },
            body: fd
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        return NextResponse.json({ error: 'Proxy error', details: String(err) }, { status: 500 });
    }
}
