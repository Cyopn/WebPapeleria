import ProductCard from './product_card'

export default async function ProductOtroWrapper() {
    const API_URL = process.env.API_URL
    const BEARER_TOKEN = process.env.BEARER_TOKEN
    const res = await fetch(`${API_URL}/products/`, {
        headers: {
            'Accept': '*/*',
            'Authorization': `Bearer ${BEARER_TOKEN}`,
        },
    });
    const data = await res.json();

    const merged = (data.products || [])
        .filter(product => product && Array.isArray(product.files) && product.files.length > 0)
        .map(product => {
            const file = product.files[0];
            return {
                id: product.id_product,
                name: product.description || `Producto ${product.id_product}`,
                description: product.description || '',
                price: Number(product.price) || 0,
                file: file || null,
                image: file ? `${API_URL}/file-manager/download/${file.type}/${file.filehash}` : '/images/no-image.png',
            };
        });

    if (Array.isArray(data.items)) {
        data.items.forEach(item => {
            const mergedItem = merged.find(mi => mi.id === item.id_item);
            if (mergedItem) mergedItem.name = item.name || mergedItem.name;
        });
    }

    const finalItems = merged.filter(mi => mi.file && mi.file.type === 'otros');

    return (
        <div className='grid grid-cols-[repeat(5,1fr)] grid-rows-[repeat(1,1fr)] w-full h-full'>
            {finalItems.map(item => (
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