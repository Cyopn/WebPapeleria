'use client'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { ShoppingCart, X } from 'lucide-react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const cartRef = useRef(null)

  const cartItems = [
    { id: 1, name: 'Impresión a color', price: 25 },
    { id: 2, name: 'Cuaderno profesional', price: 60 },
  ]

  const total = cartItems.reduce((acc, item) => acc + item.price, 0)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setCartOpen(false)
      }
    }

    if (cartOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [cartOpen])

  return (
    <>
      <nav className="bg-blue-700 text-white shadow-md relative z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-wide">
            Papelería<span className="text-yellow-300">App</span>
          </Link>

          <div className="hidden md:flex space-x-6">
            <Link href="/" className="hover:text-yellow-300 transition">Inicio</Link>
            <Link href="/productos" className="hover:text-yellow-300 transition">Productos</Link>
            <Link href="/impresiones" className="hover:text-yellow-300 transition">Impresiones</Link>
            <Link href="/servicios-especiales" className="hover:text-yellow-300 transition">Servicios</Link>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-blue-600 transition"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-300 text-blue-700 text-xs font-bold rounded-full px-1">
                  {cartItems.length}
                </span>
              )}
            </button>

            <div className="hidden md:flex space-x-2">
              <Link
                href="/login"
                className="bg-white text-blue-700 px-3 py-1 rounded font-medium hover:bg-yellow-300 transition"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="border border-white px-3 py-1 rounded font-medium hover:bg-yellow-300 hover:text-blue-700 transition"
              >
                Registrarse
              </Link>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-blue-600 px-4 pb-3 space-y-2">
            <Link href="/" className="block py-1 hover:text-yellow-300">Inicio</Link>
            <Link href="/productos" className="block py-1 hover:text-yellow-300">Productos</Link>
            <Link href="/impresiones" className="block py-1 hover:text-yellow-300">Impresiones</Link>
            <Link href="/servicios-especiales" className="block py-1 hover:text-yellow-300">Servicios</Link>
            <hr className="border-blue-500" />
            <Link href="/login" className="block py-1 hover:text-yellow-300">Iniciar sesión</Link>
            <Link href="/registro" className="block py-1 hover:text-yellow-300">Registrarse</Link>
          </div>
        )}
      </nav>

      {cartOpen && (
        <div className="fixed inset-0 z-20" />
      )}

      <div
        ref={cartRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-30 transition-transform duration-500 ease-in-out transform ${cartOpen ? 'translate-x-0' : 'translate-x-full'
          } slide-in-right`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Tu carrito</h2>
          <button
            onClick={() => setCartOpen(false)}
            className="p-1 rounded hover:bg-gray-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <p className="text-gray-500 text-center mt-8">Tu carrito está vacío.</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                </div>
                <button className="text-red-500 text-sm hover:underline">Eliminar</button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between mb-3 font-medium">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Link
              href="/pago"
              onClick={() => setCartOpen(false)}
              className="block text-center bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition"
            >
              Continuar al pago
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
