'use client'
import Image from 'next/image'

export default function SlideMenu({ open, onClose }) {
    return (
        <div
            className={`fixed inset-0 z-[100] transition-all duration-300 ${open ? 'visible' : 'invisible'
                }`}
        >
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'
                    }`}
            ></div>

            <aside
                className={`absolute top-0 right-0 h-full w-[25%] bg-white rounded-l-4xl oveflow-hidden shadow-2xl transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between pt-1.5 pb-1.5 bg-gradient-to-r from-[#8AD8F2] to-[#318BEF] rounded-tl-4xl  oveflow-hidden">
                    <button
                        onClick={onClose}
                        className="p-1 transition rotate-180"
                    >
                        <span className="pr-4 text-lg text-black cursor-pointer">
                            <span className="fi fi-br-exit"></span>
                        </span>
                    </button>
                </div>

                <nav className="p-4 space-y-3 w-full h-full">
                    <div className="w-full h-full flex flex-col">
                        <div className="w-full h-[25%] flex justify-center items-center py-2">
                            <Image
                                src='/images/no-image.png'
                                alt="w"
                                className="h-[90%] w-auto rounded-full"
                                width={300}
                                height={300}
                                loading="eager" />
                        </div>
                        <div className="w-full flex justify-center items-center text-black py-2">
                            <span className="text-lg">Nombre</span>
                        </div>
                        <div className="w-full flex justify-center items-center text-black text-center py-2">
                            <button className="relative w-[45%] py-5 cursor-pointer">
                                <div className="flex justify-center items-center">
                                    <span className="text-3xl">
                                        <span className="fi fi-rr-shopping-cart-check"></span>
                                    </span>
                                </div>
                                <label className="cursor-pointer">Mis pedidos</label>
                            </button>
                            <button className="relative w-[45%] py-5 cursor-pointer">
                                <div className="flex justify-center items-center">
                                    <span className="text-3xl">
                                        <span className="fi fi-rr-cowbell"></span>
                                    </span>
                                </div>
                                <label className="cursor-pointer">Notificaciones</label>
                            </button>
                        </div>
                        <div className="w-full flex flex-col justify-center items-center text-left py-2">
                            <div className="w-[85%] py-1 text-gray-500 py-3">
                                <label>Nombre</label>
                                <input className="block w-full p-2 w-full rounded-full bg-gray-200 text-center" disabled />
                            </div>
                            <div className="w-[85%] py-1 text-gray-500 py-3">
                                <label>Correo</label>
                                <input className="block w-full p-2 w-full rounded-full bg-gray-200 text-center" disabled />
                            </div>
                            <div className="w-[85%] py-1 text-gray-500 py-3">
                                <label>Numero de telefono</label>
                                <input className="block w-full p-2 w-full rounded-full bg-gray-200 text-center" disabled />
                            </div>
                        </div>
                        <div className="w-full flex flex-col justify-center items-center text-left py-2">
                            <div className="w-full py-3">
                                <a className="text-black text-bold text-center p-3 cursor-pointer flex flex-row justify-between w-full">
                                    <div className="pl-10 w-auto">
                                        <span className="text-xl px-2 h-full text-black">
                                            <span className="fi fi-br-document"></span>
                                        </span>
                                    </div>
                                    <div className="w-full text-left">
                                        <span className="pl-5">Administrador de cuenta</span>
                                    </div>
                                    <div className="pr-10 w-auto">
                                        <span className="flex items-center  text-xl px-2 text-black">
                                            <span className="fi fi-br-exit"></span>
                                        </span>
                                    </div>
                                </a>
                            </div>
                            <div className="w-full py-3">
                                <a className="text-black text-bold text-center p-3 cursor-pointer flex flex-row justify-between w-full">
                                    <div className="pl-10 w-auto">
                                        <span className="text-xl px-2 h-full text-black">
                                            <span className="fi fi-br-document"></span>
                                        </span>
                                    </div>
                                    <div className="w-full text-left">
                                        <span className="pl-5">Historial de pedidos</span>
                                    </div>
                                    <div className="pr-10 w-auto">
                                        <span className="flex items-center  text-xl px-2 text-black">
                                            <span className="fi fi-br-exit"></span>
                                        </span>
                                    </div>
                                </a>
                            </div>
                            <div className="w-full py-3">
                                <a className="text-black text-bold text-center p-3 cursor-pointer flex flex-row justify-between w-full">
                                    <div className="pl-10 w-auto">
                                        <span className="text-xl px-2 h-full text-black">
                                            <span className="fi fi-br-document"></span>
                                        </span>
                                    </div>
                                    <div className="w-full text-left">
                                        <span className="pl-5">Soporte y ayuda</span>
                                    </div>
                                    <div className="pr-10 w-auto">
                                        <span className="flex items-center  text-xl px-2 text-black">
                                            <span className="fi fi-br-exit"></span>
                                        </span>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </nav>
            </aside>
        </div>
    )
}
