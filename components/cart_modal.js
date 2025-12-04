'use client'
import Link from 'next/link'
import Image from 'next/image'
import { MinusCircle, PlusCircle, Trash2 } from 'lucide-react'
import { getItems, addItem, decrementItem, removeItem } from '@/lib/cart_store'

export default function CartModal({ open, onClose, cartCount }) {
    if (!open) return null

    const items = getItems()

    return (
        <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl max-w-[60vw] w-full p-6 overflow-auto mt-[104px]" style={{ maxHeight: 'calc(85vh - 104px)' }}>
                <div className="flex justify-between items-center">
                    <h3 className="text-lg text-black font-semibold">Carrito ({cartCount})</h3>
                    <button onClick={onClose} className="text-gray-600 cursor-pointer">Cerrar</button>
                </div>
                <div className="mt-4 space-y-3">
                    {items.length === 0 ? (
                        <p className="text-md text-black">El carrito está vacío.</p>
                    ) : (
                        items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 relative">
                                        <Image src={it.image || '/images/no-image.png'} alt={it.name} fill className="object-cover rounded-md" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-black font-medium">{it.name}</div>
                                        <div className="text-xs text-gray-500">${it.price}</div>
                                    </div>
                                </div>
                                <div className="ml-4 flex items-center gap-3">
                                    <button onClick={(e) => { e.stopPropagation(); decrementItem(idx); }} className="text-gray-600">
                                        <MinusCircle size={18} className="cursor-pointer" />
                                    </button>
                                    <span className="text-sm text-black">{it.qty || 1}</span>
                                    <button onClick={(e) => { e.stopPropagation(); addItem({ id: it.id, name: it.name, price: it.price, image: it.image }); }} className="text-gray-600">
                                        <PlusCircle size={18} className="cursor-pointer" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); removeItem(idx); }} className="text-red-600">
                                        <Trash2 size={18} className="cursor-pointer" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                    <div className="mt-4">
                        <Link href="/payment">
                            <button onClick={onClose} className="w-full bg-gradient-to-r to-[#006DEC] from-[#7AD0EC] cursor-pointer text-black py-3 rounded-xl">Continuar con la compra</button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
