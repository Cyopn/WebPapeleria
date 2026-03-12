export function getAuthHeaderFromRequest(request) {
    const header = request.headers?.get?.('authorization') || null
    if (header) return header

    try {
        const cookieHeader = request.headers?.get('cookie') || ''
        const cookies = Object.fromEntries(cookieHeader.split(';').map(s => s.trim()).filter(Boolean).map(s => {
            const [k, ...v] = s.split('=')
            return [k, decodeURIComponent(v.join('='))]
        }))
        if (cookies.token) return `Bearer ${cookies.token}`

        if (cookies.user) {
            try {
                const parsedUser = JSON.parse(cookies.user)
                const tokenFromUser = parsedUser?.token || parsedUser?.user?.token || null
                if (tokenFromUser) return `Bearer ${tokenFromUser}`
            } catch (e) {
            }
        }
    } catch (e) {
    }

    const envToken = process.env.BEARER_TOKEN || null
    if (envToken) return `Bearer ${envToken}`
    return null
}
