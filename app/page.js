import Image from 'next/image';
import Link from 'next/link'
import ProductCarouselWrapper from '@/components/product_carousel_wrapper';

export default function HomePage() {
  return (
    <section className='text-center'>
      <div className='relative top-0 w-full h-[75vh] flex justify-center items-center'>
        <div className='absolute left-0 w-[52%] h-full bg-black/85 z-[2] items-center content-center flex justify-center'>
          <div className='flex gap-[20px] items-center content-center justify-center flex-nowrap flex-col h-full w-[80%]'>
            <h1 className='text-5xl font-bold text-white pt-10'>Imprime tu mundo con color, creatividad y calidad</h1>
            <h3 className='text-4xl font-bold text-white pt-10'>Papeleria con proposito</h3>
            <Link
              href='/products'
              className='text-black text-3xl font-bold px-5 py-2 rounded-full bg-gradient-to-r from-[#7BCE6D] to-[#A8D860] mt-10 inline-block'>
              Explora nuestros productos
            </Link>
          </div>
        </div>
        <Image
          src='/images/bg-index.png'
          alt='bg'
          className='absolute w-full h-full object-cover z-[1]'
          width={1639}
          height={929}
          loading='eager' />
      </div>

      <div className='h-[60vh] flex items-center justify-evenly flex-row text-black'>
        <ProductCarouselWrapper />
      </div>
    </section>
  )
}
