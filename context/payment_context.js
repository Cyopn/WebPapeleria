"use client"
import React, { createContext, useContext, useState } from 'react'
import PaymentModal from '@/components/payment_modal'

const PaymentContext = createContext(null)

export function PaymentProvider({ children }) {
    const [paymentOpen, setPaymentOpen] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState(0)
    const [paymentContext, setPaymentContext] = useState({})

    const openPayment = (amount, context = {}) => {
        setPaymentAmount(amount)
        setPaymentContext(context)
        setPaymentOpen(true)
    }

    const closePayment = () => {
        setPaymentOpen(false)
    }

    const handlePaymentResult = (res) => {
        setPaymentOpen(false)
    }

    return (
        <PaymentContext.Provider value={{ openPayment }}>
            {children}
            <PaymentModal
                open={paymentOpen}
                onClose={closePayment}
                amount={paymentAmount}
                currency="MXN"
                context={paymentContext}
                onPay={handlePaymentResult}
            />
        </PaymentContext.Provider>
    )
}

export function usePayment() {
    const context = useContext(PaymentContext)
    if (!context) {
        throw new Error('usePayment must be used within a PaymentProvider')
    }
    return context
}