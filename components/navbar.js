'use client'
import Link from 'next/link'
import { ShoppingCart, Menu, Search } from 'lucide-react'
import Image from 'next/image'

export default function Navbar() {
  return (
    <>
      <nav className='absolute top-0 w-full z-[9999]'>
        <div className="py-7 flex gap-0 flex-row flex-nowrap justify-evenly items-center content-center text-lg">
          <Link href="/" className="flex gap-10 items-center content-center">
            <Image
              src="/images/logo.png"
              alt="Logo"
              className="w-12 h-auto rounded-full"
              width={300}
              height={300}
            />
          </Link>
          <Link href="/" className="hover:text-yellow-300 transition">Inicio</Link>
          <Link href="/productos" className="hover:text-yellow-300 transition">Impresiones</Link>
          <Link href="/impresiones" className="hover:text-yellow-300 transition">Productos</Link>
          <Link href="/servicios-especiales" className="hover:text-yellow-300 transition">Servicios Especiales</Link>
          <div className="relative">
            <div className="w-full items-center content-center">
              <input className="p-2.5 w-full z-20 text-gray-700 rounded-full bg-white/80" placeholder="Buscar" required />
              <button type="submit" className="absolute top-0 end-0 p-2.5 text-gray-400 items-center ">
                <Search />
              </button>
            </div>
          </div>
          <Link
            href="/signin"
            className="text-black px-5 py-2 rounded-full bg-gradient-to-r from-[#7BCE6D] to-[#A8D860]"
          >
            Iniciar sesión
          </Link>
          <div className="flex gap-10 items-center content-center">
            <button className="text-black">
              <ShoppingCart />
            </button>
            <button className="text-black">
              <Menu />
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
