import Image from "next/image";
import Link from 'next/link'
import ProductCarouselWrapper from "@/components/product_carousel_wrapper";

export default function HomePage() {
    return (
        <section className="text-center">
            <div className="relative top-[104px] w-full h-[65vh] flex justify-center items-center">
                <div className="absolute left-0 w-full h-full bg-[#00000040] z-[2] items-center content-center flex justify-center">
                    <div className="container w-full flex justify-center h-full gap-2 p-10">
                        <Link href="#oficina" className="group relative flex-none basis-[200px] rounded-lg transition-all duration-500 ease-in-out cursor-pointer shadow-[1px_5px_15px_#0872EAA3] overflow-hidden hover:shadow-[1px_3px_15px_#5B6FD79E] hover:-translate-y-2 hover:basis-[350px]">
                            <div className="absolute inset-0">
                                <Image src="/images/bg-product-card1.png" alt="Jane" fill className="object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#02022E]/[0.68] to-transparent" />
                            <div className="relative z-10 content flex flex-col items-center p-4 text-white text-lg opacity-0 translate-y-full transition-all duration-500 delay-200 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible justify-end h-full">
                                <div className="text-white text-2xl font-bold rounded-full bg-[#D9D9D980]">
                                    <span className="px-5">Oficina</span>
                                </div>
                            </div>
                        </Link>
                        <Link href="#papeleria" className="group relative flex-none basis-[200px] rounded-lg transition-all duration-500 ease-in-out cursor-pointer shadow-[1px_5px_15px_#0872EAA3] overflow-hidden hover:shadow-[1px_3px_15px_#5B6FD79E] hover:-translate-y-2 hover:basis-[350px]">
                            <div className="absolute inset-0">
                                <Image src="/images/bg-product-card2.png" alt="Alex" fill className="object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#02022E]/[0.68] to-transparent" />
                            <div className="relative z-10 content flex flex-col items-center p-4 text-white text-lg opacity-0 translate-y-full transition-all duration-500 delay-200 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible justify-end h-full">
                                <div className="text-white text-2xl font-bold rounded-full bg-[#D9D9D980]">
                                    <span className="px-5">Papeleria</span>
                                </div>
                            </div>
                        </Link>
                        <Link href="#arte-y-diseno" className="group relative flex-none basis-[200px] rounded-lg transition-all duration-500 ease-in-out cursor-pointer shadow-[1px_5px_15px_#0872EAA3] overflow-hidden hover:shadow-[1px_3px_15px_#5B6FD79E] hover:-translate-y-2 hover:basis-[350px]">
                            <div className="absolute inset-0">
                                <Image src="/images/bg-product-card3.png" alt="Emily" fill className="object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#02022E]/[0.68] to-transparent" />
                            <div className="relative z-10 content flex flex-col items-center p-4 text-white text-lg opacity-0 translate-y-full transition-all duration-500 delay-200 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible justify-end h-full">
                                <div className="text-white text-2xl font-bold rounded-full bg-[#D9D9D980]">
                                    <span className="px-5">Arte y diseño</span>
                                </div>
                            </div>
                        </Link>
                        <Link href="#otros" className="group relative flex-none basis-[200px] rounded-lg transition-all duration-500 ease-in-out cursor-pointer shadow-[1px_5px_15px_#0872EAA3] overflow-hidden hover:shadow-[1px_3px_15px_#5B6FD79E] hover:-translate-y-2 hover:basis-[350px]">
                            <div className="absolute inset-0">
                                <Image src="/images/bg-product-card4.png" alt="Lisa" fill className="object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#02022E]/[0.68] to-transparent" />
                            <div className="relative z-10 content flex flex-col items-center p-4 text-white text-lg opacity-0 translate-y-full transition-all duration-500 delay-200 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible justify-end h-full">
                                <div className="text-white text-2xl font-bold rounded-full bg-[#D9D9D980]">
                                    <span className="px-5">Otros</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="relative top-[104px] h-[60vh] flex items-center justify-evenly flex-col text-black">
                <h1>Nuestros productos</h1>
                    <div id="oficina" className="p-6 bg-white/5 rounded-lg w-full">
                        <h3 className="text-xl font-semibold text-white">Oficina</h3>
                        <p className="text-sm text-gray-300 mt-2">Productos y servicios de oficina</p>
                    </div>

                    <div id="papeleria" className="p-6 bg-white/5 rounded-lg">
                        <h3 className="text-xl font-semibold text-white">Papeleria</h3>
                        <p className="text-sm text-gray-300 mt-2">Artículos de papelería</p>
                    </div>

                    <div id="arte-y-diseno" className="p-6 bg-white/5 rounded-lg">
                        <h3 className="text-xl font-semibold text-white">Arte y diseño</h3>
                        <p className="text-sm text-gray-300 mt-2">Servicios de arte y diseño</p>
                    </div>

                    <div id="otros" className="p-6 bg-white/5 rounded-lg">
                        <h3 className="text-xl font-semibold text-white">Otros</h3>
                        <p className="text-sm text-gray-300 mt-2">Otras categorías</p>
                    </div>
            </div>
        </section>
    )
}
