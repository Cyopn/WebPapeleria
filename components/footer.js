'use client';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className='bg-gray-800 text-white py-3 mt-10'>
            <div className='flex flex-col justify-left px-10 py-2 gap-2'>
                <div className='container mx-auto text-center text-md'>
                    <p>Navegación</p>
                </div>
                <div className='flex w-full justify-evenly text-sm'>
                    <Link href='/' className='hover:text-yellow-300 transition'>Inicio</Link>
                    <Link href='/prints' className='hover:text-yellow-300 transition'>Impresiones</Link>
                    <Link href='/products' className='hover:text-yellow-300 transition'>Productos</Link>
                    <Link href='/services' className='hover:text-yellow-300 transition'>Servicios Especiales</Link>
                    <Link href='/services/bound/' className='hover:text-yellow-300 transition'>Encuadernado e Impresión</Link>
                    <Link href='/services/spiral/' className='hover:text-yellow-300 transition'>Anillado e Impresión</Link>
                    <Link href='/services/docs/' className='hover:text-yellow-300 transition'>Documentos Especiales</Link>
                    <Link href='/services/photo/' className='hover:text-yellow-300 transition'>Impresión de Fotografía</Link>
                </div>
                <div className='text-center text-md'>
                    <p>Contacto</p>
                </div>
                <div className='flex w-full justify-evenly text-sm'>
                    <label>Correo:</label>
                    <label>Teléfono:</label>
                    <label>Dirección:</label>
                    <label>Horario:</label>
                </div>
            </div>
            <div className='container mx-auto text-center text-md'>
                <p>Office TESChi - Centro de Cooperación Académica Industrial CCAI</p>
                <p>Imprime tu mundo con color, creatividad y calidad.</p>
                <p>&copy; {new Date().getFullYear()} Office TESChi. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
}