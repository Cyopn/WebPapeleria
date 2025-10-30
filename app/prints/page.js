'use-client'
import Image from 'next/image'

export default function PrintPage() {
    return (
        <section className="text-center">
            <div className="absolute top-0 w-full h-full flex flex-col justify-center items-center">
                <div className="top-0 w-full h-[40%] z-[1]">
                    <Image
                        src="/images/bg-print.png"
                        alt="bg"
                        className="h-full w-full object-cover"
                        width={2048}
                        height={1231}
                        loading="eager" />
                </div>
                <div className="w-full h-[60%] bg-white z-[2] end-0">
                </div>
            </div>

        </section>
    )
} 