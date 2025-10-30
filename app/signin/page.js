'use client'
import Image from 'next/image'
import { ShoppingCart, Menu, Search } from 'lucide-react'

export default function LoginPage() {

  return (
    <section className="text-center">


      <div className="absolute top-0 w-full h-full flex justify-center items-center">
        <div className="relative top-0 w-full h-full flex justify-center items-center">
          <div className="absolute left-0 w-[60%] h-full h-full bg-black/85 z-[2] items-center content-center flex justify-center rounded-r-[25%]">
          </div>
          <Image
            src="/images/bg-signin.png"
            alt="bg"
            className="absolute w-full h-full object-cover z-[1]"
            width={1055}
            height={1562}
            loading="eager" />
        </div>
        <div className=" flex gap-[20px] flex-col items-center justify-center absolute top-0 z-[3] w-full h-full">
          <div className="flex flex-col bg-white w-[40%] rounded-3xl text-black">
            <h1 className="text-4xl py-8">Bienvenido</h1>
            <span className="fi fi-sr-user text-8xl py-8"></span>
            <form className="flex flex-col items-center justify-center w-full text-black">
              <div class="flex">
  <span class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border rounded-e-0 border-gray-300 border-e-0 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
    <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z"/>
    </svg>
  </span>
  <input type="text" id="website-admin" class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="elonmusk"/>
</div>
              <button>Iniciar sesion</button>
              <button>Registrarse</button>
            </form>

          </div>
        </div>
      </div>
    </section>
  )
}
