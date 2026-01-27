import Image from 'next/image';
import Link from 'next/link'
import ProductOficinaWrapper from '@/components/product_oficina_wrapper';
import ProductPapeleriaWrapper from '@/components/product_papeleria_wrapper';
import ProductArteWrapper from '@/components/product_arte_wrapper';
import ProductOtroWrapper from '@/components/product_otro_wrapper';

export default function ProductsPage() {
    return (
        <section className='text-center'>
            <div className='relative top-[104px] w-full h-[65vh] flex justify-center items-center'>
                <div className='absolute left-0 w-full h-full z-[2] items-center content-center flex justify-center' style={{
                    background: 'linear-gradient(to bottom left, rgba(13,35,94,0.9) 0%, rgba(13,35,94,0.9) 66.666%, rgba(119,173,255,0.5) 66.666%, rgba(119,173,255,0.5) 100%)'
                }}>
                    <div className='container w-full flex justify-center h-full gap-2 p-10' >
                        <Link href='#oficina' className='group relative flex-none basis-[200px] rounded-lg transition-all duration-500 ease-in-out cursor-pointer shadow-[1px_5px_15px_#0872EAA3] overflow-hidden hover:shadow-[1px_3px_15px_#5B6FD79E] hover:-translate-y-2 hover:basis-[350px]'>
                            <div className='absolute inset-0'>
                                <Image src='/images/bg-product-card1.png' alt='Jane' fill className='object-cover' />
                            </div>
                            <div className='absolute inset-0 bg-gradient-to-t from-[#02022E]/[0.68] to-transparent' />
                            <div className='relative z-10 content flex flex-col items-center p-4 text-white text-lg opacity-0 translate-y-full transition-all duration-300 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible justify-end h-full'>
                                <div className='text-white text-2xl font-bold rounded-full bg-[#D9D9D980]'>
                                    <span className='px-5'>Oficina</span>
                                </div>
                            </div>
                        </Link>
                        <Link href='#papeleria' className='group relative flex-none basis-[200px] rounded-lg transition-all duration-500 ease-in-out cursor-pointer shadow-[1px_5px_15px_#0872EAA3] overflow-hidden hover:shadow-[1px_3px_15px_#5B6FD79E] hover:-translate-y-2 hover:basis-[350px]'>
                            <div className='absolute inset-0'>
                                <Image src='/images/bg-product-card2.png' alt='Alex' fill className='object-cover' />
                            </div>
                            <div className='absolute inset-0 bg-gradient-to-t from-[#02022E]/[0.68] to-transparent' />
                            <div className='relative z-10 content flex flex-col items-center p-4 text-white text-lg opacity-0 translate-y-full transition-all duration-300 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible justify-end h-full'>
                                <div className='text-white text-2xl font-bold rounded-full bg-[#D9D9D980]'>
                                    <span className='px-5'>Papeleria</span>
                                </div>
                            </div>
                        </Link>
                        <Link href='#arte-y-diseno' className='group relative flex-none basis-[200px] rounded-lg transition-all duration-500 ease-in-out cursor-pointer shadow-[1px_5px_15px_#0872EAA3] overflow-hidden hover:shadow-[1px_3px_15px_#5B6FD79E] hover:-translate-y-2 hover:basis-[350px]'>
                            <div className='absolute inset-0'>
                                <Image src='/images/bg-product-card3.png' alt='Emily' fill className='object-cover' />
                            </div>
                            <div className='absolute inset-0 bg-gradient-to-t from-[#02022E]/[0.68] to-transparent' />
                            <div className='relative z-10 content flex flex-col items-center p-4 text-white text-lg opacity-0 translate-y-full transition-all duration-300 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible justify-end h-full'>
                                <div className='text-white text-2xl font-bold rounded-full bg-[#D9D9D980]'>
                                    <span className='px-5'>Arte y diseño</span>
                                </div>
                            </div>
                        </Link>
                        <Link href='#otros' className='group relative flex-none basis-[200px] rounded-lg transition-all duration-500 ease-in-out cursor-pointer shadow-[1px_5px_15px_#0872EAA3] overflow-hidden hover:shadow-[1px_3px_15px_#5B6FD79E] hover:-translate-y-2 hover:basis-[350px]'>
                            <div className='absolute inset-0'>
                                <Image src='/images/bg-product-card4.png' alt='Lisa' fill className='object-cover' />
                            </div>
                            <div className='absolute inset-0 bg-gradient-to-t from-[#02022E]/[0.68] to-transparent' />
                            <div className='relative z-10 content flex flex-col items-center p-4 text-white text-lg opacity-0 translate-y-full transition-all duration-300 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible justify-end h-full'>
                                <div className='text-white text-2xl font-bold rounded-full bg-[#D9D9D980]'>
                                    <span className='px-5'>Otros</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
            <div className='relative top-[104px] w-full p-10 flex items-center justify-evenly flex-col text-black'>
                <h1 className='text-3xl text-left w-full'>Nuestros productos</h1>
                <div id='oficina' className='p-6 w-full'>
                    <div className='w-full'>
                        <div className='rounded-full bg-[#D9D9D975] w-fit px-4 py-2'>
                            <h2 className='text-2xl text-left'>Oficina</h2>
                        </div>
                    </div>
                    <div className='w-full'>
                        <ProductOficinaWrapper />
                    </div>
                </div>
                <div id='papeleria' className='p-6 w-full'>
                    <div className='w-full'>
                        <div className='rounded-full bg-[#D9D9D975] w-fit px-4 py-2'>
                            <h2 className='text-2xl text-left'>Papeleria</h2>
                        </div>
                    </div>
                    <div className='w-full'>
                        <ProductPapeleriaWrapper />
                    </div>
                </div>
                <div id='arte-y-diseno' className='p-6 w-full'>
                    <div className='w-full'>
                        <div className='rounded-full bg-[#D9D9D975] w-fit px-4 py-2'>
                            <h2 className='text-2xl text-left'>Arte y diseño</h2>
                        </div>
                    </div>
                    <div className='w-full'>
                        <ProductArteWrapper />
                    </div>
                </div>
                <div id='otros' className='p-6 w-full'>
                    <div className='w-full'>
                        <div className='rounded-full bg-[#D9D9D975] w-fit px-4 py-2'>
                            <h2 className='text-2xl text-left'>Otros</h2>
                        </div>
                    </div>
                    <div className='w-full'>
                        <ProductOtroWrapper />
                    </div>
                </div>
            </div>
        </section>
    )
}
