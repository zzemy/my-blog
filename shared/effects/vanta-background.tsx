"use client"

import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { shouldUseVantaBackground } from "./vanta-routes"

const VIDEO_SRC = "/videos/hero-smoke-720.mp4"
const VIDEO_POSTER = "/videos/hero-smoke-poster.jpg"
const LIGHT_VIDEO_SRC = "/videos/hero-light-clouds-720.mp4"
const LIGHT_VIDEO_POSTER = "/videos/hero-light-clouds-poster.jpg"
const MAX_VIDEO_SECONDS = 14
const CROSSFADE_SECONDS = 3.6
const LIGHT_MEDIA_OPACITY = 0.24

export function VantaBackground() {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)
  const [mediaReady, setMediaReady] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [saveData, setSaveData] = useState(false)
  const scrollLayerRef = useRef<HTMLDivElement>(null)
  const primaryVideoRef = useRef<HTMLVideoElement>(null)
  const secondaryVideoRef = useRef<HTMLVideoElement>(null)
  const activeVideoRef = useRef<0 | 1>(0)
  const transitioningRef = useRef(false)
  const pausedByScrollRef = useRef(false)
  const isHomepage = shouldUseVantaBackground(pathname)
  const isDark = resolvedTheme === "dark"
  const themeReady = resolvedTheme === "dark" || resolvedTheme === "light"
  const playbackKey = `${isHomepage}:${isDark}`
  const videoSrc = isDark ? VIDEO_SRC : LIGHT_VIDEO_SRC
  const posterSrc = isDark ? VIDEO_POSTER : LIGHT_VIDEO_POSTER

  useEffect(() => {
    setHasMounted(true)
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    const syncMotion = () => setReducedMotion(Boolean(mq?.matches))
    syncMotion()
    mq?.addEventListener?.("change", syncMotion)
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (connection?.saveData) {
      setSaveData(true)
    }
    return () => {
      mq?.removeEventListener?.("change", syncMotion)
    }
  }, [])

  useEffect(() => {
    if (!hasMounted || !themeReady || !isHomepage) return

    let frameId = 0

    const syncScrollFade = () => {
      frameId = 0
      const viewportHeight = Math.max(window.innerHeight, 1)
      const progress = Math.min(1, Math.max(0, window.scrollY / (viewportHeight * 0.85)))

      if (scrollLayerRef.current) {
        scrollLayerRef.current.style.opacity = String(1 - progress * 0.94)
      }

      if (reducedMotion) return

      const primary = primaryVideoRef.current
      const secondary = secondaryVideoRef.current
      const activeVideo = activeVideoRef.current === 0 ? primary : secondary

      if (progress >= 0.96) {
        if (!pausedByScrollRef.current) {
          pausedByScrollRef.current = true
          primary?.pause()
          secondary?.pause()
        }
      } else if (pausedByScrollRef.current) {
        pausedByScrollRef.current = false
        if (activeVideo) {
          void activeVideo.play().catch(() => {})
        }
      }
    }

    const onScroll = () => {
      if (frameId) return
      frameId = window.requestAnimationFrame(syncScrollFade)
    }

    syncScrollFade()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [hasMounted, isHomepage, reducedMotion, themeReady])

  useEffect(() => {
    const primary = primaryVideoRef.current
    const secondary = secondaryVideoRef.current
    if (!hasMounted || !themeReady || !primary || !secondary || !isHomepage || reducedMotion) return

    const videos = [primary, secondary] as const
    const mediaOpacity = isDark ? 1 : LIGHT_MEDIA_OPACITY
    const playbackRate = isDark ? 0.5 : 0.68
    let transitionTimer: number | undefined
    let started = false

    const setOpacity = (video: HTMLVideoElement, opacity: number) => {
      video.style.opacity = String(opacity * mediaOpacity)
      video.style.transition = `opacity ${CROSSFADE_SECONDS}s ease-in-out`
    }

    const ensurePlaying = () => {
      if (pausedByScrollRef.current) return
      const active = videos[activeVideoRef.current]
      active.playbackRate = playbackRate
      if (active.paused) {
        void active.play().catch(() => {})
      }
    }

    const start = () => {
      if (!started) {
        started = true
        videos.forEach((video, index) => {
          video.playbackRate = playbackRate
          video.currentTime = 0
          setOpacity(video, index === activeVideoRef.current ? 1 : 0)
        })
      }
      setMediaReady(true)
      ensurePlaying()
    }

    const handlePlaying = () => {
      setMediaReady(true)
    }

    const handleTimeUpdate = (event: Event) => {
      const current = event.currentTarget as HTMLVideoElement
      const activeIndex = activeVideoRef.current
      if (
        current !== videos[activeIndex] ||
        transitioningRef.current ||
        pausedByScrollRef.current ||
        !current.duration
      ) {
        return
      }
      const effectiveEnd = Math.min(current.duration, MAX_VIDEO_SECONDS)
      if (effectiveEnd - current.currentTime > CROSSFADE_SECONDS) return

      transitioningRef.current = true
      const nextIndex = activeIndex === 0 ? 1 : 0
      const next = videos[nextIndex]
      next.currentTime = 0
      next.playbackRate = playbackRate
      setOpacity(next, 1)
      setOpacity(current, 0)
      void next.play().catch(() => {})
      activeVideoRef.current = nextIndex

      transitionTimer = window.setTimeout(() => {
        current.pause()
        current.currentTime = 0
        setOpacity(current, 0)
        transitioningRef.current = false
      }, CROSSFADE_SECONDS * 1000)
    }

    videos.forEach((video) => video.addEventListener("timeupdate", handleTimeUpdate))
    primary.addEventListener("loadedmetadata", start)
    primary.addEventListener("canplay", ensurePlaying)
    primary.addEventListener("playing", handlePlaying)

    if (primary.readyState >= 1) {
      start()
    } else {
      ensurePlaying()
    }

    return () => {
      if (transitionTimer) window.clearTimeout(transitionTimer)
      videos.forEach((video) => {
        video.pause()
        video.removeEventListener("timeupdate", handleTimeUpdate)
      })
      primary.removeEventListener("loadedmetadata", start)
      primary.removeEventListener("canplay", ensurePlaying)
      primary.removeEventListener("playing", handlePlaying)
      activeVideoRef.current = 0
      transitioningRef.current = false
      pausedByScrollRef.current = false
      setMediaReady(false)
    }
  }, [hasMounted, isDark, isHomepage, playbackKey, reducedMotion, themeReady])

  if (!hasMounted || !themeReady || !isHomepage) return null

  const mediaClass = isDark
    ? "grayscale brightness-[0.58] contrast-[1.08]"
    : "grayscale-[0.3] saturate-[0.65] brightness-[1.06] contrast-[0.94] mix-blend-multiply"

  const vignetteClass = isDark
    ? "bg-[radial-gradient(ellipse_75%_60%_at_50%_38%,rgba(17,18,20,0.08),rgba(17,18,20,0.72)_76%,#111214_100%)]"
    : "bg-[radial-gradient(ellipse_80%_62%_at_50%_38%,rgba(248,248,246,0.06),rgba(248,248,246,0.58)_76%,#f8f8f6_100%)]"

  const bottomFadeClass = isDark
    ? "bg-[linear-gradient(180deg,rgba(17,18,20,0.36)_0%,rgba(17,18,20,0.06)_28%,rgba(17,18,20,0.55)_72%,#111214_96%)]"
    : "bg-[linear-gradient(180deg,rgba(248,248,246,0.48)_0%,rgba(248,248,246,0.08)_30%,rgba(248,248,246,0.68)_74%,#f8f8f6_96%)]"

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${isDark ? "bg-[#111214]" : "bg-[#f8f8f6]"}`}
    >
      <div ref={scrollLayerRef} className="absolute inset-0 will-change-[opacity]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterSrc}
            alt=""
            className={`absolute inset-0 h-full w-full scale-[1.04] object-cover transition-opacity duration-700 ${mediaClass} ${mediaReady && !reducedMotion ? "opacity-0" : "opacity-100"}`}
            style={mediaReady && !reducedMotion ? undefined : { opacity: isDark ? 0.85 : LIGHT_MEDIA_OPACITY }}
          />
          {!reducedMotion &&
            [primaryVideoRef, secondaryVideoRef].map((videoRef, index) => (
              <video
                key={`${playbackKey}-${index}`}
                ref={videoRef}
                poster={index === 0 ? posterSrc : undefined}
                className={`absolute inset-0 h-full w-full scale-[1.04] object-cover ${mediaClass}`}
                style={{ opacity: index === 0 ? (isDark ? 1 : LIGHT_MEDIA_OPACITY) : 0 }}
                autoPlay={index === 0}
                muted
                playsInline
                preload={saveData ? "metadata" : index === 0 ? "auto" : "metadata"}
              >
                <source src={videoSrc} type="video/mp4" />
              </video>
            ))}
        </div>

        <div className={`absolute inset-0 ${vignetteClass}`} />
        <div className={`absolute inset-0 ${bottomFadeClass}`} />
        <div className="editorial-grain absolute inset-0 opacity-[0.025] dark:opacity-[0.04]" />
      </div>
    </div>
  )
}
