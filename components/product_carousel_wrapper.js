import ProductCarousel from './product_carousel'

export default async function ProductCarouselWrapper() {
  const API_URL = process.env.API_URL
  const BEARER_TOKEN = process.env.BEARER_TOKEN

  const res = await fetch(`${API_URL}/products/type/item`, {
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
        description: '',
        price: Number(product.price) || 0,
        image: file ? `${API_URL}/file-manager/download/${file.type}/${file.filehash}` : '/images/no-image.png',
      };
    });

  return <ProductCarousel items={merged} />;
}
