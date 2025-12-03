'use client'
import Image from 'next/image'

export default function ProductCardIndex({ name, description, price, image }) {
    return (
        <div className="w-full h-[90%] flex justify-center items-end flex-row">
            <div className="rounded-xl shadow-xl/20  w-[65%] h-[90%] overflow-hidden transition-shadow transform transition-transform duration-300 hover:scale-102">
                <div className="relative flex items-center justify-center flex-row content-center bg-gray-500/20 h-7/10 inset-shadow-sm inset-shadow-gray-500">
                    <Image
                        src={image || '/images/no-image.png'}
                        alt={name}
                        className="h-[80%] w-[80%]"
                        width={300}
                        height={300}
                        loading="eager" />
                </div>
                <div className="p-4 h-3/10 w-[100%] flex gap-0 items-center justify-center flex-row content-center">
                    <div className="w-2/4">
                        <h3 className="text-md font-medium mb-2">{name}</h3>
                        <p className="text-sm text-gray-600">{description}</p>
                    </div>
                    <div className="w-1/4 flex gap-0 justify-center items-center content-center">
                        <span className="font-bold text-xl">${price}</span>
                    </div>
                    <div className="w-1/4 flex gap-0 justify-center items-center content-center">
                        <button className="h-full w-full">
                            <i className="fi fi-rr-shopping-cart-add text-3xl"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
