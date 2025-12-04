'use client'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addItem } from '@/lib/cart_store'
import { MinusCircle, PlusCircle } from 'lucide-react'

export default function ProductCard({ id, name, description, price, image }) {
    const [open, setOpen] = useState(false)

    const [qty, setQty] = useState(1)
    const router = useRouter()

    useEffect(() => {
        if (typeof window === 'undefined') return
        const prev = document.body.style.overflow
        if (open) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = prev
        }
        return () => { document.body.style.overflow = prev }
    }, [open])

    function handleCardClick() {
        setQty(1)
        setOpen(true)
    }

    function handleClose(e) {
        e?.stopPropagation()
        setOpen(false)
    }

    function handleAddToCart(e) {
        e.stopPropagation()
        const count = addItem({ id, name, price, image, qty })
        console.log(`Agregado ${qty} × ${name}. Total en carrito:`, count)
        setOpen(false)
    }

    function handleBuyNow(e) {
        e.stopPropagation()
        addItem({ id, name, price, image, qty })
        setOpen(false)
        router.push('/payment')
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
                <div onClick={handleClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl max-w-[60vw] w-full p-6">
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
