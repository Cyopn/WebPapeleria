'use client'
import Image from 'next/image'
import { useState, useRef, useEffect, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { useToast } from '@/context/toast_context'

export default function AccountPage() {
    const { showToast, dismissToast } = useToast()
    const defaultForm = { name: '', username: '', email: '', phone: '', avatar: '' }
    const [passwordModalOpen, setPasswordModalOpen] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [state, setState] = useState(() => {
        if (typeof window === 'undefined') return { userId: null, form: defaultForm }
        try {
            const raw = localStorage.getItem('user')
            if (!raw) return { userId: null, form: defaultForm }
            const parsed = JSON.parse(raw)
            const u = parsed?.user || parsed || {}
            const id = parsed?.user?.id_user ?? parsed?.user?.id ?? parsed?.id_user ?? parsed?.id ?? u?.id_user ?? u?.id ?? null
            return {
                userId: id,
                form: {
                    name: u.names || u.nombre || '',
                    username: u.username || '',
                    email: u.email || u.correo || '',
                    phone: u.phone || u.telefono || u.phone || '',
                    avatar: u.avatar || u.photo || u.profileImageUrl || '/images/no-image.png'
                }
            }
        } catch (e) {
            console.error('[AccountPage] error reading local user', e)
            return { userId: null, form: defaultForm }
        }
    })
    const unsavedToastRef = useRef(null)
    const avatarInputRef = useRef(null)
    const avatarObjectUrlRef = useRef(null)
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [avatarBlob, setAvatarBlob] = useState(null)
    const [cropOpen, setCropOpen] = useState(false)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const [originalForm, setOriginalForm] = useState(() => {
        if (typeof window === 'undefined') return defaultForm
        try {
            const raw = localStorage.getItem('user')
            console.log('Cargando usuario para originalForm, raw:', raw)
            if (!raw) return defaultForm
            const parsed = JSON.parse(raw)
            const u = parsed?.user || parsed || {}
            return {
                name: u.names || u.nombre || '',
                username: u.username || '',
                email: u.email || u.correo || '',
                phone: u.phone || u.telefono || u.phone || '',
                avatar: u.avatar || u.photo || u.profileImageUrl || '/images/no-image.png'
            }
        } catch (e) {
            return defaultForm
        }
    })

    function resolveAvatarSrc(avatarValue) {
        console.log('Resolviendo avatar para valor:', avatarValue)
        if (!avatarValue) return '/images/no-image.png'
        const val = String(avatarValue).trim()
        if (val === 'null' || val === 'undefined') return '/images/no-image.png'
        if (!val) return '/images/no-image.png'
        if (
            val.startsWith('http://') ||
            val.startsWith('https://') ||
            val.startsWith('blob:') ||
            val.startsWith('data:') ||
            val.startsWith('/images/') ||
            val.startsWith('/api/file-manager/download/')
        ) {
            return val
        }
        if (val.startsWith('file-manager/download/')) {
            return `/api/${val}`
        }
        return `/api/file-manager/download/avatar/${encodeURIComponent(val)}`
    }

    function isSameForm(a, b) {
        return a.name === b.name && a.username === b.username && a.email === b.email && a.phone === b.phone && a.avatar === b.avatar
    }

    function handleChange(field, value) {
        setState((s) => ({ ...s, form: { ...s.form, [field]: value } }))
    }

    function openPasswordModal() {
        setPasswordModalOpen(true)
    }

    function closePasswordModal() {
        setPasswordModalOpen(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setShowCurrentPassword(false)
        setShowNewPassword(false)
        setShowConfirmPassword(false)
        setPasswordLoading(false)
    }

    async function handlePasswordConfirm() {
        if (passwordLoading) return
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Completa todos los campos de contraseña', { type: 'error' })
            return
        }
        if (newPassword !== confirmPassword) {
            showToast('Las contraseñas no coinciden', { type: 'error' })
            return
        }
        try {
            if (!state.userId) {
                showToast('No se encontró id de usuario', { type: 'error' })
                return
            }

            const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
            const parsed = raw ? JSON.parse(raw) : null
            const token = parsed?.token || null

            if (!token) {
                showToast('No se encontró token de sesión', { type: 'error' })
                return
            }

            setPasswordLoading(true)
            const res = await fetch(`/api/users/${state.userId}/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            })

            const data = await res.json().catch(() => null)
            if (!res.ok) {
                showToast((data && data.error) || 'No se pudo cambiar la contraseña', { type: 'error' })
                return
            }

            showToast('Contraseña actualizada', { type: 'success' })
            closePasswordModal()
        } catch (err) {
            console.error('[AccountPage] change password failed', err)
            showToast('Error al cambiar la contraseña', { type: 'error' })
        } finally {
            setPasswordLoading(false)
        }
    }

    const handleResetToOriginal = useCallback((e) => {
        e?.stopPropagation?.()
        e?.preventDefault?.()
        setState((s) => ({ ...s, form: originalForm }))
        if (avatarObjectUrlRef.current) {
            try { URL.revokeObjectURL(avatarObjectUrlRef.current) } catch (err) { }
            avatarObjectUrlRef.current = null
        }
        setAvatarPreview(null)
        setAvatarBlob(null)
        closeCrop()
        try {
            dismissToast(unsavedToastRef.current)
        } catch (err) {
            console.error('[AccountPage] dismissToast fallo', err)
        }
        unsavedToastRef.current = null
    }, [originalForm, dismissToast])

    function openAvatarPicker() {
        avatarInputRef.current?.click?.()
    }

    function handleAvatarFileChange(e) {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type?.startsWith('image/')) {
            showToast('Selecciona una imagen válida', { type: 'error' })
            return
        }
        try {
            if (avatarObjectUrlRef.current) URL.revokeObjectURL(avatarObjectUrlRef.current)
            const url = URL.createObjectURL(file)
            avatarObjectUrlRef.current = url
            setAvatarPreview(url)
            setAvatarBlob(file)
            setCropOpen(true)
        } catch (err) {
            console.error('[AccountPage] error creando preview de avatar', err)
            showToast('No se pudo cargar la imagen', { type: 'error' })
        } finally {
            try { e.target.value = '' } catch (error) { }
        }
    }

    function closeCrop() {
        setCropOpen(false)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setRotation(0)
    }

    function onCropComplete(_croppedArea, nextCroppedAreaPixels) {
        setCroppedAreaPixels(nextCroppedAreaPixels)
    }

    function getRadianAngle(degreeValue) {
        return (degreeValue * Math.PI) / 180
    }

    function rotateSize(width, height, rotationDeg) {
        const rotRad = getRadianAngle(rotationDeg)
        return {
            width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
            height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
        }
    }

    async function createImage(url) {
        return await new Promise((resolve, reject) => {
            const img = (typeof window !== 'undefined' && window.Image) ? new window.Image() : document.createElement('img')
            img.setAttribute('crossOrigin', 'anonymous')
            img.onload = () => resolve(img)
            img.onerror = (e) => reject(e)
            img.src = url
        })
    }

    async function getCroppedImg(imageSrc, pixelCrop, rotationDeg = 0) {
        const image = await createImage(imageSrc)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        const rotRad = getRadianAngle(rotationDeg)
        const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotationDeg)

        canvas.width = bBoxWidth
        canvas.height = bBoxHeight

        ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
        ctx.rotate(rotRad)
        ctx.translate(-image.width / 2, -image.height / 2)
        ctx.drawImage(image, 0, 0)

        const croppedCanvas = document.createElement('canvas')
        const croppedCtx = croppedCanvas.getContext('2d')

        croppedCanvas.width = pixelCrop.width
        croppedCanvas.height = pixelCrop.height

        croppedCtx.drawImage(
            canvas,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        )

        return await new Promise((resolve, reject) => {
            croppedCanvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas vacío'))
                    return
                }
                resolve(blob)
            }, 'image/jpeg')
        })
    }

    async function applyCrop() {
        if (!avatarPreview || !croppedAreaPixels) return
        try {
            const blob = await getCroppedImg(avatarPreview, croppedAreaPixels, rotation)
            const nextUrl = URL.createObjectURL(blob)
            if (avatarObjectUrlRef.current) {
                try { URL.revokeObjectURL(avatarObjectUrlRef.current) } catch (e) { }
            }
            avatarObjectUrlRef.current = nextUrl
            setAvatarPreview(nextUrl)
            setAvatarBlob(blob)
            closeCrop()
        } catch (err) {
            console.error('[AccountPage] error aplicando recorte/rotación', err)
            showToast('No se pudo ajustar la imagen', { type: 'error' })
        }
    }

    const handleSave = useCallback(async () => {
        if (!state.userId) {
            showToast('No se encontró id de usuario', { type: 'error' })
            return
        }
        try {
            let avatarValue = state.form.avatar
            if (avatarBlob) {
                const rawUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
                const parsedUser = rawUser ? JSON.parse(rawUser) : null
                const username = parsedUser?.user?.username || ''
                const token = parsedUser?.token || null

                const avatarFilename = `avatar-${state.userId}-${Date.now()}.jpg`
                const fd = new FormData()
                fd.append('files', avatarBlob, avatarFilename)
                fd.append('username', username)

                const uploadRes = await fetch('/api/file-manager?service=avatar', {
                    method: 'POST',
                    headers: {
                        Accept: '*/*',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: fd,
                })

                if (!uploadRes.ok) {
                    const txt = await uploadRes.text().catch(() => '')
                    throw new Error(txt || `Error subiendo avatar: ${uploadRes.status}`)
                }

                const uploadData = await uploadRes.json().catch(() => null)
                const uploadItem = Array.isArray(uploadData) ? uploadData[0] : uploadData

                const fileRecordRes = await fetch('/api/file', {
                    method: 'POST',
                    headers: {
                        Accept: '*/*',
                        'Content-Type': 'application/json; charset=utf-8',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        id_user: state.userId,
                        resList: [uploadItem],
                    }),
                })

                if (!fileRecordRes.ok) {
                    const txt = await fileRecordRes.text().catch(() => '')
                    throw new Error(txt || `Error creando registro de avatar: ${fileRecordRes.status}`)
                }

                avatarValue = uploadItem?.storedName || uploadItem?.filehash || avatarValue
            }

            const res = await fetch(`/api/users/${state.userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    names: state.form.name,
                    username: state.form.username,
                    email: state.form.email,
                    phone: state.form.phone,
                    avatar: avatarValue,
                }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                showToast((data && data.error) || 'Error actualizando usuario', { type: 'error' })
                return
            }
            try {
                const raw = localStorage.getItem('user')
                if (raw) {
                    const parsed = JSON.parse(raw)
                    const u = parsed?.user || parsed || {}
                    const merged = { ...u, names: state.form.name, username: state.form.username, email: state.form.email, phone: state.form.phone, avatar: avatarValue }
                    const toStore = parsed?.user ? { ...parsed, user: merged } : merged
                    localStorage.setItem('user', JSON.stringify(toStore))
                }
            } catch (e) {
                console.error('[AccountPage] error updating localStorage', e)
            }
            setState((s) => ({ ...s, form: { ...s.form, avatar: avatarValue } }))
            setOriginalForm((prev) => ({ ...prev, ...state.form, avatar: avatarValue }))
            if (avatarObjectUrlRef.current) {
                try { URL.revokeObjectURL(avatarObjectUrlRef.current) } catch (e) { }
                avatarObjectUrlRef.current = null
            }
            setAvatarPreview(null)
            setAvatarBlob(null)
            try {
                dismissToast(unsavedToastRef.current)
            } catch (e) {
                console.error('[AccountPage] dismissToast fallo', e)
            }
            showToast('Perfil actualizado', { type: 'success' })
        } catch (err) {
            console.error('[AccountPage] update failed', err)
            showToast(err?.message || 'Error actualizando usuario', { type: 'error' })
        }
    }, [state.userId, state.form, avatarBlob, showToast, dismissToast])

    useEffect(() => {
        const hasChanges = !isSameForm(state.form, originalForm) || !!avatarPreview || !!avatarBlob
        const isUnsavedToastVisible = !!unsavedToastRef.current
        if (hasChanges && !isUnsavedToastVisible) {
            const toastElement = (
                <div className='flex items-center justify-between gap-3'>
                    <span>Hay cambios sin guardar</span>
                    <div className='flex items-center gap-2'>
                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleResetToOriginal(e) }} className='px-3 py-1 bg-white text-black rounded cursor-pointer'>Reestablecer</button>
                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleSave() }} className='px-3 py-1 bg-white text-black rounded cursor-pointer'>Guardar</button>
                    </div>
                </div>
            )
            try {
                const id = showToast(toastElement, { type: 'info', duration: 86400000 })
                unsavedToastRef.current = id
            } catch (e) {
                console.error('[AccountPage] showToast fallo', e)
            }
            return
        }

        if (!hasChanges && isUnsavedToastVisible) {
            try {
                dismissToast(unsavedToastRef.current)
            } catch (e) {
                console.error('[AccountPage] dismissToast fallo', e)
            }
            unsavedToastRef.current = null
        }
    }, [state.form, originalForm, avatarPreview, avatarBlob, showToast, dismissToast, handleSave, handleResetToOriginal])

    useEffect(() => {
        return () => {
            if (avatarObjectUrlRef.current) {
                try { URL.revokeObjectURL(avatarObjectUrlRef.current) } catch (e) { }
            }
        }
    }, [])

    return (
        <section className='text-center'>
            <div className='relative top-[104px] w-full h-[89vh] flex justify-center items-center'>
                <div className='w-full h-full flex'>
                    <div className='w-1/4 shadow-lg inset-shadow-sm inset-shadow-gray-500'>
                        <div className='w-full h-full flex flex-col items-center gap-5'>
                            <button type='button' onClick={openPasswordModal} className='w-[90%] flex items-center justify-center p-2 m-5 text-black bg-white rounded-lg shadow hover:bg-gray-200 transition-colors text-xl cursor-pointer'>
                                <span className='fi fi-tr-password-lock text-2xl text-black pr-2'></span>
                                Cambiar contraseña
                            </button>
                        </div>
                    </div>
                    <div className='w-3/4 flex flex-col justify-center items-center'>
                        <h1 className='text-4xl font-bold mb-13 text-black'>Administración de cuenta</h1>
                        <form className='flex flex-col items-center w-[85%] mx-10 bg-white rounded-xl p-2 shadow-lg inset-shadow-sm inset-shadow-gray-500'>
                            <div className='w-full flex flex-col items-center justify-center py-2'>
                                <div className='relative h-[193px] w-[193px]'>
                                    <Image
                                        src={avatarPreview || resolveAvatarSrc(state.form.avatar)}
                                        alt={state.form.name || 'avatar'}
                                        className='h-full w-full rounded-full object-cover'
                                        width={193}
                                        height={193}
                                        loading='eager' />
                                    <div className='absolute bottom-2 right-2'>
                                        <button type='button' onClick={openAvatarPicker} className='h-10 w-10 rounded-full bg-[#D9D9D9C9] text-black font-bold cursor-pointer flex items-center justify-center'>
                                            <span className='fi fi-br-pencil text-lg'></span>
                                        </button>
                                    </div>
                                    <input ref={avatarInputRef} type='file' accept='image/*' className='hidden' onChange={handleAvatarFileChange} />
                                </div>
                            </div>
                            {cropOpen && (
                                <div onClick={closeCrop} className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/60'>
                                    <div onClick={(e) => e.stopPropagation()} className='bg-white rounded-xl w-[80vw] max-w-3xl p-4'>
                                        <div className='flex justify-between items-center mb-3'>
                                            <h3 className='text-lg font-semibold text-black'>Ajustar imagen</h3>
                                            <div className='flex gap-2'>
                                                <button type='button' onClick={closeCrop} className='px-3 py-1 rounded bg-gray-200 text-black cursor-pointer'>Cancelar</button>
                                                <button type='button' onClick={applyCrop} className='px-3 py-1 rounded bg-blue-600 text-white cursor-pointer'>Aplicar</button>
                                            </div>
                                        </div>
                                        <div className='relative h-[60vh]'>
                                            <Cropper
                                                image={avatarPreview || resolveAvatarSrc(state.form.avatar)}
                                                crop={crop}
                                                zoom={zoom}
                                                rotation={rotation}
                                                aspect={1}
                                                onCropChange={setCrop}
                                                onZoomChange={setZoom}
                                                onRotationChange={setRotation}
                                                onCropComplete={onCropComplete}
                                            />
                                        </div>
                                        <div className='mt-3 flex items-center gap-3'>
                                            <label className='text-sm text-black'>Zoom</label>
                                            <input type='range' min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
                                            <label className='text-sm text-black'>{zoom}</label>
                                        </div>
                                        <div className='mt-3 flex items-center gap-3'>
                                            <label className='text-sm text-black'>Rotación</label>
                                            <input type='range' min={0} max={360} step={1} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
                                            <label className='text-sm text-black'>{rotation}°</label>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className='w-[85%] py-1 text-gray-500 py-3'>
                                <label>Nombre</label>
                                <input value={state.form.name} onChange={(e) => handleChange('name', e.target.value)} className='block w-full p-2 rounded-full bg-gray-100 text-center' />
                            </div>
                            <div className='w-[85%] py-1 text-gray-500 py-3'>
                                <label>Nombre de usuario</label>
                                <input value={state.form.username} onChange={(e) => handleChange('username', e.target.value)} className='block w-full p-2 rounded-full bg-gray-100 text-center' />
                            </div>
                            <div className='w-[85%] py-1 text-gray-500 py-3'>
                                <label>Correo</label>
                                <input value={state.form.email} onChange={(e) => handleChange('email', e.target.value)} className='block w-full p-2 rounded-full bg-gray-100 text-center' />
                            </div>
                            <div className='w-[85%] py-1 text-gray-500 py-3'>
                                <label>Número de teléfono</label>
                                <input value={state.form.phone} onChange={(e) => handleChange('phone', e.target.value)} className='block w-full p-2 rounded-full bg-gray-100 text-center' />
                            </div>
                        </form>

                        {passwordModalOpen && (
                            <div onClick={closePasswordModal} className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4'>
                                <div onClick={(e) => e.stopPropagation()} className='w-full max-w-3xl overflow-hidden rounded-3xl bg-[#E5E5E5] shadow-xl'>
                                    <div className='bg-blue-300 px-6 py-4'>
                                        <h2 className='text-left text-5xl font-semibold text-black'>Cambiar contraseña</h2>
                                    </div>
                                    <div className='px-18 py-12'>
                                        <div className='mb-10'>
                                            <label className='mb-3 block text-left text-3xl font-semibold text-black'>Contraseña actual</label>
                                            <div className='relative'>
                                                <input
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className='w-full rounded-2xl border-2 border-gray-400 bg-transparent px-5 py-4 pr-16 text-2xl text-black outline-none'
                                                />
                                                <button type='button' onClick={() => setShowCurrentPassword((v) => !v)} className='absolute right-4 top-1/2 -translate-y-1/2 text-3xl text-[#3E1B1B] cursor-pointer'>
                                                    <span className={`fi ${showCurrentPassword ? 'fi-rr-eye' : 'fi-rr-eye-crossed'}`}></span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className='mb-10'>
                                            <label className='mb-3 block text-left text-3xl font-semibold text-black'>Contraseñas nueva</label>
                                            <div className='relative'>
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className='w-full rounded-2xl border-2 border-gray-400 bg-transparent px-5 py-4 pr-16 text-2xl text-black outline-none'
                                                />
                                                <button type='button' onClick={() => setShowNewPassword((v) => !v)} className='absolute right-4 top-1/2 -translate-y-1/2 text-3xl text-[#3E1B1B] cursor-pointer'>
                                                    <span className={`fi ${showNewPassword ? 'fi-rr-eye' : 'fi-rr-eye-crossed'}`}></span>
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className='mb-3 block text-left text-3xl font-semibold text-black'>Confirmación de contraseña</label>
                                            <div className='relative'>
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className='w-full rounded-2xl border-2 border-gray-400 bg-transparent px-5 py-4 pr-16 text-2xl text-black outline-none'
                                                />
                                                <button type='button' onClick={() => setShowConfirmPassword((v) => !v)} className='absolute right-4 top-1/2 -translate-y-1/2 text-3xl text-[#3E1B1B] cursor-pointer'>
                                                    <span className={`fi ${showConfirmPassword ? 'fi-rr-eye' : 'fi-rr-eye-crossed'}`}></span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className='mt-16 flex items-center justify-between'>
                                            <button type='button' disabled={passwordLoading} onClick={handlePasswordConfirm} className='min-w-[220px] rounded-2xl bg-gradient-to-r from-blue-400 to-blue-500 px-8 py-3 text-3xl font-semibold text-[#001B57] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'>
                                                {passwordLoading ? 'Guardando...' : 'confirmación'}
                                            </button>
                                            <button type='button' onClick={closePasswordModal} className='px-8 py-3 text-4xl font-semibold text-black cursor-pointer'>
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}