'use client'
import Link from 'next/link'
import { ShoppingCart, Menu, Search, Trash2, PlusCircle, MinusCircle } from 'lucide-react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth_context'
import { usePayment } from '@/context/payment_context'
import { useState, useEffect } from 'react'
import SlideMenu from './slide_menu'
import CartModal from './cart_modal'
import { subscribe, getCount, getItems, clear } from '@/lib/cart_store'

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { openPayment } = usePayment();
  const routes = ['/prints', '/services', '/products', '/services/photo'];
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(() => getCount())
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    const unsub = subscribe(() => {
      setCartCount(getCount())
    })
    return unsub
  }, [])

  const handleContinuePurchase = () => {
    const items = getItems()
    const total = items.reduce((s, it) => s + (Number(it.price) || 0) * (it.qty || 1), 0)
    openPayment(total, { cartItems: items })
  }

  useEffect(() => {
  }, [cartOpen])

  if (routes.includes(pathname)) {
    return (
      <>
        <nav className='absolute top-0 w-full z-[50] bg-gradient-to-r from-[#0872EAA3] to-[#5B6FD79E]'>
          <div className='py-7 flex gap-0 flex-row flex-nowrap justify-evenly items-center content-center text-lg'>
            <Link href='/' className='flex gap-2 items-center content-center hover:text-yellow-300 transition'>
              <Image
                src='/images/logo.png'
                alt='Logo'
                className='w-12 h-auto rounded-full'
                width={300}
                height={300}
              />
              <label className='cursor-pointer'>Office TESChi</label>
            </Link>
            <Link href='/' className='hover:text-yellow-300 transition'>Inicio</Link>
            <Link href='/prints' className='hover:text-yellow-300 transition'>Impresiones</Link>
            <Link href='/products' className='hover:text-yellow-300 transition'>Productos</Link>
            <Link href='/services' className='hover:text-yellow-300 transition'>Servicios Especiales</Link>
            <div className='relative'>
              <div className='w-full items-center content-center'>
                <input className='p-2.5 w-full z-20 text-gray-700 rounded-xl bg-white/80' placeholder='Buscar' required />
                <button type='submit' className='absolute top-0 end-0 p-2.5 text-gray-400 items-center '>
                  <Search />
                </button>
              </div>
            </div>
            {(!user || user?.id === 1) && (<Link
              href='/signin'
              className='text-black px-5 py-2 rounded-xl bg-gradient-to-r from-[#7BCE6D] to-[#A8D860]'
            >
              Iniciar sesión
            </Link>)}
            <div className='flex gap-10 items-center content-center'>
              <div className='relative'>
                <button onClick={() => setCartOpen(true)} className='text-black cursor-pointer relative'>
                  <ShoppingCart />
                  {cartCount > 0 && (
                    <span className='absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full'>{cartCount > 9 ? '9+' : cartCount}</span>
                  )}
                </button>
              </div>
              <button className='text-black cursor-pointer' onClick={() => setMenuOpen(true)}>
                <Menu />
              </button>
            </div>
          </div>
        </nav>
        <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        <CartModal open={cartOpen} onClose={() => setCartOpen(false)} cartCount={cartCount} onContinuePurchase={handleContinuePurchase} />
      </>

    )
  }

  return (
    <>
      <nav className='absolute top-0 w-full z-[99]'>
        <div className='py-7 flex gap-0 flex-row flex-nowrap justify-evenly items-center content-center text-lg'>
          <Link href='/' className='flex gap-2 items-center content-center hover:text-yellow-300 transition'>
            <Image
              src='/images/logo.png'
              alt='Logo'
              className='w-12 h-auto rounded-full'
              width={300}
              height={300}
            />
            <label className='cursor-pointer'>Office TESChi</label>
          </Link>
          <Link href='/' className='hover:text-yellow-300 transition'>Inicio</Link>
          <Link href='/prints' className='hover:text-yellow-300 transition'>Impresiones</Link>
          <Link href='/products' className='hover:text-yellow-300 transition'>Productos</Link>
          <Link href='/services' className='hover:text-yellow-300 transition'>Servicios Especiales</Link>
          <div className='relative'>
            <div className='w-full items-center content-center'>
              <input className='p-2.5 w-full z-20 text-gray-700 rounded-xl bg-white/80' placeholder='Buscar' required />
              <button type='submit' className='absolute top-0 end-0 p-2.5 text-gray-400 items-center '>
                <Search />
              </button>
            </div>
          </div>
          {(!user || user?.id === 1) && (<Link
            href='/signin'
            className='text-black px-5 py-2 rounded-xl bg-gradient-to-r from-[#7BCE6D] to-[#A8D860]'
          >
            Iniciar sesión
          </Link>)}
          <div className='flex gap-10 items-center content-center'>
            <div className='relative'>
              <button onClick={() => setCartOpen(true)} className='text-black cursor-pointer relative'>
                <ShoppingCart />
                {cartCount > 0 && (
                  <span className='absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full'>{cartCount > 9 ? '9+' : cartCount}</span>
                )}
              </button>
            </div>
            <button className='text-black cursor-pointer' onClick={() => setMenuOpen(true)}>
              <Menu />
            </button>
          </div>
        </div>
      </nav>
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} cartCount={cartCount} onContinuePurchase={handleContinuePurchase} />
    </>

  )
}
