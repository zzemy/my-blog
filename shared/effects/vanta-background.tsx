"use client"

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { useVanta } from './vanta-context'

// Extend Window interface to include THREE and p5
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    THREE: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    p5: any;
  }
}

export function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vantaEffectRef = useRef<any>(null)
  const { theme } = useTheme()
  const { effect } = useVanta()
  const pathname = usePathname()
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const isArticlePage = pathname && /\/posts\/.+/.test(pathname)
  const isAboutPage = pathname && /\/about$/.test(pathname)
  const shouldDisableEffect = isArticlePage || isAboutPage
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!vantaRef.current) return

    // Ensure THREE is available globally for Vanta
    if (typeof window !== 'undefined' && !window.THREE) {
      window.THREE = THREE
    }

    // Destroy previous effect
    if (vantaEffectRef.current) {
      vantaEffectRef.current.destroy()
      vantaEffectRef.current = null
    }

    if (effect === 'none' || shouldDisableEffect) return

    // Common options
    const options = {
      el: vantaRef.current,
      THREE: THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      scale: 1.00,
      scaleMobile: 1.00,
    }

    let isMounted = true

    const loadEffect = async () => {
      try {
        // Ensure THREE is available
        if (!THREE) {
          console.error("THREE is not defined");
          return;
        }

        // Load p5 for effects that need it
        if (['topology', 'rings', 'dots'].includes(effect)) {
            if (typeof window !== 'undefined' && !window.p5) {
                const p5 = (await import('p5')).default
                window.p5 = p5
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let effectModule: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let newEffect: any = null;

        switch (effect) {
          case 'birds':
            // @ts-expect-error - vanta types are missing
            effectModule = (await import('vanta/dist/vanta.birds.min')).default
            if (!isMounted) return
            newEffect = effectModule({
              ...options,
              backgroundColor: isDark ? 0x0 : 0xffffff,
              color1: isDark ? 0x888888 : 0xaab8cf,
              color2: isDark ? 0x555555 : 0xc9d5e6,
              colorMode: "lerpGradient",
              birdSize: 1,
              wingSpan: 30.00,
              speedLimit: 4.00,
              separation: 20.00,
              alignment: 20.00,
              cohesion: 20.00,
              quantity: 3.00,
              backgroundAlpha: isDark ? 1 : 0
            })
            break
          case 'waves':
            // @ts-expect-error - vanta types are missing
            effectModule = (await import('vanta/dist/vanta.waves.min')).default
            if (!isMounted) return
            newEffect = effectModule({
              ...options,
              color: isDark ? 0x333333 : 0x9bb2cf,
              shininess: isDark ? 30.00 : 22.00,
              waveHeight: isDark ? 20.00 : 12.00,
              waveSpeed: 0.8,
              zoom: 0.8
            })
            break
          case 'globe':
            // @ts-expect-error - vanta types are missing
            effectModule = (await import('vanta/dist/vanta.globe.min')).default
            if (!isMounted) return
            newEffect = effectModule({
              ...options,
              color: isDark ? 0x888888 : 0x8fa7c6,
              color2: isDark ? 0xcccccc : 0xd1deee,
              size: 1.00,
              backgroundColor: isDark ? 0x0 : 0xffffff,
            })
            break
          case 'topology':
            // @ts-expect-error - vanta types are missing
            effectModule = (await import('vanta/dist/vanta.topology.min')).default
            if (!isMounted) return
            newEffect = effectModule({
              ...options,
              color: isDark ? 0x888888 : 0x95aac6,
              backgroundColor: isDark ? 0x0 : 0xffffff,
            })
            break
          case 'rings':
            // @ts-expect-error - vanta types are missing
            effectModule = (await import('vanta/dist/vanta.rings.min')).default
            if (!isMounted) return
            newEffect = effectModule({
              ...options,
              color: isDark ? 0x888888 : 0x96abc8,
              backgroundColor: isDark ? 0x0 : 0xffffff,
            })
            break
          case 'dots':
            // @ts-expect-error - vanta types are missing
            effectModule = (await import('vanta/dist/vanta.dots.min')).default
            if (!isMounted) return
            newEffect = effectModule({
              ...options,
              color: isDark ? 0x888888 : 0x94acc9,
              color2: isDark ? 0xcccccc : 0xd4e0ef,
              backgroundColor: isDark ? 0x0 : 0xffffff,
            })
            break
          case 'halo':
            // @ts-expect-error - vanta types are missing
            effectModule = (await import('vanta/dist/vanta.halo.min')).default
            if (!isMounted) return
            newEffect = effectModule({
              ...options,
              backgroundColor: isDark ? 0x0 : 0xffffff,
              baseColor: isDark ? 0x444444 : 0xb9c9df,
              size: 1.5,
            })
            break
        }

        
        if (isMounted && newEffect) {
          vantaEffectRef.current = newEffect
        }
      } catch (error) {
        console.error("Failed to initialize Vanta effect:", error)
      }
    }

    loadEffect()

    return () => {
      isMounted = false
      if (vantaEffectRef.current) {
        vantaEffectRef.current.destroy()
        vantaEffectRef.current = null
      }
    }
  }, [effect, theme, shouldDisableEffect, hasMounted, isDark])

  if (!hasMounted || effect === 'none' || shouldDisableEffect) return null

  return (
    <div 
      ref={vantaRef} 
      className={`fixed inset-0 -z-10 h-full w-full pointer-events-none ${isDark ? 'opacity-50' : 'opacity-28'}`}
    />
  )
}
