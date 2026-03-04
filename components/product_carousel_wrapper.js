import ProductCarousel from './product_carousel'

export default async function ProductCarouselWrapper() {
  const API_URL = process.env.API_URL
  const BEARER_TOKEN = process.env.BEARER_TOKEN
  let merged = []

  try {
    if (!API_URL) {
      return <ProductCarousel items={merged} />
    }

    const res = await fetch(`${API_URL}/products/type/item`, {
      headers: {
        'Accept': '*/*',
        ...(BEARER_TOKEN ? { 'Authorization': `Bearer ${BEARER_TOKEN}` } : {}),
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return <ProductCarousel items={merged} />
    }

    const data = await res.json().catch(() => null)
    merged = (data?.products || [])
      .filter(product => product && Array.isArray(product.files) && product.files.length > 0)
      .map(product => {
        const file = product.file
        return {
          id: product.id_product,
          name: product.description || `Producto ${product.id_product}`,
          description: '',
          price: Number(product.price) || 0,
          image: file ? `${API_URL}/file-manager/download/${file.type}/${file.filehash}` : '/images/no-image.png',
        }
      })
  } catch (err) {
    merged = []
  }

  return <ProductCarousel items={merged} />
}
