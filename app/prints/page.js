'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function PrintPage() {
    const [preview, setPreview] = useState(null)

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => setPreview(reader.result)
            reader.readAsDataURL(file)
        }
    }
    return (
        <section className="text-center">
            <div className="absolute top-0 w-full h-full flex justify-center items-center">
                <div className="relative top-0 w-full h-full flex flex-col justify-center items-center">
                    <div className="top-0 w-full h-[50%] z-[1]">
                        <div className="flex pt-[100px] flex-row justify-end items-center content-end absolute top-0 z-[3] w-full h-[50%]">
                            <div className="w-1/2"></div>
                            <div className="w-1/2 flex justify-center"><div className="text-black w-[70%] text-xl px-5 p-3 rounded-xl bg-[#FFFFFF9E]"><span>Impresiones</span></div></div>
                        </div>
                        <Image
                            src="/images/bg-print.png"
                            alt="bg"
                            className="h-full w-full object-cover"
                            width={2048}
                            height={1231}
                            loading="eager" />
                    </div>
                    <div className="w-full h-[50%] bg-white z-[2] end-0">
                        <div className="flex flex-col items-center justify-center w-full text-black">
                            <div className="relative py-10">
                                <div className="absolute inset-y-0 start-0 flex items-center pointer-events-none">
                                    <span className="items-center text-2xl px-2">
                                        <span className="fi fi-br-document"></span>
                                    </span>
                                </div>

                                <label
                                    htmlFor="file-upload"
                                    className="text-white text-bold text-center text-lg py-5 pl-20 pr-20 p-3 rounded-xl bg-[#007BFF] cursor-pointer"
                                >
                                    Subir archivo
                                </label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="absolute inset-y-0 end-0 flex items-center pointer-events-none">
                                    <span className="items-center text-xl px-2">
                                        <span className="fi fi-br-upload"></span>
                                    </span>
                                </div>
                            </div>
                        </div>




                        {preview && (
                            <Image
                                src={preview}
                                alt="Vista previa"
                                className="w-32 h-32 object-cover rounded-lg shadow"
                            />
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
} 