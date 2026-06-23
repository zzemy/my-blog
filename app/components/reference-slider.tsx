'use client'

/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type ReferenceImage = {
  file: string
  src: string
  alt: string
}

export function ReferenceSlider({ images }: { images: ReferenceImage[] }) {
  const [active, setActive] = useState(0)
  const activeImage = images[active] || images[0]

  if (!activeImage) return null

  const showPrevious = () => {
    setActive((current) => (current === 0 ? images.length - 1 : current - 1))
  }

  const showNext = () => {
    setActive((current) => (current + 1) % images.length)
  }

  return (
    <div className="component-slider not-prose">
      <figure className="component-slider-stage">
        <img src={activeImage.src} alt={activeImage.alt} referrerPolicy="no-referrer" />
        <figcaption>
          <strong>{activeImage.file}</strong>
          <span>{activeImage.alt}</span>
        </figcaption>
      </figure>
      <div className="component-slider-controls" aria-label="轮播控制">
        <button type="button" onClick={showPrevious} aria-label="上一张">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>
          {active + 1} / {images.length}
        </span>
        <button type="button" onClick={showNext} aria-label="下一张">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="component-slider-strip" aria-label="轮播缩略图">
        {images.map((image, index) => (
          <button
            key={image.file}
            className={index === active ? 'is-active' : ''}
            type="button"
            aria-label={`预览 ${image.file}`}
            onClick={() => setActive(index)}
          >
            <img src={image.src} alt="" referrerPolicy="no-referrer" />
            <span>{image.file}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
