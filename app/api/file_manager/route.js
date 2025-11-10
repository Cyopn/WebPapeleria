import { NextResponse } from "next/server";

export async function POST(request) {
    const body = await request.json();

    console.log(localStorage.getItem("user"))
    
}
