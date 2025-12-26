import { NextResponse } from 'next/server'

export function middleware(req) {
    const url = req.nextUrl.clone()
    const pathname = url.pathname

    if (pathname === '/') return NextResponse.next()

    const PUBLIC_PREFIXES = [
        '/signin',
        '/signup',
        '/api',
        '/_next',
        '/static',
        '/images',
        '/favicon.ico',
        '/robots.txt',
        '/sitemap.xml',
    ]

    if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
        return NextResponse.next()
    }

    const token = req.cookies.get('token')?.value
    const user = req.cookies.get('user')?.value

    if (!token && !user) {
        const original = req.nextUrl.pathname + (req.nextUrl.search || '')
        url.pathname = '/signin'
        url.searchParams.set('from', encodeURIComponent(original))
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/:path*',
}
