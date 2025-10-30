'use-client'
import Image from 'next/image'
import Link from 'next/link'

export default function SignUpPage() {
    return (
        <section className="text-center">
            <div className="absolute top-0 w-full h-full flex flex-row justify-end items-center content-center">
                <div className="relative top-0 w-full h-full flex justify-center items-center">
                    <div className=" absolute w-full h-full object-cover z-[0] bg-[#00000026]">
                    </div>
                    <Image
                        src="/images/bg-signup.png"
                        alt="bg"
                        className="absolute left-0 w-[80%] h-full h-full rounded-r-[280px]"
                        width={2380}
                        height={1483}
                        loading="eager" />
                </div>
                <div className=" flex flex-row justify-end items-center content-center absolute top-0 z-[3] w-full h-full">
                    <div className="flex flex-col bg-white w-[30%] rounded-4xl text-black inset-shadow-sm inset-shadow-gray-500 shadow-xl/20">
                        <h1 className="text-4xl pt-10 pb-5">Bienvenido</h1>
                        <span className="fi fi-sr-user text-8xl py-8"></span>
                        <form className="flex flex-col items-center justify-center w-full text-black">
                            <div className="relative w-[45%] py-5">
                                <div className="absolute inset-y-0 start-0 flex items-center pointer-events-none">
                                    <span className="items-center px-3 text-sm w-4 h-4">
                                        <span className="fi fi-sr-user"></span>
                                    </span>
                                </div>
                                <input className="block py-2 w-full p-2.5 w-full z-20 text-gray-700 rounded-full bg-gray-200/80 text-center" placeholder="Nombre" required />
                            </div>
                            <div className="relative w-[45%] py-5">
                                <div className="absolute inset-y-0 start-0 flex items-center pointer-events-none">
                                    <span className="items-center px-3 text-sm w-4 h-4">
                                        <span className="fi fi-sr-user"></span>
                                    </span>
                                </div>
                                <input className="block py-2 w-full p-2.5 w-full z-20 text-gray-700 rounded-full bg-gray-200/80 text-center" placeholder="Apellidos" required />
                            </div>
                            <div className="relative w-[45%] py-5">
                                <div className="absolute inset-y-0 start-0 flex items-center pointer-events-none">
                                    <span className="items-center px-3 text-sm w-4 h-4">
                                        <span className="fi fi-sr-user"></span>
                                    </span>
                                </div>
                                <input className="block py-2 w-full p-2.5 w-full z-20 text-gray-700 rounded-full bg-gray-200/80 text-center" placeholder="Usuario" required />
                            </div>
                            <div className="relative w-[45%] py-5">
                                <div className="absolute inset-y-0 start-0 flex items-center pointer-events-none">
                                    <span className="items-center px-3 text-sm w-4 h-4">
                                        <span className="fi fi-sr-user"></span>
                                    </span>
                                </div>
                                <input className="block py-2 w-full p-2.5 w-full z-20 text-gray-700 rounded-full bg-gray-200/80 text-center" placeholder="Correo" required />
                            </div>
                            <div className="relative w-[45%] py-5">
                                <div className="absolute inset-y-0 start-0 flex items-center pointer-events-none">
                                    <span className="items-center px-3 text-sm w-4 h-4">
                                        <span className="fi fi-sr-user"></span>
                                    </span>
                                </div>
                                <input className="block py-2 w-full p-2.5 w-full z-20 text-gray-700 rounded-full bg-gray-200/80 text-center" placeholder="Contraseña" required />
                            </div>
                            <div className="relative w-[45%] py-5">
                                <div className="absolute inset-y-0 start-0 flex items-center pointer-events-none">
                                    <span className="items-center px-3 text-sm w-4 h-4">
                                        <span className="fi fi-sr-lock"></span>
                                    </span>
                                </div>
                                <input className="block py-2 w-full p-2.5 w-full z-20 text-gray-700 rounded-full bg-gray-200/80 text-center" placeholder="Confirmar contraseña" required />
                            </div>
                            <div className="pt-10 pb-30">
                                <Link
                                    href="/"
                                    className="text-black text-xl px-5 p-3 rounded-xl bg-gradient-to-r from-[#FFE417] to-[#FDBD4A]"
                                >
                                    Registrarse
                                </Link>
                            </div>
                        </form>
                    </div>
                    <div className="w-10 h-full">
                    </div>
                </div>
            </div>
        </section>
    )
}