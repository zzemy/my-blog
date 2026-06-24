'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react'

type ScrollbarState = {
  left: number
  scrollable: boolean
  width: number
}

type DragState = {
  offset: number
  thumbWidth: number
  trackLeft: number
  trackWidth: number
}

export function useCodeWindowScrollbar(contentKey: string) {
  const [scrollbar, setScrollbar] = useState<ScrollbarState>({ left: 0, scrollable: false, width: 100 })
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const updateScrollbar = useCallback(() => {
    const viewport = viewportRef.current

    if (!viewport) return

    const maxScroll = viewport.scrollWidth - viewport.clientWidth

    if (maxScroll <= 1) {
      setScrollbar({ left: 0, scrollable: false, width: 100 })
      return
    }

    const width = Math.max((viewport.clientWidth / viewport.scrollWidth) * 100, 10)
    const left = (viewport.scrollLeft / maxScroll) * (100 - width)
    setScrollbar({ left, scrollable: true, width })
  }, [])

  const syncScrollbar = useCallback(() => {
    window.requestAnimationFrame(updateScrollbar)
  }, [updateScrollbar])

  useEffect(() => {
    const viewport = viewportRef.current

    if (!viewport) return

    updateScrollbar()

    const observer = new ResizeObserver(updateScrollbar)
    observer.observe(viewport)

    if (viewport.firstElementChild) {
      observer.observe(viewport.firstElementChild)
    }

    return () => observer.disconnect()
  }, [contentKey, updateScrollbar])

  const setScrollFromPointer = useCallback(
    (clientX: number) => {
      const viewport = viewportRef.current
      const drag = dragRef.current

      if (!viewport || !drag) return

      const maxThumbLeft = drag.trackWidth - drag.thumbWidth
      const maxScroll = viewport.scrollWidth - viewport.clientWidth

      if (maxThumbLeft <= 0 || maxScroll <= 0) return

      const nextThumbLeft = Math.min(Math.max(clientX - drag.trackLeft - drag.offset, 0), maxThumbLeft)
      viewport.scrollLeft = (nextThumbLeft / maxThumbLeft) * maxScroll
      syncScrollbar()
    },
    [syncScrollbar]
  )

  const handleScrollbarPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!scrollbar.scrollable) return

      event.preventDefault()

      const trackRect = event.currentTarget.getBoundingClientRect()
      const target = event.target as HTMLElement
      const thumb = target.closest('.code-window-scrollbar-thumb')
      const thumbWidth = (scrollbar.width / 100) * trackRect.width
      const thumbRect = thumb?.getBoundingClientRect()

      dragRef.current = {
        offset: thumbRect ? event.clientX - thumbRect.left : thumbWidth / 2,
        thumbWidth,
        trackLeft: trackRect.left,
        trackWidth: trackRect.width,
      }

      event.currentTarget.setPointerCapture(event.pointerId)
      setScrollFromPointer(event.clientX)
    },
    [scrollbar.scrollable, scrollbar.width, setScrollFromPointer]
  )

  const handleScrollbarPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return
      setScrollFromPointer(event.clientX)
    },
    [setScrollFromPointer]
  )

  const handleScrollbarPointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const handleViewportWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current

      if (!viewport) return

      const maxScroll = viewport.scrollWidth - viewport.clientWidth

      if (maxScroll <= 1) return

      const delta = Math.abs(event.deltaX) > 0 ? event.deltaX : event.shiftKey ? event.deltaY : 0

      if (delta === 0) return

      const nextScrollLeft = Math.min(Math.max(viewport.scrollLeft + delta, 0), maxScroll)

      if (nextScrollLeft === viewport.scrollLeft) return

      event.preventDefault()
      viewport.scrollLeft = nextScrollLeft
      syncScrollbar()
    },
    [syncScrollbar]
  )

  return {
    handleScrollbarPointerDown,
    handleScrollbarPointerMove,
    handleScrollbarPointerUp,
    handleViewportWheel,
    scrollbar,
    updateScrollbar,
    viewportRef,
  }
}
