import ProductCard from './product_card'

export default async function ProductOficinaWrapper() {
    const res = await fetch('https://noninitial-chirurgical-judah.ngrok-free.dev/api/products/', {
        headers: {
            "Accept": "*/*",
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJjaGlwIiwiaWF0IjoxNzYyMTM5MTc3fQ.VDB8TeGi8nI3RG6Ie5XaI8RKrTeIJtHLeU36aoZksew",
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
        image: item.file ? `https://noninitial-chirurgical-judah.ngrok-free.dev/api/file-manager/download/${item.file.type}/${item.file.filehash}` : '/images/no-image.png',
    }));
    const oficinaItems = merged.filter(mi => mi.file && mi.file.type === 'oficina');

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
