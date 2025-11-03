'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import ProductCard from './product_card'

export default function ProductCarousel({ items }) {
    return (
        <div className="w-full h-full">
            <Swiper
                className="h-[90%]"
                modules={[Navigation, Pagination, Autoplay]}
                navigation
                pagination={{ clickable: true }}
                loop={true}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}
                speed={800}
                breakpoints={{
                    640: { slidesPerView: 1 },
                    1024: { slidesPerView: 3 },
                    1280: { slidesPerView: 4 },
                }}
            >
                {items.map(item => (
                    <SwiperSlide key={item.id}>
                        <ProductCard
                            name={item.name}
                            description={item.description}
                            price={item.price}
                            image={item.image}
                        />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    )
}
