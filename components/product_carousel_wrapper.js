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

  const merged = data.products.map(item => {
    return {
      id: item.item.id_item,
      name: item.item.name,
      description: item.description || '',
      price: item.price || 0,
      image: item.file ? `https://noninitial-chirurgical-judah.ngrok-free.dev/api/file-manager/download/${item.file.type}/${item.file.filehash}` : '/images/no-image.png',
    };
  });

  return <ProductCarousel items={merged} />;
}
