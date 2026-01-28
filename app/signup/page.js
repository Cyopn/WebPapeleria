'use client'
import Image from 'next/image'
import { useState } from 'react'
import { useToast } from '@/context/toast_context'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { showToast } = useToast()
    function showError(msg) { try { showToast(msg, { type: 'error' }) } catch (e) { console.error('[SignupPage] showToast fallo', e) } }
    const router = useRouter()

    async function handleSubmit(e) {
        e.preventDefault()

        if (password !== confirmPassword) {
            showError('Las contraseñas no coinciden')
            return
        }

        if (password.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres')
            return
        }

        setLoading(true)
        try {
            const token = (typeof window !== 'undefined' && localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user'))?.token : null
            const listRes = await fetch(`/api/users`, {
                method: 'GET',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    Accept: 'application/json',
                },
            })

            if (!listRes.ok) {
                const errBody = await listRes.text().catch(() => '')
                throw new Error(errBody || `Error listando usuarios: ${listRes.status}`)
            }

            const users = await listRes.json().catch(() => [])
            const exists = Array.isArray(users) && users.some(u => (u.username || u.user?.username || '').toString().toLowerCase() === username.toLowerCase())
            if (exists) {
                throw new Error('El usuario ya existe')
            }

            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    names: firstName,
                    lastnames: lastName,
                    username: username,
                    email: email,
                    password: password,
                    role: 'default',
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Registro falló')
            localStorage.setItem('user', JSON.stringify(data))
            router.push('/')
        } catch (err) {
            showError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className='text-center'>
            <div className='absolute top-0 w-full h-full flex flex-row justify-end items-center content-center'>
                <div className='relative top-0 w-full h-full flex justify-center items-center'>
                    <div className=' absolute w-full h-full object-cover z-[0] bg-[#00000026]'>
                    </div>
                    <Image
                        src='/images/bg-signup.png'
                        alt='bg'
                        className='absolute left-0 w-[80%] h-full h-full rounded-r-[280px]'
                        width={2380}
                        height={1483}
                        loading='eager' />
                </div>
                <div className=' flex pt-[100px] flex-row justify-end items-center content-center absolute top-0 z-[3] w-full h-full'>
                    <div className='flex flex-col bg-white w-[30%] rounded-4xl text-black inset-shadow-sm inset-shadow-gray-500 shadow-xl/20'>
                        <h1 className='text-4xl pt-10 pb-5'>Registrate</h1>
                        <span className='fi fi-sr-user text-6xl py-2'></span>
                        <form onSubmit={handleSubmit} className='flex flex-col items-center justify-center w-full text-black'>
                            <div className='relative w-[45%] py-5'>
                                <div className='absolute inset-y-0 start-0 flex items-center pointer-events-none'>
                                    <span className='items-center px-3 text-sm w-4 h-4'>
                                        <span className='fi fi-sr-user'></span>
                                    </span>
                                </div>
                                <input className='block py-2 w-full p-2.5 w-full z-20 text-gray-700 rounded-full bg-gray-200/80 text-center' value={firstName} onChange={e => setFirstName(e.target.value)} placeholder='Nombre' required />
                            </div>
                            <div className='relative w-[45%] py-5'>
                                <div className='absolute inset-y-0 start-0 flex items-center pointer-events-none'>
                                    <span className='items-center px-3 text-sm w-4 h-4'>
                                        <span className='fi fi-sr-user'></span>
                                    </span>
                                </div>
                                <input className='block py-2 w-full p-2.5 w-full z-20 text-gray-700 rounded-full bg-gray-200/80 text-center' value={lastName} onChange={e => setLastName(e.target.value)} placeholder='Apellidos' required />
                            </div>
                            <div className='relative w-[45%] py-5'>
                                <div className='absolute inset-y-0 start-0 flex items-center pointer-events-none'>
                                    <span className='items-center px-3 text-sm w-4 h-4'>
                                        <span className='fi fi-sr-user'></span>
                                    </span>
                                </div>
                                <input className='block py-2 w-full p-2.5 w-full z-20 text-gray-700 rounded-full bg-gray-200/80 text-center' value={username} onChange={e => setUsername(e.target.value)} placeholder='Usuario' required />
                            </div>
                            <div className='relative w-[45%] py-5'>
                                <div className='absolute inset-y-0 start-0 flex items-center pointer-events-none'>
                                    <span className='items-center px-3 text-sm w-4 h-4'>
                                        <span className='fi fi-sr-at'></span>
                                    </span>
                                </div>
                                <input className='block py-2 w-full p-2.5 w-full z-20 text-gray-700 rounded-full bg-gray-200/80 text-center' value={email} onChange={e => setEmail(e.target.value)} placeholder='Correo' type='email' required />
                            </div>
                            <div className='relative w-[45%] py-5'>
                                <div className='absolute inset-y-0 start-0 flex items-center pointer-events-none'>
                                    <span className='items-center px-3 text-sm w-4 h-4'>
                                        <span className='fi fi-sr-lock'></span>
                                    </span>
                                </div>
                                <input className='block py-2 w-full p-2.5 w-full z-20 text-gray-700 rounded-full bg-gray-200/80 text-center' value={password} onChange={e => setPassword(e.target.value)} placeholder='Contraseña' type='password' required />
                            </div>
                            <div className='relative w-[45%] py-5'>
                                <div className='absolute inset-y-0 start-0 flex items-center pointer-events-none'>
                                    <span className='items-center px-3 text-sm w-4 h-4'>
                                        <span className='fi fi-sr-lock'></span>
                                    </span>
                                </div>
                                <input className='block py-2 w-full p-2.5 w-full z-20 text-gray-700 rounded-full bg-gray-200/80 text-center' value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder='Confirmar contraseña' type='password' required />
                            </div>
                            <div className='pt-5 pb-10'>
                                <button type='submit' disabled={loading}
                                    className='text-black text-xl px-5 p-3 rounded-xl bg-gradient-to-r from-[#FFE417] to-[#FDBD4A] cursor-pointer disabled:opacity-50'
                                >
                                    {loading ? 'Registrando...' : 'Registrarse'}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className='w-10 h-full'>
                    </div>
                </div>
            </div>
        </section>
    )
}