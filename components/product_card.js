'use client'
import Image from 'next/image'

export default function ProductCard({ name, description, price, image }) {
    return (
        <div className="w-[90%] flex justify-center items-center p-4">
            <div className="flex items-center justify-center flex-col py-3 content-center rounded-xl shadow-xl/20 overflow-hidden transition-shadow transform transition-transform duration-300 hover:scale-102">
                <div className="flex items-center justify-center flex-row content-center bg-[#E6E6E6B0] rounded-md m-3 p-2">
                    <Image
                        src={image || '/images/no-image.png'}
                        alt={name}
                        className="h-[80%] w-[80%]"
                        width={300}
                        height={300}
                        loading="eager" />
                </div>
                <div className="w-[100%] flex items-center justify-center flex-col content-center">
                    <div className="w-full">
                        <h3 className="text-md font-medium w-full">{name}</h3>
                        <p className="text-sm text-gray-600 w-full">{description}</p>
                    </div>
                    <div className="flex justify-center items-center content-center">
                        <span className="text-xl">${price}</span>
                    </div>
                    <div>
                        <button className="w-full bg-[#77ADFFBD] text-[#012588] py-2 px-7 rounded-xl cursor-pointer">Agregar al carrito</button>
                            
                    </div>
                </div>
            </div>
        </div>
    )
}
