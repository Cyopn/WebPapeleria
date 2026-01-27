'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useToast } from '@/context/toast_context'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const [username, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  function showError(msg) { try { showToast(msg, { type: 'error' }) } catch (e) { } }
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromParam = typeof window !== 'undefined' ? searchParams?.get('from') : null

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Login falló');
      localStorage.setItem('user', JSON.stringify(data))
      try {
        if (typeof document !== 'undefined') {
          const cookieValue = encodeURIComponent(JSON.stringify(data?.user || data))
          document.cookie = `user=${cookieValue}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
        }
      } catch (e) {
      }
      let destination = '/'
      try {
        if (fromParam) {
          const decoded = decodeURIComponent(fromParam)
          if (decoded && decoded !== '/signin') destination = decoded
        }
      } catch (e) {
      }
      if (typeof window !== 'undefined') {
        window.location.replace(destination)
      } else {
        router.push(destination)
      }
    } catch (err) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }


  return (
    <section className='text-center'>
      <div className='absolute top-0 w-full h-full flex justify-center items-center'>
        <div className='relative top-0 w-full h-full flex justify-center items-center'>
          <div className='absolute left-0 w-[60%] h-full bg-black/85 z-[2] rounded-r-[300px]'>
          </div>
          <Image
            src='/images/bg-signin.png'
            alt='bg'
            className='absolute w-full h-full object-cover z-[1]'
            width={1055}
            height={1562}
            loading='eager' />
        </div>
        <div className=' flex pt-[100px] flex-col items-center justify-center absolute top-0 z-[3] w-full h-full'>
          <div className='flex flex-col bg-white w-[30%] rounded-4xl text-black inset-shadow-sm inset-shadow-gray-500 shadow-xl/20'>
            <h1 className='text-4xl pt-10 pb-5'>Bienvenido</h1>
            <span className='fi fi-sr-user text-6xl py-2'></span>
            <form onSubmit={handleSubmit} className='flex flex-col items-center justify-center w-full text-black'>
              <div className='relative py-3 w-[45%]'>
                <div className='absolute inset-y-0 start-0 flex items-center pointer-events-none'>
                  <span className='items-center px-3 text-sm w-4 h-4'>
                    <span className='fi fi-sr-user'></span>
                  </span>
                </div>
                <input className='block py-2 w-full p-2.5 w-full z-20 text-gray-700 rounded-full bg-gray-200/80 text-center' value={username} onChange={e => setUser(e.target.value)} placeholder='Usuario' required />
              </div>
              <div className='relative py-3 w-[45%]'>
                <div className='absolute inset-y-0 start-0 flex items-center pointer-events-none'>
                  <span className='items-center px-3 text-sm w-4 h-4'>
                    <span className='fi fi-sr-lock'></span>
                  </span>
                </div>
                <input className='block py-2 w-full p-2.5 w-full z-20 text-gray-700 rounded-full bg-gray-200/80 text-center' value={password} onChange={e => setPassword(e.target.value)} placeholder='Contraseña' type='password' required />
              </div>
              <div className='py-10'>
                <button type='submit' disabled={loading}
                  className='text-black text-xl px-5 p-3 rounded-xl bg-gradient-to-r from-[#FFE417] to-[#FDBD4A] cursor-pointer'
                >
                  {loading ? 'Entrando...' : 'Iniciar sesión'}
                </button>
              </div>
              <div className='pt-10 pb-10'>
                <Link
                  href='/signup'
                  className='text-black text-xl px-5 py-2'
                >
                  Registrarse
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
