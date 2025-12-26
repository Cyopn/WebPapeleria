import ProductCard from './product_card'

export default async function ProductOtroWrapper() {
    const API_URL = process.env.API_URL || 'https://noninitial-chirurgical-judah.ngrok-free.dev/api'
    const BEARER_TOKEN = process.env.BEARER_TOKEN
    const res = await fetch(`${API_URL}/products/`, {
        headers: {
            "Accept": "*/*",
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": `Bearer ${BEARER_TOKEN}`,
        },
        cache: 'no-store',
    });

    const data = await res.json();

    const merged = data.products.map(item => ({
        id: item.item.id_item,
        name: item.item.name,
        description: item.description || '',
        price: item.price || 0,
        file: item.file || null,
        image: item.file ? `${API_URL}/file-manager/download/${item.file.type}/${item.file.filehash}` : '/images/no-image.png',
    }));
    const oficinaItems = merged.filter(mi => mi.file && mi.file.type === 'otros');

    return (
        <div className="grid grid-cols-[repeat(5,1fr)] grid-rows-[repeat(1,1fr)] w-full h-full">
            {oficinaItems.map(item => (
                <ProductCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    description={item.description}
                    price={item.price}
                    image={item.image}
                />
            ))}
        </div>
    );
}