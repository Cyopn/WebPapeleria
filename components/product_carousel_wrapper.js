import ProductCarousel from './product_carousel'

export default async function ProductCarouselWrapper() {
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
<<<<<<< HEAD
  const merged = data.products.map(item => {
    if(item.type === 'item') 
    return {
      id: item.id_product || item.id_item || item.id,
      name: item.name,
      description: item.description || '',
      price: item.price || 0,
      image: item.file ? `${API_URL}/file-manager/download/${item.file.type}/${item.file.filehash}` : '/images/no-image.png',
    };
  });
=======
  const merged = (data.products || [])
    .filter(item => item?.item)
    .map(item => ({
      id: item.item.id_item,
      name: item.item.name,
      description: item.description || '',
      price: item.price || 0,
      image: item.file ? `${API_URL}/file-manager/download/${item.file.type}/${item.file.filehash}` : '/images/no-image.png',
    }));

>>>>>>> df0024b54064e1fb3cd533b00858e566fa777c84
  return <ProductCarousel items={merged} />;
}
