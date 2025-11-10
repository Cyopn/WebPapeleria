'use client'
import Image from 'next/image'
import { useState } from 'react'

export default function PrintPage() {
    const [setError] = useState(null);
    async function handleFileChange(e) {
        e.preventDefault();
        setError(null);
        const file = e.target.files[0]
        if (file) {
            const user = JSON.parse(localStorage.getItem("user"))
            const fd = new FormData();
            fd.append("files", file);
            fd.append("username", user.user.username);
            fetch('/api/file_manager', {
                method: 'POST',
                headers: { "Accept": "*/*", "Content-Type": "application/json; charset=utf-8", "Authorization": `Bearer ${user.token}` },
                body: fd
            }).then(async (res) => {
                const response = (await res.json())[0]
                fetch('/api/file', {
                    headers: {
                        headers: { "Accept": "*/*", "Content-Type": "application/json; charset=utf-8", "Authorization": `Bearer ${user.token}` },
                    },
                    body: JSON.stringify({ id_user: 1, filename: response.originalName, type: response.service, filehash: response.storedName })
                }).then((res) => {
                    console.log(res);
                });
            }).catch(err => {
                setError(err.message);
            });
        }
    }
    return (
        <section className="text-center">
            <div className="absolute top-0 w-full h-full flex justify-center items-center  pb-[100px]">
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
                            <div className="py-10">
                                <label htmlFor="file-upload" className="text-white text-bold text-center text-lg p-3 rounded-xl bg-[#007BFF] cursor-pointer flex gap-[10px] justify-center items-center">
                                    <div className="py-[2] start-0 pointer-events-none">
                                        <span className="items-center text-2xl px-2 h-full text-black">
                                            <span className="fi fi-br-document"></span>
                                        </span>
                                    </div>
                                    Subir archivo
                                    <div className="py-[2] end-0 pointer-events-none">
                                        <span className="flex items-center  text-2xl px-2 text-black">
                                            <span className="fi fi-br-upload"></span>
                                        </span>
                                    </div>
                                </label>
                                <input id="file-upload" type="file" onChange={handleFileChange} className="hidden" />
                            </div>
                        </div>
                        <form className="w-full pt-10 text-black grid grid-cols-[repeat(3,1fr)] grid-rows-[repeat(3,1fr)] gap-y-[70px] gap-x-[20px] auto-rows-[auto] auto-cols-[auto] grid-flow-row">
                            <div className="w-full flex gap-[20px] items-center content-stretch justify-center">
                                <input type="radio" id="bn" name="imp" value="bn" className="w-[2em] h-[2em]" />
                                <label htmlFor="bn"> Impresion Blanco y Negro</label>
                            </div>
                            <div className="w-full flex gap-[20px] items-center content-stretch justify-center">
                                <input type="radio" id="color" name="imp" value="color" className="w-[2em] h-[2em]" />
                                <label htmlFor="color">Impresion a Color</label>
                            </div>
                            <div className="w-full flex gap-[20px] items-center content-stretch justify-center">
                                <select id="paper" name="paper" className="border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500">
                                    <option defaultValue={"def"}>Tipos de papel</option>
                                    <option value="carta">Carta</option>
                                    <option value="oficio">Oficio</option>
                                </select>
                            </div>
                            <div className="w-full flex gap-[20px] items-center content-stretch justify-center">
                                <label htmlFor="mount">Cantidad:</label>
                                <input type="text" id="mount" className="w-[10em] h-[2em]" />
                            </div>
                            <div className="w-full flex gap-[20px] items-center content-stretch justify-center">
                                <label htmlFor="mount">Precio total: $</label>
                                <input type="text" disabled id="mount" className="w-[10em] h-[2em]" />
                            </div>
                            <div>
                                <button className="text-black text-xl px-5 p-2 rounded-full bg-[#FFC107] cursor-pointer">Vista Previa</button>
                            </div>
                            <div></div>
                            <div></div>
                            <div>
                                <button className="text-black text-xl px-5 p-2 rounded-full bg-gradient-to-r from-[#7BCE6D] to-[#A8D860] cursor-pointer">Aceptar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </section>
    )
} 