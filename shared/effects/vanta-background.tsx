"use client"

import { usePathname } from "next/navigation"
import { useReducedMotion } from "framer-motion"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { useVanta } from "./vanta-context"
import { shouldUseVantaBackground } from "./vanta-routes"

const VIDEO_SRC = "/videos/hero-smoke-720.mp4"
const LIGHT_VIDEO_SRC = "/videos/hero-light-clouds-720.mp4"
const MAX_VIDEO_SECONDS = 14
const CROSSFADE_SECONDS = 3.6
const LIGHT_MEDIA_OPACITY = 0.14
const HERO_READY_EVENT = "blog:hero-ready"

export function VantaBackground() {
  const pathname = usePathname()
  const { effect } = useVanta()
  const reducedMotion = useReducedMotion()
  const { resolvedTheme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)
  const [mediaReady, setMediaReady] = useState(false)
  const [heroReady, setHeroReady] = useState(false)
  const primaryVideoRef = useRef<HTMLVideoElement>(null)
  const secondaryVideoRef = useRef<HTMLVideoElement>(null)
  const activeVideoRef = useRef<0 | 1>(0)
  const transitioningRef = useRef(false)
  const isHomepage = shouldUseVantaBackground(pathname)
  const isDark = resolvedTheme === "dark"
  const themeReady = resolvedTheme === "dark" || resolvedTheme === "light"
  const playbackKey = `${isHomepage}:${isDark}`
  const videoSrc = isDark ? VIDEO_SRC : LIGHT_VIDEO_SRC

  useEffect(() => setHasMounted(true), [])

  useEffect(() => {
    const handleHeroReady = () => setHeroReady(true)
    window.addEventListener(HERO_READY_EVENT, handleHeroReady)
    return () => window.removeEventListener(HERO_READY_EVENT, handleHeroReady)
  }, [hasMounted])

  useEffect(() => {
    const primary = primaryVideoRef.current
    const secondary = secondaryVideoRef.current
    if (!hasMounted || !themeReady || !primary || !secondary || reducedMotion || effect === "none" || !isHomepage) return

    const videos = [primary, secondary] as const
    const mediaOpacity = isDark ? 1 : LIGHT_MEDIA_OPACITY
    const setOpacity = (video: HTMLVideoElement, opacity: number) => {
      video.style.opacity = String(opacity * mediaOpacity)
      video.style.transition = `opacity ${CROSSFADE_SECONDS}s ease-in-out, filter ${CROSSFADE_SECONDS}s ease-in-out`
    }
    const setSoftness = (video: HTMLVideoElement, softness: number) => {
      video.style.filter = softness > 0 ? `blur(${softness}px)` : ""
    }

    const start = () => {
      setMediaReady(true)
      videos.forEach((video, index) => {
        video.playbackRate = 0.42
        video.currentTime = 0
        setOpacity(video, index === activeVideoRef.current ? 1 : 0)
        setSoftness(video, 0)
      })
      void primary.play().catch(() => {})
    }

    const handleTimeUpdate = (event: Event) => {
      const current = event.currentTarget as HTMLVideoElement
      const activeIndex = activeVideoRef.current
      if (current !== videos[activeIndex] || transitioningRef.current || !current.duration) return
      const effectiveEnd = Math.min(current.duration, MAX_VIDEO_SECONDS)
      if (effectiveEnd - current.currentTime > CROSSFADE_SECONDS) return

      transitioningRef.current = true
      const nextIndex = activeIndex === 0 ? 1 : 0
      const next = videos[nextIndex]
      next.currentTime = 0
      next.playbackRate = 0.42
      setSoftness(current, 7)
      setSoftness(next, 7)
      setOpacity(next, 1)
      setOpacity(current, 0)
      void next.play().catch(() => {})
      activeVideoRef.current = nextIndex

      window.setTimeout(() => {
        current.pause()
        current.currentTime = 0
        setOpacity(current, 0)
        setSoftness(current, 0)
        setSoftness(next, 0)
        transitioningRef.current = false
      }, CROSSFADE_SECONDS * 1000)
    }

    videos.forEach((video) => video.addEventListener("timeupdate", handleTimeUpdate))
    if (primary.readyState >= 1) start()
    else primary.addEventListener("loadedmetadata", start, { once: true })

    return () => {
      videos.forEach((video) => {
        video.pause()
        video.style.filter = ""
        video.removeEventListener("timeupdate", handleTimeUpdate)
      })
      primary.removeEventListener("loadedmetadata", start)
      activeVideoRef.current = 0
      transitioningRef.current = false
      setMediaReady(false)
    }
  }, [effect, hasMounted, reducedMotion, playbackKey, themeReady])

  if (!hasMounted || !themeReady || !isHomepage || effect === "none") return null

  const mediaClass = isDark
    ? "grayscale brightness-[0.62] contrast-110"
    : "grayscale-[0.35] saturate-[0.7] brightness-110 contrast-90 mix-blend-multiply"
  const overlayClass = isDark
    ? "bg-[radial-gradient(ellipse_at_center,rgba(6,10,14,0.12),rgba(6,10,14,0.74)_78%)]"
    : "bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(248,249,250,0.015)_46%,rgba(238,241,244,0.08))]"

  return (
    <div aria-hidden="true" className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${isDark ? "bg-[#101214]" : "bg-[#f4f5f6]"}`}>
      <div className={`absolute inset-0 transition-opacity duration-700 ${mediaReady && (heroReady || reducedMotion) ? "opacity-0" : "opacity-100"} ${isDark ? "bg-[#101214]" : "bg-[#f4f5f6]"}`} />
      {reducedMotion ? (
        <div
          className={`absolute inset-0 ${isDark ? "bg-[#101214]" : "bg-[#f4f5f6]"}`}
        />
      ) : (
        <div className="absolute inset-0">
          {[primaryVideoRef, secondaryVideoRef].map((videoRef, index) => (
            <video
              key={`${playbackKey}-${index}`}
              ref={videoRef}
              className={`absolute inset-0 h-full w-full scale-[1.04] object-cover ${mediaClass}`}
              style={{ opacity: index === 0 ? (isDark ? 1 : LIGHT_MEDIA_OPACITY) : 0 }}
              muted
              playsInline
              preload="metadata"
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          ))}
        </div>
      )}
      <div className={`absolute inset-0 ${overlayClass}`} />
      <div className={isDark ? "absolute inset-0 bg-[#101214]/20" : "absolute inset-0 bg-white/[0.015]"} />
    </div>
  )
}
