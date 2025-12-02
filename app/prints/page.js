'use client'
import Image from 'next/image'
import { useState } from 'react'

export default function PrintPage() {
    const [error, setError] = useState(null);
    const [rangeValue, setRangeValue] = useState('');
    const [br3Selected, setBr3Selected] = useState(false);
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
            <div className="absolute top-0 w-full h-full flex justify-center items-center">
                <div className="relative top-0 w-full h-full flex flex-col justify-center items-center">
                    <div className="top-0 w-full h-[50%] z-[1]">
                        <div className="flex pt-[100px] flex-row justify-end items-center content-end absolute top-0 z-[3] w-full h-[50%]">
                            <div className="w-full flex justify-center">
                                <div className="text-black font-bold text-4xl px-5 p-3 rounded-full bg-[#FFFFFF9E]">
                                    <span className="px-10">Impresiones</span>
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
                    <div className="w-full h-[100%] bg-white z-[2] flex justify-center items-center end-0">
                        <div className="absolute flex flex-col items-center top-[43%] w-[70%]">
                            <form className="flex flex-col items-center w-full bg-white rounded-xl p-6 shadow-lg inset-shadow-sm inset-shadow-gray-500">
                                <div className="flex flex-col items-center justify-center w-full text-black">
                                    <div className="">
                                        <label htmlFor="file-upload" className="text-white text-bold text-center text-lg p-2 px-5 rounded-xl bg-[#007BFF] cursor-pointer flex gap-[10px] justify-center items-center">
                                            <div className="start-0 pointer-events-none">
                                                <span className="items-center text-2xl h-full text-black">
                                                    <span className="fi fi-br-document"></span>
                                                </span>
                                            </div>
                                            <span className="px-5">Subir archivo</span>
                                            <div className="end-0 pointer-events-none">
                                                <span className="items-center text-2xl h-full text-black">
                                                    <span className="fi fi-br-upload"></span>
                                                </span>
                                            </div>
                                        </label>
                                        <input id="file-upload" type="file" onChange={handleFileChange} className="hidden" />
                                    </div>
                                </div>
                                <div className="w-[60%] p-2 text-black grid grid-cols-[70%_30%] grid-rows-[repeat(1,1fr)]">
                                    <div className="w-full p-2">
                                        <div className="w-full text-left py-1">
                                            <span>Tipo de impresion</span>
                                        </div>
                                        <div className="w-full flex gap-[24px] flex-col justify-between">
                                            <div className="flex items-center ps-4 w-full rounded-xl border border-gray-400 mb-2">
                                                <input id="br1" type="radio" value="blanco_negro" name="br" className="w-5 h-5" />
                                                <label htmlFor="br1" className="w-full py-2 text-left pl-4">Impresion Blanco y Negro</label>
                                            </div>
                                            <div className="flex items-center ps-4 w-full rounded-xl border border-gray-400 mb-2">
                                                <input id="br2" type="radio" value="color" name="br" className="w-5 h-5" />
                                                <label htmlFor="br2" className="w-full py-2 text-left pl-4">Impresion a Color</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full flex flex-col p-2">
                                        <div className="w-full text-left py-1">
                                            <span>Total de hojas</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <div className="flex items-center w-full rounded-xl border border-gray-400 mb-2">
                                                <label className="w-full py-2 text-center">0</label>
                                            </div>
                                        </div>
                                        <div className="w-full text-left">
                                            <span>Cantidad de juegos</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <div className="flex items-center w-full rounded-xl border border-gray-400 mb-2">
                                                <label className="w-full py-2 text-center">0</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full px-2 pb-2">
                                        <div className="w-full text-left py-1">
                                            <span>Tamaño de hoja</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <select id="paper" name="paper" className="w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500">
                                                <option defaultValue={"def"} value="carta">Carta</option>
                                                <option value="oficio">Oficio</option>
                                            </select>
                                        </div>
                                        <div className="w-full text-left py-1">
                                            <span>Rango</span>
                                        </div>
                                        <div className="flex items-center ps-1 w-full mb-2">
                                            <input
                                                id="br3"
                                                type="radio"
                                                value="todas"
                                                name="br3"
                                                className="w-5 h-5"
                                                checked={br3Selected}
                                                onChange={() => {
                                                    setBr3Selected(true);
                                                    setRangeValue('');
                                                }}
                                            />
                                            <label htmlFor="br3" className="w-full h-full  text-left pl-2">Todas</label>
                                        </div>
                                        <div className="w-full text-left">
                                            <span className="pr-3">Paginas</span>
                                            <input
                                                type="text"
                                                id="rangep"
                                                value={rangeValue}
                                                onChange={(e) => {
                                                    setRangeValue(e.target.value);
                                                    if (br3Selected) setBr3Selected(false);
                                                }}
                                                className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-3 py-1 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
                                                placeholder="1, 3-6"
                                            />
                                        </div>
                                    </div>
                                    <div className="w-full py-1 flex items-center content-stretch justify-center">
                                        <div className="bg-[#BABABA47] w-full rounded-lg">
                                            <div className="w-full flex flex-col content-stretch p-1 pl-3">
                                                <label className="w-full py-2 text-sm text-left">Precios</label>
                                                <span className="text-sm text-left py-2">Hoja Blanco y Negro: <label id="bn"></label></span>
                                                <span className="text-sm text-left py-2">Hoja a Color: <label id="c"></label></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full px-2 pb-2">
                                        <div className="w-full text-left py-1">
                                            <span>Imprimir por:</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <select id="paper" name="paper" className="w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 bg-[#D9D9D9] border-gray-600 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500">
                                                <option defaultValue={"def"} value="oc">Una cara</option>
                                                <option value="ac">Ambas caras</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="w-full px-2 pb-2">
                                        <div className="w-full text-left py-1">
                                            <span>Precio total</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center content-stretch justify-center">
                                            <div className="flex items-center w-full rounded-xl border border-gray-400 mb-2">
                                                <label className="w-full py-2 text-center">0</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full gap-5 flex flex-row justify-end content-end items-end">
                                    <button type="button" className="text-black text-sm px-10 p-1 rounded-full bg-[#FFC107] cursor-pointer">Vista Previa</button>
                                    <button type="button" className="text-black text-sm px-10 p-1 rounded-full bg-gradient-to-r from-[#7BCE6D] to-[#A8D860] cursor-pointer">Aceptar</button>
                                </div>
                                <div className="margin-[-50px] bg-transparent"></div>
                            </form>
                            <div className="py-4"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
} 