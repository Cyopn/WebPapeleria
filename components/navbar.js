'use client'
import Link from 'next/link'
import { ShoppingCart, Menu, Search } from 'lucide-react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth_context'
import { useState } from 'react'
import SlideMenu from './slide_menu'

export default function Navbar() {

  const pathname = usePathname();
  const { user } = useAuth();

  const routes = ["/prints"]
  const [menuOpen, setMenuOpen] = useState(false)

  if (routes.includes(pathname)) {
    return (
      <>
        <nav className='absolute top-0 w-full z-[99] bg-gradient-to-r from-[#0872EAA3] to-[#5B6FD79E]'>
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
            <Link href="/prints" className="hover:text-yellow-300 transition">Impresiones</Link>
            <Link href="/impresiones" className="hover:text-yellow-300 transition">Productos</Link>
            <Link href="/servicios-especiales" className="hover:text-yellow-300 transition">Servicios Especiales</Link>
            <div className="relative">
              <div className="w-full items-center content-center">
                <input className="p-2.5 w-full z-20 text-gray-700 rounded-xl bg-white/80" placeholder="Buscar" required />
                <button type="submit" className="absolute top-0 end-0 p-2.5 text-gray-400 items-center ">
                  <Search />
                </button>
              </div>
            </div>
            {!user && (<Link
              href="/signin"
              className="text-black px-5 py-2 rounded-xl bg-gradient-to-r from-[#7BCE6D] to-[#A8D860]"
            >
              Iniciar sesión
            </Link>)}
            <div className="flex gap-10 items-center content-center">
              <button className="text-black cursor-pointer">
                <ShoppingCart />
              </button>
              <button className="text-black cursor-pointer" onClick={() => setMenuOpen(true)}>
                <Menu />
              </button>
            </div>
          </div>
        </nav>
        <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      </>

    )
  }

  return (
    <>
      <nav className='absolute top-0 w-full z-[99]'>
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
          <Link href="/prints" className="hover:text-yellow-300 transition">Impresiones</Link>
          <Link href="/impresiones" className="hover:text-yellow-300 transition">Productos</Link>
          <Link href="/servicios-especiales" className="hover:text-yellow-300 transition">Servicios Especiales</Link>
          <div className="relative">
            <div className="w-full items-center content-center">
              <input className="p-2.5 w-full z-20 text-gray-700 rounded-xl bg-white/80" placeholder="Buscar" required />
              <button type="submit" className="absolute top-0 end-0 p-2.5 text-gray-400 items-center ">
                <Search />
              </button>
            </div>
          </div>
          {!user && (<Link
            href="/signin"
            className="text-black px-5 py-2 rounded-xl bg-gradient-to-r from-[#7BCE6D] to-[#A8D860]"
          >
            Iniciar sesión
          </Link>)}
          <div className="flex gap-10 items-center content-center">
            <button className="text-black cursor-pointer">
              <ShoppingCart />
            </button>
            <button className="text-black cursor-pointer" onClick={() => setMenuOpen(true)}>
              <Menu />
            </button>
          </div>
        </div>
      </nav>
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>

  )
}
