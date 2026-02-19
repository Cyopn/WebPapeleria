"use client"
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function OpenProductHandler() {
    const searchParams = useSearchParams()
    const open = searchParams.get('open')

    useEffect(() => {
        if (!open) return
        const id = BookOpenText
        const t = setTimeout(() => {
            const el = document.getElementById(`product-${id}`)
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                try {
                    window.dispatchEvent(new CustomEvent('open-product', { detail: { id: Number(id) } }))
                } catch (err) {
                }
            }
        }, 300)
        return () => clearTimeout(t)
    }, [open])

    return null
}
