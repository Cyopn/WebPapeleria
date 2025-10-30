import Image from "next/image";
import Link from 'next/link'

export default function HomePage() {
  return (
    <section className="text-center">
      <div className="relative top-0 w-full h-[75vh] flex justify-center items-center">
        <div className="absolute left-0 w-[52%] h-full bg-black/85 z-[2] items-center content-center flex justify-center">
          <div className="flex gap-[20px] items-center content-center justify-center flex-nowrap flex-col h-full w-[80%]">
            <h1 className="text-5xl font-bold text-white pt-10">Imprime tu mundo con color, creatividad y calidad</h1>
            <h3 className="text-4xl font-bold text-white pt-10">Papeleria con proposito</h3>
            <Link
              href="/"
              className="text-black text-3xl font-bold px-5 py-2 rounded-full bg-gradient-to-r from-[#7BCE6D] to-[#A8D860] mt-10 inline-block">
              Explora nuestros productos
            </Link>
          </div>
        </div>
        <Image
          src="/images/bg-index.png"
          alt="bg"
          className="absolute w-full h-full object-cover z-[1]"
          width={1639}
          height={929}
          loading="eager" />
      </div>

      <div className="h-[60vh] flex items-center justify-evenly flex-row text-black">
        <div className="flex flex-col justify-start rounded-xl shadow-xl/20 relative w-[20%] h-[80%] overflow-hidden transition-shadow transform transition-transform duration-300 hover:scale-102">
          <div className="relative flex items-center justify-center flex-row content-center bg-gray-500/20 h-7/10 inset-shadow-sm inset-shadow-gray-500">
            <Image src="/images/no-image.png"
              alt="img"
              className="h-[80%]"
              width={300}
              height={300}
              loading="eager" />
          </div>
          <div className="p-4 h-3/10 w-[100%] flex gap-0 items-center justify-center flex-row content-center">
            <div className="w-2/4">
              <h3 className="text-xl font-medium mb-2">Product Title</h3>
              <p className="text-lg text-gray-600">Brief description of the product.</p>
            </div>
            <div className="w-1/4 flex gap-0 justify-center items-center content-center">
              <span className="font-bold text-2xl">$19.99</span>
            </div>
            <div className="w-1/4 flex gap-0 justify-center items-center content-center">
              <button className="h-full w-full">
                <i className="fi fi-rr-shopping-cart-add text-3xl"></i>
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-start rounded-xl shadow-xl/20 relative w-[20%] h-[80%] overflow-hidden transition-shadow transform transition-transform duration-300 hover:scale-102">
          <div className="relative flex items-center justify-center flex-row content-center bg-gray-500/20 h-7/10 inset-shadow-sm inset-shadow-gray-500">
            <Image src="/images/no-image.png"
              alt="img"
              className="h-[80%] w-[80%]"
              width={300}
              height={300}
              loading="eager" />
          </div>
          <div className="p-4 h-3/10 w-[100%] flex gap-0 items-center justify-center flex-row content-center">
            <div className="w-2/4">
              <h3 className="text-xl font-medium mb-2">Product Title</h3>
              <p className="text-lg text-gray-600">Brief description of the product.</p>
            </div>
            <div className="w-1/4 flex gap-0 justify-center items-center content-center">
              <span className="font-bold text-2xl">$19.99</span>
            </div>
            <div className="w-1/4 flex gap-0 justify-center items-center content-center">
              <button className="h-full w-full">
                <i className="fi fi-rr-shopping-cart-add text-3xl"></i>
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-start rounded-xl shadow-xl/20 relative w-[20%] h-[80%] overflow-hidden transition-shadow transform transition-transform duration-300 hover:scale-102">
          <div className="relative flex items-center justify-center flex-row content-center bg-gray-500/20 h-7/10 inset-shadow-sm inset-shadow-gray-500">
            <Image src="/images/no-image.png"
              alt="img"
              className="h-[80%]"
              width={300}
              height={300}
              loading="eager" />
          </div>
          <div class="p-4 h-3/10 w-[100%] flex gap-0 items-center justify-center flex-row content-center">
            <div className="w-2/4">
              <h3 className="text-xl font-medium mb-2">Product Title</h3>
              <p className="text-lg text-gray-600">Brief description of the product.</p>
            </div>
            <div className="w-1/4 flex gap-0 justify-center items-center content-center">
              <span className="font-bold text-2xl">$19.99</span>
            </div>
            <div className="w-1/4 flex gap-0 justify-center items-center content-center">
              <button className="h-full w-full">
                <i className="fi fi-rr-shopping-cart-add text-3xl"></i>
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-start rounded-xl shadow-xl/20 relative w-[20%] h-[80%] overflow-hidden transition-shadow transform transition-transform duration-300 hover:scale-102">
          <div className="relative flex items-center justify-center flex-row content-center bg-gray-500/20 h-7/10 inset-shadow-sm inset-shadow-gray-500">
            <Image src="/images/no-image.png"
              alt="img"
              className="h-[80%]"
              width={300}
              height={300}
              loading="eager" />
          </div>
          <div className="p-4 h-3/10 w-[100%] flex gap-0 items-center justify-center flex-row content-center">
            <div className="w-2/4">
              <h3 className="text-xl font-medium mb-2">Product Title</h3>
              <p className="text-lg text-gray-600">Brief description of the product.</p>
            </div>
            <div className="w-1/4 flex gap-0 justify-center items-center content-center">
              <span className="font-bold text-2xl">$19.99</span>
            </div>
            <div className="w-1/4 flex gap-0 justify-center items-center content-center">
              <button className="h-full w-full">
                <i className="fi fi-rr-shopping-cart-add text-3xl"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
