'use client'

import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import ProductCardIndex from './product_card_index'

export default function ProductCarousel({ items }) {
    const [itemsToShow, setItemsToShow] = useState(() => items.slice(0, 10));

    useEffect(() => {
        const shuffled = [...items];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItemsToShow(shuffled.slice(0, 10));
    }, [items]);

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
                {itemsToShow.map(item => (
                    <SwiperSlide key={item.id}>
                        <ProductCardIndex
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
