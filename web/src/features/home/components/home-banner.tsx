/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'

const AUTOPLAY_INTERVAL = 5000

interface HomeBannerProps {
  imageUrls: string[]
}

export function HomeBanner(props: HomeBannerProps) {
  const { t } = useTranslation()
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const images = props.imageUrls
  const hasMultiple = images.length > 1

  useEffect(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  useEffect(() => {
    if (!api || !hasMultiple || isPaused) return
    const timer = window.setInterval(() => {
      api.scrollNext()
    }, AUTOPLAY_INTERVAL)
    return () => window.clearInterval(timer)
  }, [api, hasMultiple, isPaused])

  return (
    <section className='pt-16 md:pt-20'>
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: 'start' }}
        className='w-full'
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
      >
        <CarouselContent className='ml-0'>
          {images.map((url, index) => (
            <CarouselItem key={url} className='pl-0'>
              <img
                src={url}
                alt={t('Home Banner {{index}}', { index: index + 1 })}
                className='max-h-[80vh] w-full object-cover'
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        {hasMultiple && (
          <>
            <button
              type='button'
              aria-label={t('Previous banner')}
              onClick={() => api?.scrollPrev()}
              className='absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur transition-colors hover:bg-black/50'
            >
              <ChevronLeft className='h-5 w-5' />
            </button>
            <button
              type='button'
              aria-label={t('Next banner')}
              onClick={() => api?.scrollNext()}
              className='absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur transition-colors hover:bg-black/50'
            >
              <ChevronRight className='h-5 w-5' />
            </button>
            <div className='absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2'>
              {images.map((url, index) => (
                <button
                  key={url}
                  type='button'
                  aria-label={t('Go to banner {{index}}', { index: index + 1 })}
                  aria-current={index === current}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    index === current
                      ? 'w-6 bg-white'
                      : 'w-2 bg-white/60 hover:bg-white/80'
                  )}
                />
              ))}
            </div>
          </>
        )}
      </Carousel>
    </section>
  )
}
