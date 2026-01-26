'use client'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addItem } from '@/lib/cart_store'
import { MinusCircle, PlusCircle } from 'lucide-react'
import { useToast } from '@/context/toast_context'
import { usePayment } from '@/context/payment_context'

export default function ProductCard({ id, name, description, price, image }) {
    const [open, setOpen] = useState(false)
    const [qty, setQty] = useState(1)
    const [visible, setVisible] = useState(false)
    const { showToast } = useToast()
    const { openPayment } = usePayment()
    const router = useRouter()

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (visible) {
            window.__modalOpenCount = (window.__modalOpenCount || 0) + 1
            if (window.__modalOpenCount === 1) document.body.style.overflow = 'hidden'
            return () => {
                window.__modalOpenCount = Math.max(0, (window.__modalOpenCount || 1) - 1)
                if (window.__modalOpenCount === 0) document.body.style.overflow = ''
            }
        }
    }, [visible])

    useEffect(() => {
        if (open) {
            const t = setTimeout(() => setVisible(true), 10)
            return () => clearTimeout(t)
        }
    }, [open])

    function handleCardClick() {
        setQty(1)
        setOpen(true)
    }

    function closeWithAnimation(callback) {
        setVisible(false)
        const t = setTimeout(() => {
            setOpen(false)
            if (typeof callback === 'function') callback()
        }, 200)
        return () => clearTimeout(t)
    }

    function handleClose(e) {
        e?.stopPropagation()
        closeWithAnimation()
    }

    function handleAddToCart(e) {
        e.stopPropagation()
        const count = addItem({ id, name, price, image, qty })
        showToast(`${qty} × ${name} agregado al carrito`, { type: 'success' })
        closeWithAnimation()
    }

    function handleBuyNow(e) {
        e.stopPropagation()
        showToast(`Comprando ${qty} × ${name}`, { type: 'success' })
        closeWithAnimation(() => openPayment(price * qty, { item: { id, name, price, image, qty } }))
    }

    return (
        <div className="w-[90%] flex justify-center items-center p-4">
            <div onClick={handleCardClick} className="flex items-center justify-center flex-col py-3 content-center rounded-xl shadow-xl/20 overflow-hidden transition-shadow transform transition-transform duration-300 hover:scale-102 cursor-pointer">
                <div className="flex items-center justify-center flex-row content-center bg-[#E6E6E6B0] rounded-md m-3 p-2">
                    <Image
                        src={image || '/images/no-image.png'}
                        alt={name}
                        className="h-[80%] w-[80%]"
                        width={300}
                        height={300}
                        loading="eager" />
                </div>
                <div className="w-[100%] flex items-center justify-center flex-col content-center">
                    <div className="w-full">
                        <h3 className="text-md font-medium w-full">{name}</h3>
                        <p className="text-sm text-gray-600 w-full">{description}</p>
                    </div>
                    <div className="flex justify-center items-center content-center">
                        <span className="text-xl">${price}</span>
                    </div>
                    <div>
                        <button onClick={handleAddToCart} type="button" className="w-full bg-[#77ADFFBD] text-[#012588] py-2 px-7 rounded-xl cursor-pointer">Agregar al carrito</button>
                    </div>
                </div>
            </div>
            {open && (
                <div onClick={handleClose} className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
                    <div onClick={(e) => e.stopPropagation()} className={`bg-white rounded-xl max-w-[60vw] w-full p-6 transform transition-all duration-200 ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}`}>
                        <div className="w-full">
                            <button onClick={handleClose} className="text-gray-600 w-full cursor-pointer text-right">Cerrar</button>
                        </div>
                        <div className="mt-4 flex flex-col items-center bg-[#D9D9D975] rounded-xl p-6">
                            <div className="w-[23vw] h-[23vw] relative">
                                <Image src={image || '/images/no-image.png'} alt={name} fill className="object-cover rounded-md" />
                            </div>
                            <h2 className="text-xl font-bold pt-3">{name}</h2>
                            <p className="mt-4 text-sm text-gray-700">{description}</p>
                            <p className="mt-2 font-bold">${price}</p>
                        </div>
                        <div className="mt-4 w-full flex gap-[20px] justify-evenly">
                            <div>
                                <div className="w-full bg-[#D9D9D9] text-black py-2 px-7 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span>Cantidad</span>
                                        <button onClick={(e) => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)); }} className="text-gray-600">
                                            <MinusCircle size={20} className="cursor-pointer" />
                                        </button>
                                        <span>{qty}</span>
                                        <button onClick={(e) => { e.stopPropagation(); setQty(q => q + 1); }} className="text-gray-600">
                                            <PlusCircle size={20} className="cursor-pointer" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <button onClick={handleBuyNow} className="w-full bg-gradient-to-r to-[#006DEC] from-[#7AD0EC] text-black py-2 px-7 rounded-xl cursor-pointer">Comprar ahora</button>
                            </div>
                            <div>
                                <button onClick={handleAddToCart} className="w-full bg-gradient-to-r from-[#7BCE6D] to-[#A8D860] text-black py-2 px-7 rounded-xl cursor-pointer">Agregar al carrito</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
