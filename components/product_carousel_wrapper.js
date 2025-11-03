import ProductCarousel from './product_carousel'

export default async function ProductCarouselWrapper() {
  const res = await fetch('https://noninitial-chirurgical-judah.ngrok-free.dev/api/products/', {
    headers: {
      "Accept": "*/*",
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJjaGlwIiwiaWF0IjoxNzYyMTM5MTc3fQ.VDB8TeGi8nI3RG6Ie5XaI8RKrTeIJtHLeU36aoZksew",
    },
    cache: 'no-store',
  });

  const data = await res.json();

  const merged = data.items.map(item => {
    const product = data.products.find(p => p.id_product === item.id_item);
    return {
      id: item.id_item,
      name: item.name,
      description: product?.description || '',
      price: product?.price || 0,
      image: product ? `https://noninitial-chirurgical-judah.ngrok-free.dev/api/file_manager/download/product/${product.filehash}` : '/images/no-image.png',
    };
  });

  return <ProductCarousel items={merged} />;
}
