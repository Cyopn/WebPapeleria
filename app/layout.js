import './globals.css'
import '../styles/animation.css'
import Navbar from '@/components/navbar'
import { AuthProvider } from '@/context/auth_context'
import { ToastProvider } from '@/context/toast_context'

export const metadata = {
  title: 'Papelería Online',
  description: 'Gestor de impresiones, productos y servicios especiales',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="h-full">{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
