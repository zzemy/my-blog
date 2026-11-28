"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

export type VantaEffectType = 'video' | 'dots' | 'grid' | 'none'

const DEFAULT_VANTA_EFFECT: VantaEffectType = 'video'

export const VANTA_EFFECTS: VantaEffectType[] = ['video', 'dots', 'grid', 'none']

export const VANTA_EFFECT_LABELS: Record<VantaEffectType, string> = {
  video: '动态氛围视频',
  dots: '极简点阵',
  grid: '细密网格',
  none: '纯净无背景',
}

interface VantaContextType {
  effect: VantaEffectType
  setEffect: (effect: VantaEffectType) => void
  nextEffect: () => void
}

const VantaContext = createContext<VantaContextType | undefined>(undefined)

const normalizeEffect = (value: string | null): VantaEffectType | null => {
  if (!value) return null
  if (VANTA_EFFECTS.includes(value as VantaEffectType)) {
    return value as VantaEffectType
  }
  return 'video'
}

export function VantaProvider({ children }: { children: React.ReactNode }) {
  const [effect, setEffectState] = useState<VantaEffectType>(DEFAULT_VANTA_EFFECT)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = normalizeEffect(localStorage.getItem('vanta-effect'))
    const userSelected = localStorage.getItem('vanta-user-selected') === '1'

    if (saved && userSelected) {
      setEffectState(saved)
      return
    }

    // 未手动选择时，若系统偏好减少动效或开启省流量，自动降级为轻盈点阵
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (prefersReducedMotion || connection?.saveData) {
      setEffectState('dots')
      return
    }

    if (saved) {
      setEffectState(saved)
    }
  }, [])

  const saveEffect = (newEffect: VantaEffectType) => {
    setEffectState(newEffect)
    try {
      localStorage.setItem('vanta-effect', newEffect)
      localStorage.setItem('vanta-user-selected', '1')
    } catch {
      // ignore storage errors
    }
  }

  const nextEffect = () => {
    const currentIndex = VANTA_EFFECTS.indexOf(effect)
    const nextIndex = (currentIndex + 1) % VANTA_EFFECTS.length
    saveEffect(VANTA_EFFECTS[nextIndex])
  }

  return (
    <VantaContext.Provider value={{ effect, setEffect: saveEffect, nextEffect }}>
      {children}
    </VantaContext.Provider>
  )
}

export function useVanta() {
  const context = useContext(VantaContext)
  if (context === undefined) {
    throw new Error('useVanta must be used within a VantaProvider')
  }
  return context
}
