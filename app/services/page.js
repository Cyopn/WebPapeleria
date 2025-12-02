'use client'
import Image from 'next/image'
import Link from 'next/link'

export default function PrintPage() {

    return (
        <section className="text-center">
            <div className="absolute top-0 w-full h-full flex justify-center items-center">
                <div className="relative top-0 w-full h-full flex flex-col justify-center items-center">
                    <div className="top-0 w-full h-[65%] z-[1]">
                        <div className="absolute pt-[104px] h-[65%] top-0 w-[50%] top-0 z-[2]">
                            <div className="w-full h-full ">
                                <div
                                    className="w-full h-full flex flex-col justify-center items-start z-[3] text-black font-bold text-5xl opacity-100"
                                    style={{
                                        background: 'linear-gradient(to bottom right, rgba(0,96,234,0.4) 0%, rgba(0,54,132,0.4) 66.666%, rgba(3,239,255,0.4) 66.666%, rgba(3,239,255,0.4) 100%)'
                                    }}
                                >
                                    <span className="text-white px-20 italic">Servicios Especiales</span>
                                </div>
                            </div>
                        </div>
                        <Image
                            src="/images/bg-services.png"
                            alt="bg"
                            className="h-full w-full object-cover"
                            width={2366}
                            height={1456}
                            loading="eager" />
                    </div>
                    <div className="w-full h-[35%] bg-white z-[10] flex flex-row justify-evenly content-center items-center end-0">
                        <Link href="/services/bound" className="h-[80%] w-[22%] hover:shadow-xl rounded rounded-t-[20%] rounded-b-xl overflow-hidden transition-transform duration-300 cursor-pointer">
                            <div className="h-full w-full">
                                <div className="absolute h-[10%] bottom-0 w-[22%]">
                                    <div className="flex justify-center">
                                        <div className="text-white text-2xl font-bold rounded-full bg-[#D9D9D980]">
                                            <span className="px-5">Encuadernado e Impresion</span>
                                        </div>
                                    </div>
                                </div>
                                <Image
                                    src="/images/bg-sp-card1.png"
                                    alt="bg"
                                    className="h-full w-full object-cover"
                                    width={479}
                                    height={307}
                                    loading="eager" />
                            </div>
                        </Link>
                        <Link href="/services/photo" className="h-[80%] w-[22%] hover:shadow-xl rounded rounded-t-[20%] rounded-b-xl overflow-hidden transition-transform duration-300 cursor-pointer">
                            <div className="h-full w-full">
                                <div className="absolute h-[10%] bottom-0 w-[22%]">
                                    <div className="flex justify-center">
                                        <div className="text-white text-2xl font-bold rounded-full bg-[#D9D9D980]">
                                            <span className="px-5">Impresion de Fotografia</span>
                                        </div>
                                    </div>
                                </div>
                                <Image
                                    src="/images/bg-sp-card2.png"
                                    alt="bg"
                                    className="h-full w-full object-cover"
                                    width={542}
                                    height={333}
                                    loading="eager" />
                            </div>
                        </Link>
                        <Link href="/services/spiral" className="h-[80%] w-[22%] hover:shadow-xl rounded rounded-t-[20%] rounded-b-xl overflow-hidden transition-transform duration-300 cursor-pointer">
                            <div className="h-full w-full">
                                <div className="absolute h-[10%] bottom-0 w-[22%]">
                                    <div className="flex justify-center">
                                        <div className="text-white text-2xl font-bold rounded-full bg-[#D9D9D980]">
                                            <span className="px-5">Anillado e Impresion</span>
                                        </div>
                                    </div>
                                </div>
                                <Image
                                    src="/images/bg-sp-card3.png"
                                    alt="bg"
                                    className="h-full w-full object-cover"
                                    width={429}
                                    height={251}
                                    loading="eager" />
                            </div>
                        </Link>
                        <Link href="/services/docs" className="h-[80%] w-[22%] hover:shadow-xl rounded rounded-t-[20%] rounded-b-xl overflow-hidden transition-transform duration-300 cursor-pointer">
                            <div className="h-full w-full">
                                <div className="absolute h-[10%] bottom-0 w-[22%]">
                                    <div className="flex justify-center">
                                        <div className="text-white text-2xl font-bold rounded-full bg-[#D9D9D980]">
                                            <span className="px-5">Documentos Especiales</span>
                                        </div>
                                    </div>
                                </div>
                                <Image
                                    src="/images/bg-sp-card4.png"
                                    alt="bg"
                                    className="h-full w-full object-cover"
                                    width={2294}
                                    height={1060}
                                    loading="eager" />
                            </div>
                        </Link>

                    </div>
                </div>
            </div>
        </section>
    )
} 