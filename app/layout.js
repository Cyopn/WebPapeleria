import './globals.css'
import '../styles/animation.css'
import Navbar from '@/components/navbar'
import { AuthProvider } from '@/context/auth_context'

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
          <Navbar />
        </AuthProvider>
        <main className="h-full">{children}</main>
      </body>
    </html>
  )
}
