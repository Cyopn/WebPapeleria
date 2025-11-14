'use client'
import Image from 'next/image'
import { useState } from 'react'

export default function PrintPage() {
    const [uploading, setUploading] = useState(false)
    const [status, setStatus] = useState({ type: null, message: '' })
    async function handleFileChange(e) {
        const file = e.target.files[0]
        try {
            if (file) {
                setUploading(true)
                setStatus({ type: null, message: '' })
                const user = localStorage.getItem("user")
                const fd = new FormData();
                fd.append("files", file);
                fd.append("user", user);
                const res = await fetch('/api/file_manager', {
                    method: 'POST',
                    headers: { "Accept": "*/*" },
                    body: fd
                });
                if (!res.ok) throw new Error('Error al subir archivo.')
                const response = (await res.json())[0]
                const res2 = await fetch('/api/file', {
                    method: 'POST',
                    headers: {
                        "Accept": "*/*",
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify({
                        user: user, res: response
                    })
                })
                if (!res2.ok) throw new Error('Error al procesar archivo.')
                const data = await res2.json()
                console.log('Respuesta final:', data)
                setStatus({ type: 'success', message: '¡El archivo se subio correctamente!' })
            }
        } catch (err) {
            console.error(err)
            setStatus({ type: 'error', message: '¡Hubo un error al subir archivo!' })
        } finally {
            setUploading(false)
        }
    }

    async function handlePrintingPrice(e) {

    }
    return (
        <section className="">
            {uploading && (
                <div className="fixed inset-0 bg-black/50 flex flex-col justify-center items-center z-[100]">
                    <div className="w-[25%] h-[25%] bg-white flex flex-col items-center text-black rounded-xl overflow-hidden">
                        <div className="top-0 bg-[#007BFF] w-full h-[20%]"></div>
                        <div className="w-full h-[80%] flex flex-col justify-center items-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#007BFF] mb-4"></div>
                            <p className="text-xl"><br></br>Subiendo archivo...</p>
                        </div>
                    </div>
                </div>
            )}
            {status.type && (
                <div onClick={(e) => {
                    if (e.target === e.currentTarget) setStatus({ type: null, message: '' })
                }} className="fixed inset-0 bg-black/50 flex flex-col justify-center items-center z-[100]">
                    <div className="w-[25%] h-[35%] bg-white flex flex-col items-center text-black rounded-xl overflow-hidden">
                        <div className={`top-0  w-full h-[15%] ${status.type === 'success' ? 'bg-[#A8D860]' : 'bg-[#F23535]'}`}></div>
                        <div className="w-full h-[85%] flex flex-col justify-evenly items-center">
                            <span className="text-7xl">
                                <span className={`${status.type === 'success' ? 'fi fi-ss-check-circle' : 'fi fi-sr-triangle-warning'}`}></span>
                            </span>
                            <span className="text-xl">
                                {status.message}
                            </span>
                            <button type='button' className={`${status.type === 'success' ? 'bg-[#A8D860]' : 'bg-[#F23535]'} text-xl px-7 py-3 rounded-full cursor-pointer`} onClick={() => setStatus({ type: null, message: '' })}>Aceptar</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="absolute top-0 w-full h-full flex justify-center items-center  pb-[100px]">
                <div className="relative top-0 w-full h-full flex flex-col justify-center items-center">
                    <div className="top-0 w-full h-[50%] z-[1]">
                        <div className="flex pt-[100px] flex-row justify-end items-center content-end absolute top-0 z-[3] w-full h-[50%]">
                            <div className="w-1/2"></div>
                            <div className="w-1/2 flex justify-center">
                                <div className="text-black w-[70%] text-xl px-5 p-3 rounded-xl bg-[#FFFFFF9E]">
                                    <span>Impresiones</span>
                                </div>
                            </div>
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
                    </div>
                </div>
                <div className=" bg-white absolute z-[5] w-[80%] bottom-20 p-10 rounded-xl flex flex-col items-center">
                    <div className="flex flex-col items-center justify-center w-full text-black">
                        <div className="py-5">
                            <label htmlFor="file-upload" className="text-white text-bold text-center text-lg p-3 rounded-xl bg-[#007BFF] cursor-pointer flex gap-[10px] justify-center items-center">
                                <div className="start-0 pointer-events-none">
                                    <span className="items-center text-2xl px-2 h-full text-black">
                                        <span className="fi fi-br-document"></span>
                                    </span>
                                </div>
                                Subir archivo
                                <div className="end-0 pointer-events-none">
                                    <span className="flex items-center  text-2xl px-2 text-black">
                                        <span className="fi fi-br-upload"></span>
                                    </span>
                                </div>
                            </label>
                            <input id="file-upload" type="file" accept='application/pdf' onChange={handleFileChange} className="hidden" />
                        </div>
                    </div>
                    <form className="w-[60%] p-10 text-black grid grid-cols-[3fr_1fr] grid-rows-[repeat(3,1fr)] gap-y-[10px] gap-x-[10px]">
                        <div className="flex flex-col items-center text-lg">
                            <label className="text-left ms-4 w-full">Tipo de impresion</label>
                            <div className="w-full h-full p-2">
                                <div className="flex items-center ps-4 border border-[#D9D9D9] rounded-xl w-full">
                                    <input id="bordered-radio-1" type="radio" value="" name="bordered-radio" className="w-4 h-4 bg-gray border-gray" />
                                    <label htmlFor="bordered-radio-1" className="py-2 ms-2 text-gray">Default radio</label>
                                </div>
                            </div>
                            <div className="w-full h-full p-2">
                                <div className="flex items-center ps-4 border border-[#D9D9D9] rounded-xl w-full">
                                    <input id="bordered-radio-2" type="radio" value="" name="bordered-radio" className="w-4 h-4 bg-gray border-gray" />
                                    <label htmlFor="bordered-radio-2" className="py-2 ms-2 text-gray">Checked state</label>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-lg">
                            <label className="text-left ms-4 w-full">Total de hojas</label>
                            <div className="w-full h-full p-1">
                                <div className="flex items-center ps-4 border border-[#D9D9D9] rounded-xl w-full">
                                    <input type="text" className="py-2 text-center text-gray focus:outline-0" value={"0"}></input>
                                </div>
                            </div>
                            <label className="text-left ms-4 w-full">Cantidad de juegos</label>
                            <div className="w-full h-full p-1">
                                <div className="flex items-center ps-4 border border-[#D9D9D9] rounded-xl w-full">
                                    <input type="text" className="py-2 text-center text-gray focus:outline-0" value={"1"}></input>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    )
} 