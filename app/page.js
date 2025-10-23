import Image from "next/image";

export default function HomePage() {
  return (
    <section className="text-center">
      <h1 className="text-3xl font-bold">Bienvenido a Papelería Online</h1>
      <p className="mt-4 text-gray-600">
        Gestiona tus impresiones, productos y servicios especiales de forma sencilla.
      </p>
      <div className="">
        <Image
          src="/images/index_bg.png"
          alt="Example Image"
          className="img"
          width={1639}
          height={929} />
      </div>
    </section>
  )
}
