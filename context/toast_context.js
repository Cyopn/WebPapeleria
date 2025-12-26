"use client"
import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const ANIM_DURATION = 300

    const showToast = useCallback((message, opts = {}) => {
        const id = Date.now() + Math.random()
        const duration = typeof opts.duration === 'number' ? opts.duration : 1300
        const type = opts.type || 'info'
        const toast = { id, message, type, visible: false }
        setToasts((t) => [...t, toast])

        const enterDelay = 20
        setTimeout(() => {
            setToasts((t) => t.map((x) => (x.id === id ? { ...x, visible: true } : x)))
        }, enterDelay)

        setTimeout(() => {
            setToasts((t) => t.map((x) => (x.id === id ? { ...x, visible: false } : x)))
        }, duration + enterDelay)

        setTimeout(() => {
            setToasts((t) => t.filter((x) => x.id !== id))
        }, duration + ANIM_DURATION + enterDelay)

        return id
    }, [])

    const value = { showToast }

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed bottom-6 left-0 right-0 flex items-end justify-center pointer-events-none z-50">
                <div className="w-full max-w-lg px-4">
                    {toasts.map((t) => {
                        const typeClass = t.type === 'success' ? 'bg-green-600 text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-black/90 text-white'
                        return (
                            <div key={t.id} className="mb-3 pointer-events-auto">
                                <div
                                    className={`py-2 px-4 rounded-lg shadow-lg text-center transform transition-all duration-300 ease-out ${typeClass} ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                                    {t.message}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within ToastProvider')
    return ctx
}

export default ToastProvider
