import './globals.css'
import '../styles/animation.css'
import Navbar from '@/components/navbar'
import NotificationsListener from '@/components/notifications_listener'
import { AuthProvider } from '@/context/auth_context'
import { ToastProvider } from '@/context/toast_context'
import { PaymentProvider } from '@/context/payment_context'

export const metadata = {
  title: 'Office TESChi',
  description: 'Gestor de impresiones, productos y servicios especiales',
}

export default function RootLayout({ children }) {
  return (
    <html lang='es'>
      <head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <PaymentProvider>
              <Navbar />
              <NotificationsListener />
              <main className='h-full'>{children}</main>

            </PaymentProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
