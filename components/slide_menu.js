'use client'
import { X } from 'lucide-react'
import Link from 'next/link'

export default function SlideMenu({ open, onClose }) {
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
                className={`absolute top-0 right-0 h-full w-[25%] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Menú</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md hover:bg-gray-100 transition"
                    >
                        <X />
                    </button>
                </div>

                <nav className="p-4 space-y-3 text-lg">
                    <Link href="/" className="block hover:text-blue-600">
                        Inicio
                    </Link>
                    <Link href="/prints" className="block hover:text-blue-600">
                        Impresiones
                    </Link>
                    <Link href="/impresiones" className="block hover:text-blue-600">
                        Productos
                    </Link>
                    <Link href="/servicios-especiales" className="block hover:text-blue-600">
                        Servicios Especiales
                    </Link>
                </nav>
            </aside>
        </div>
    )
}
