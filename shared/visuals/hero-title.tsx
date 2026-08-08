'use client'

import { useReducedMotion, motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect } from 'react'

const HERO_REVEAL_DELAY = 1200

type HeroTitleProps = {
  title: string
  description: string
}

export function HeroTitle({ title, description }: HeroTitleProps) {
  const reducedMotion = useReducedMotion()
  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)
  const x = useSpring(offsetX, { stiffness: 55, damping: 18, mass: 0.8 })
  const y = useSpring(offsetY, { stiffness: 55, damping: 18, mass: 0.8 })

  useEffect(() => {
    const timer = window.setTimeout(() => window.dispatchEvent(new Event('blog:hero-ready')), HERO_REVEAL_DELAY)
    return () => window.clearTimeout(timer)
  }, [])

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return

    const bounds = event.currentTarget.getBoundingClientRect()
    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5
    offsetX.set(horizontal * 10)
    offsetY.set(vertical * 6)
  }

  const resetPosition = () => {
    offsetX.set(0)
    offsetY.set(0)
  }

  return (
    <div
      className="mx-auto flex min-h-[21rem] max-w-[980px] flex-col items-center justify-center gap-5 py-12 text-center md:min-h-[30rem] md:py-20"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPosition}
    >
      <motion.h1
        aria-label={title}
        className="hero-display text-6xl font-normal leading-none text-foreground sm:text-7xl md:text-8xl lg:text-[8.5rem]"
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={reducedMotion ? undefined : { x, y }}
      >
        <span aria-hidden="true" className="inline-flex">
          {Array.from(title).map((character, index) => (
            <motion.span
              key={`${character}-${index}`}
              className="inline-block"
              initial={false}
              animate={reducedMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: reducedMotion ? 0.2 : 0.85,
                delay: reducedMotion ? 0 : 0.08 + index * 0.045,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {character === ' ' ? '\u00a0' : character}
            </motion.span>
          ))}
        </span>
      </motion.h1>
      <motion.p
        className="max-w-[750px] font-handwriting-cjk text-lg leading-8 text-muted-foreground/80 sm:text-xl"
        initial={false}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: reducedMotion ? 0.2 : 0.8, delay: reducedMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {description}
      </motion.p>
    </div>
  )
}
