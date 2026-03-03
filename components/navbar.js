'use client'
import Link from 'next/link'
import { ShoppingCart, Menu, Search, Trash2, PlusCircle, MinusCircle } from 'lucide-react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth_context'
import { usePayment } from '@/context/payment_context'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [noResults, setNoResults] = useState(false)
  const router = useRouter()
  const normalize = (str) => {
    if (!str) return ''
    try {
      return String(str).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    } catch (e) {
      return String(str).toLowerCase()
    }
  }

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

  useEffect(() => {
    const q = (searchQuery || '').trim()
    let mounted = true
    if (!q) {
      setSuggestions([])
      setLoadingSuggestions(false)
      return
    }
    setLoadingSuggestions(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/type/item?search=${encodeURIComponent(q)}`)
        const data = await res.json().catch(() => null)
        const results = []
        if (data) {
          if (Array.isArray(data.items)) {
            for (const it of data.items) {
              results.push({ type: 'product', id: it.id_item || it.id, name: it.name || it.title || (it.item?.name) || `Producto ${it.id_item || it.id}` })
            }
          }
          if (Array.isArray(data.products)) {
            for (const p of data.products) {
              results.push({ type: 'product', id: p.id_product || p.id, name: p.item?.name || p.description || (p.item && p.item.name) || `Producto ${p.id_product || p.id}` })
            }
          }
          if (Array.isArray(data) && data.length > 0 && results.length === 0) {
            for (const d of data) {
              results.push({ type: 'product', id: d.id || d.id_item || d.id_product, name: d.name || d.description || (d.item?.name) || `Producto ${d.id || d.id_item || d.id_product}` })
            }
          }
        }
        const routeMap = {
          'inicio': '/',
          'impresiones': '/prints',
          'productos': '/products',
          'servicios especiales': '/services',
          'fotografía': '/services/photo',
          'ingresar': '/signin', 'iniciar sesion': '/signin', 'login': '/signin',
          'registrarse': '/signup',
          'anillado e impresíon': '/services/spiral',
          'encuadernado e impresíon': '/services/bound',
          'documentos especiales': '/services/docs',
        }
        const normalizedQuery = normalize(q)
        const pageResults = Object.entries(routeMap).filter(([k]) => normalize(k).includes(normalizedQuery)).map(([k, v]) => ({ type: 'page', target: v, name: k }))

        const matchedProducts = results.filter(r => r.name && normalize(r.name).includes(normalizedQuery))

        const merged = [...pageResults, ...matchedProducts].slice(0, 8)
        if (mounted) {
          setSuggestions(merged)
          setNoResults(merged.length === 0)
        }
      } catch (err) {
        if (mounted) { setSuggestions([]); setNoResults(true) }
      } finally {
        if (mounted) setLoadingSuggestions(false)
      }
    }, 300)
    return () => { mounted = false; clearTimeout(t) }
  }, [searchQuery])

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
              <form className='w-full items-center content-center' onSubmit={async e => {
                e.preventDefault()
                const q = (searchQuery || '').trim()
                if (!q) return
                const slug = q.toLowerCase()
                const routeMap = {
                  'inicio': '/',
                  'impresiones': '/prints',
                  'productos': '/products',
                  'servicios especiales': '/services',
                  'fotografía': '/services/photo',
                  'ingresar': '/signin', 'iniciar sesion': '/signin', 'login': '/signin',
                  'registrarse': '/signup',
                  'anillado e impresíon': '/services/spiral',
                  'encuadernado e impresíon': '/services/bound',
                  'documentos especiales': '/services/docs',
                }
                if (routeMap[slug]) {
                  router.push(routeMap[slug])
                  return
                }
                try {
                  const res = await fetch(`/api/products?search=${encodeURIComponent(q)}`)
                  const data = await res.json().catch(() => null)
                  let id = null
                  if (data) {
                    if (Array.isArray(data.items) && data.items.length === 1) id = data.items[0].id_item
                    else if (Array.isArray(data.products) && data.products.length === 1) id = data.products[0].id_product
                    else if (Array.isArray(data) && data.length === 1) id = data[0].id || data[0].id_item || data[0].id_product || null
                  }
                  if (id) {
                    router.push(`/products?open=${encodeURIComponent(String(id))}`)
                    return
                  }
                } catch (err) {
                }
                router.push(`/products?search=${encodeURIComponent(q)}`)
              }}>
                <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); setNoResults(false) }} className='p-2.5 w-full z-20 text-gray-700 rounded-xl bg-white/80' placeholder='Buscar' required autoComplete='off' />
                <button type='submit' className='absolute top-0 end-0 p-2.5 text-gray-400 items-center '>
                  <Search />
                </button>
                {showSuggestions && (suggestions.length > 0 || loadingSuggestions || noResults) && (
                  <div className='absolute left-0 right-0 mt-2 z-50'>
                    <ul className='bg-white rounded-xl shadow-lg max-h-64 overflow-auto text-left'>
                      {loadingSuggestions && <li className='p-2 text-sm text-gray-800'>Cargando...</li>}
                      {noResults && !loadingSuggestions && <li className='p-2 text-sm text-gray-800'>No se encontraron resultados</li>}
                      {suggestions.map((s, i) => (
                        <li key={`${s.type}-${s.id}-${i}`} onMouseDown={() => {
                          setShowSuggestions(false)
                          setSuggestions([])
                          setSearchQuery('')
                          setNoResults(false)
                          if (s.type === 'page') router.push(s.target)
                          else if (s.type === 'product') router.push(`/products?open=${encodeURIComponent(String(s.id))}`)
                        }} className='p-2 hover:bg-gray-100 cursor-pointer'>
                          <div className='flex justify-between'>
                            <span className='truncate text-black text-sm'>{s.name}</span>
                            <small className='text-gray-600 ml-2'>{s.type === 'page' ? 'Página' : 'Producto'}</small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </form>
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
            <form className='w-full items-center content-center' onSubmit={async e => {
              e.preventDefault()
              const q = (searchQuery || '').trim()
              if (!q) return
              const slug = q.toLowerCase()
              const routeMap = {
                'inicio': '/',
                'impresiones': '/prints',
                'productos': '/products',
                'servicios especiales': '/services',
                'fotografía': '/services/photo',
                'ingresar': '/signin', 'iniciar sesion': '/signin', 'login': '/signin',
                'registrarse': '/signup',
                'anillado e impresíon': '/services/spiral',
                'encuadernado e impresíon': '/services/bound',
                'documentos especiales': '/services/docs',
              }
              if (routeMap[slug]) {
                router.push(routeMap[slug])
                return
              }
              try {
                const res = await fetch(`/api/products/type/item?search=${encodeURIComponent(q)}`)
                const data = await res.json().catch(() => null)
                let id = null
                if (data) {
                  if (Array.isArray(data.items) && data.items.length === 1) id = data.items[0].id_item
                  else if (Array.isArray(data.products) && data.products.length === 1) id = data.products[0].id_product
                  else if (Array.isArray(data) && data.length === 1) id = data[0].id || data[0].id_item || data[0].id_product || null
                }
                if (id) {
                  router.push(`/products?open=${encodeURIComponent(String(id))}`)
                  return
                }
              } catch (err) {
              }
              router.push(`/products?search=${encodeURIComponent(q)}`)
            }}>
              <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); setNoResults(false) }} className='p-2.5 w-full z-20 text-gray-700 rounded-xl bg-white/80' placeholder='Buscar' required autoComplete='off' />
              <button type='submit' className='absolute top-0 end-0 p-2.5 text-gray-400 items-center '>
                <Search />
              </button>
              {showSuggestions && (suggestions.length > 0 || loadingSuggestions || noResults) && (
                <div className='absolute left-0 right-0 mt-2 z-50'>
                  <ul className='bg-white rounded-xl shadow-lg max-h-64 overflow-auto text-left'>
                    {loadingSuggestions && <li className='p-2 text-sm text-gray-800'>Cargando...</li>}
                    {noResults && !loadingSuggestions && <li className='p-2 text-sm text-gray-800'>No se encontraron resultados</li>}
                    {suggestions.map((s, i) => (
                      <li key={`${s.type}-${s.id}-${i}`} onMouseDown={() => {
                        setShowSuggestions(false)
                        setSuggestions([])
                        setSearchQuery('')
                        setNoResults(false)
                        if (s.type === 'page') router.push(s.target)
                        else if (s.type === 'product') router.push(`/products?open=${encodeURIComponent(String(s.id))}`)
                      }} className='p-2 hover:bg-gray-100 cursor-pointer'>
                        <div className='flex justify-between'>
                          <span className='truncate text-black text-sm'>{s.name}</span>
                          <small className='text-gray-600 ml-2'>{s.type === 'page' ? 'Página' : 'Producto'}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </form>
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
