'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Photo {
  id: number
  url: string
  title: string | null
  author: string | null
  source: string | null
}

export default function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const goNext = useCallback(() => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % photos.length)
    }
  }, [lightboxIndex, photos.length])

  const goPrev = useCallback(() => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length)
    }
  }, [lightboxIndex, photos.length])

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [lightboxIndex, closeLightbox, goNext, goPrev])

  const currentPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null

  return (
    <>
      {/* Gallery grid — full images (object-contain) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {photos.map((photo, index) => (
          <figure key={photo.id} className="bg-gray-100 rounded-sm overflow-hidden">
            <button
              onClick={() => setLightboxIndex(index)}
              className="relative w-full aspect-[4/3] cursor-zoom-in block"
            >
              <Image
                src={photo.url}
                alt={photo.title || 'Zdjęcie archiwalne'}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </button>
            {(photo.title || photo.author || photo.source) && (
              <figcaption className="px-3 py-2 text-xs text-gray-500">
                {photo.title && <p className="font-medium text-gray-700">{photo.title}</p>}
                {photo.author && <p>fot. {photo.author}</p>}
                {photo.source && <p>źródło: {photo.source}</p>}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {/* Lightbox overlay */}
      {currentPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Zamknij"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Prev arrow */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev() }}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 text-white/60 hover:text-white transition-colors cursor-pointer"
              aria-label="Poprzednie"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}

          {/* Next arrow */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext() }}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 text-white/60 hover:text-white transition-colors cursor-pointer"
              aria-label="Następne"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          )}

          {/* Full-size image */}
          <div
            className="relative w-[90vw] h-[80vh] max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentPhoto.url}
              alt={currentPhoto.title || 'Zdjęcie archiwalne'}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {/* Caption */}
          {(currentPhoto.title || currentPhoto.author || currentPhoto.source) && (
            <div className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm px-4">
              {currentPhoto.title && <p className="font-medium">{currentPhoto.title}</p>}
              <p className="text-white/60 text-xs mt-0.5">
                {currentPhoto.author && <>fot. {currentPhoto.author}</>}
                {currentPhoto.author && currentPhoto.source && <> · </>}
                {currentPhoto.source && <>{currentPhoto.source}</>}
              </p>
            </div>
          )}

          {/* Counter */}
          {photos.length > 1 && (
            <div className="absolute top-4 left-4 text-white/60 text-sm">
              {lightboxIndex! + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
