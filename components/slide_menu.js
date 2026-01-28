'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { clear as clearCart } from '@/lib/cart_store'
import { useToast } from '@/context/toast_context'

export default function SlideMenu({ open, onClose }) {
    const lockRef = useRef(false)

    function lockBody() {
        if (typeof window === 'undefined') return
        if (lockRef.current) return
        window.__modalOpenCount = (window.__modalOpenCount || 0) + 1
        lockRef.current = true
        if (window.__modalOpenCount === 1) document.body.style.overflow = 'hidden'
    }

    function unlockBody() {
        if (typeof window === 'undefined') return
        if (!lockRef.current) return
        window.__modalOpenCount = Math.max(0, (window.__modalOpenCount || 1) - 1)
        lockRef.current = false
        if (window.__modalOpenCount === 0) document.body.style.overflow = ''
    }

    const router = useRouter()
    const { showToast } = useToast()
    const [userData, setUserData] = useState(() => {
        if (typeof window === 'undefined') return { name: '', username: '', email: '', phone: '', avatar: '/images/no-image.png' }
        try {
            const raw = localStorage.getItem('user')
            if (!raw) return { name: '', username: '', email: '', phone: '', avatar: '/images/no-image.png' }
            const parsed = JSON.parse(raw)
            const u = parsed?.user || parsed || {}
            return {
                name: u.names || u.nombre || '',
                username: u.username || '',
                email: u.email || u.correo || '',
                phone: u.phone || u.telefono || u.phone || '',
                avatar: u.avatar || u.photo || u.profileImageUrl || '/images/no-image.png'
            }
        } catch (err) {
            console.error('[SlideMenu] Error al parsear usuario desde localStorage', err)
            return { name: '', username: '', email: '', phone: '', avatar: '/images/no-image.png' }
        }
    })

    useEffect(() => {
        if (open) {
            // Si el usuario por defecto (id:1) está activo, no abrir el menú;
            // mostrar solo el toast y pedir el cierre al padre.
            try {
                if (typeof window !== 'undefined') {
                    const raw = localStorage.getItem('user')
                    if (raw) {
                        const parsed = JSON.parse(raw)
                        const u = parsed?.user || parsed || {}
                        const maybeId = parsed?.id || parsed?.user?.id || u?.id || null
                        if (maybeId === 1) {
                            try { showToast('Función disponible iniciando sesión') } catch (e) { console.error('[SlideMenu] showToast fallo', e) }
                            if (typeof onClose === 'function') onClose()
                            return
                        }
                    }
                }
            } catch (e) {
                // ignore and proceed to lock
            }
            lockBody()
        } else {
            unlockBody()
        }
        return () => {
            if (lockRef.current) unlockBody()
        }
    }, [open, onClose, showToast])

    // userData is initialized lazily from localStorage to avoid
    // calling setState synchronously inside an effect (cascading renders).

    function handleLogout(e) {
        e?.stopPropagation()
        try {
            clearCart()
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user')
                localStorage.removeItem('cart_items_v1')
            }
        } catch (err) {
            console.error('[SlideMenu] Error durante limpieza de sesión al cerrar sesión', err)
        }
        onClose && onClose()
        try {
            if (typeof document !== 'undefined') {
                document.cookie = 'user=; Max-Age=0; path=/;'
                document.cookie = 'token=; Max-Age=0; path=/;'
            }
        } catch (e) {
            console.error('[SlideMenu] Error al borrar cookies de autenticación', e)
        }
        if (typeof window !== 'undefined') {
            window.location.replace('/')
        } else {
            router.push('/')
        }
    }
    return (
        <div
            className={`fixed inset-0 z-[100] transition-all duration-300 ${open ? 'visible' : 'invisible'
                }`}
        >
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'
                    }`}
            ></div>

            <aside
                className={`absolute top-0 right-0 h-full w-[25%] bg-white rounded-l-4xl overflow-hidden shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className='flex items-center justify-between pt-1.5 pb-1.5 bg-gradient-to-r from-[#8AD8F2] to-[#318BEF] rounded-tl-4xl  oveflow-hidden'>
                    <button
                        onClick={onClose}
                        className='p-1 transition rotate-180'
                    >
                        <span className='pr-4 text-lg text-black cursor-pointer'>
                            <span className='fi fi-br-exit'></span>
                        </span>
                    </button>
                </div>
                <nav className='p-4 space-y-3 w-full flex-1 overflow-auto'>
                    <div className='w-full h-full flex flex-col min-h-0'>
                        <div className='w-full h-[25%] flex justify-center items-center py-2'>
                            <Image
                                src={userData.avatar || '/images/no-image.png'}
                                alt={userData.name || 'avatar'}
                                className='h-[80%] w-auto rounded-full'
                                width={300}
                                height={300}
                                loading='eager' />
                        </div>
                        <div className='w-full flex justify-center items-center text-black py-2'>
                            <span className='text-lg'>{userData.name || 'Nombre'}</span>
                        </div>
                        <div className='w-full flex justify-center items-center text-black text-center py-2'>
                            <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); showToast('opción no disponible') }} className='relative w-[45%] py-5 cursor-pointer'>
                                <div className='flex justify-center items-center'>
                                    <span className='text-3xl'>
                                        <span className='fi fi-rr-shopping-cart-check'></span>
                                    </span>
                                </div>
                                <label className='cursor-pointer'>Mis pedidos</label>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); showToast('opción no disponible') }} className='relative w-[45%] py-5 cursor-pointer'>
                                <div className='flex justify-center items-center'>
                                    <span className='text-3xl'>
                                        <span className='fi fi-rr-cowbell'></span>
                                    </span>
                                </div>
                                <label className='cursor-pointer'>Notificaciones</label>
                            </button>
                        </div>
                        <div className='w-full flex flex-col justify-center items-center text-left py-2'>
                            <div className='w-[85%] py-1 text-gray-500 py-3'>
                                <label>Nombre</label>
                                <input value={userData.name} readOnly className='block w-full p-2 w-full rounded-full bg-gray-200 text-center' />
                            </div>
                            <div className='w-[85%] py-1 text-gray-500 py-3'>
                                <label>Correo</label>
                                <input value={userData.email} readOnly className='block w-full p-2 w-full rounded-full bg-gray-200 text-center' />
                            </div>
                            <div className='w-[85%] py-1 text-gray-500 py-3'>
                                <label>Número de teléfono</label>
                                <input value={userData.phone} readOnly className='block w-full p-2 w-full rounded-full bg-gray-200 text-center' />
                            </div>
                        </div>
                        <div onClick={(e) => { e.preventDefault(); showToast('Opción no disponible') }} className='w-full flex flex-col justify-center items-center text-left py-2'>
                            <div className='w-full py-3'>
                                <a onClick={(e) => { e.stopPropagation(); e.preventDefault(); showToast('Opción no disponible') }} className='text-black text-bold text-center p-3 cursor-pointer flex flex-row justify-between w-full'>
                                    <div className='pl-10 w-auto'>
                                        <span className='text-xl px-2 h-full text-black'>
                                            <span className='fi fi-br-document'></span>
                                        </span>
                                    </div>
                                    <div className='w-full text-left'>
                                        <span className='pl-5'>Administrador de cuenta</span>
                                    </div>
                                    <div className='pr-10 w-auto'>
                                        <span className='flex items-center  text-xl px-2 text-black'>
                                            <span className='fi fi-br-exit'></span>
                                        </span>
                                    </div>
                                </a>
                            </div>
                            <div className='w-full py-3'>
                                <a onClick={(e) => { e.stopPropagation(); e.preventDefault(); showToast('Opción no disponible') }} className='text-black text-bold text-center p-3 cursor-pointer flex flex-row justify-between w-full'>
                                    <div className='pl-10 w-auto'>
                                        <span className='text-xl px-2 h-full text-black'>
                                            <span className='fi fi-br-document'></span>
                                        </span>
                                    </div>
                                    <div className='w-full text-left'>
                                        <span className='pl-5'>Historial de pedidos</span>
                                    </div>
                                    <div className='pr-10 w-auto'>
                                        <span className='flex items-center  text-xl px-2 text-black'>
                                            <span className='fi fi-br-exit'></span>
                                        </span>
                                    </div>
                                </a>
                            </div>
                            <div className='w-full py-3'>
                                <a onClick={(e) => { e.stopPropagation(); e.preventDefault(); showToast('Opción no disponible') }} className='text-black text-bold text-center p-3 cursor-pointer flex flex-row justify-between w-full'>
                                    <div className='pl-10 w-auto'>
                                        <span className='text-xl px-2 h-full text-black'>
                                            <span className='fi fi-br-document'></span>
                                        </span>
                                    </div>
                                    <div className='w-full text-left'>
                                        <span className='pl-5'>Soporte y ayuda</span>
                                    </div>
                                    <div className='pr-10 w-auto'>
                                        <span className='flex items-center  text-xl px-2 text-black'>
                                            <span className='fi fi-br-exit'></span>
                                        </span>
                                    </div>
                                </a>
                            </div>
                            <div className='w-full py-3 flex items-center justify-center'>
                                <div className='text-black text-bold text-center p-3 w-full flex items-center justify-center'>
                                    <button onClick={handleLogout} className='p-3 rounded flex items-center cursor-pointer gap-3'>
                                        <span className='pl-5'>Cerrar sesión</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            </aside>
        </div>
    )
}
