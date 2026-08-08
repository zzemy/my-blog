"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

type VantaEffectType = 'none' | 'video';

const DEFAULT_VANTA_EFFECT: VantaEffectType = 'video';

export const VANTA_EFFECTS: VantaEffectType[] = [
  'none',
  'video',
];

interface VantaContextType {
  effect: VantaEffectType;
  setEffect: (effect: VantaEffectType) => void;
  nextEffect: () => void;
}

const VantaContext = createContext<VantaContextType | undefined>(undefined);

const normalizeEffect = (value: string | null): VantaEffectType | null => {
  if (!value) return null;
  if (value !== 'none') return 'video';
  return VANTA_EFFECTS.includes(value as VantaEffectType) ? (value as VantaEffectType) : null;
};

export function VantaProvider({ children }: { children: React.ReactNode }) {
  const [effect, setEffect] = useState<VantaEffectType>(DEFAULT_VANTA_EFFECT);
  const [hasUserSelected, setHasUserSelected] = useState(false);

  // Load saved effect from local storage or decide default by device type
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = normalizeEffect(localStorage.getItem('vanta-effect'));
    const selectedFlag = localStorage.getItem('vanta-user-selected');
    const selected = selectedFlag === '1' || (selectedFlag === null && saved !== null);
    setHasUserSelected(selected);

    if (saved) {
      setEffect(saved);
      localStorage.setItem('vanta-effect', saved);
      localStorage.setItem('vanta-user-selected', selected ? '1' : '0');
      return;
    }

    setEffect(DEFAULT_VANTA_EFFECT);
    localStorage.setItem('vanta-effect', DEFAULT_VANTA_EFFECT);
    localStorage.setItem('vanta-user-selected', '0');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasUserSelected) return;

    return undefined;
  }, [hasUserSelected]);

  const saveEffect = (newEffect: VantaEffectType, byUser = false) => {
    setEffect(newEffect);
    localStorage.setItem('vanta-effect', newEffect);
    if (byUser) {
      setHasUserSelected(true);
      localStorage.setItem('vanta-user-selected', '1');
    }
  };

  const nextEffect = () => {
    const currentIndex = VANTA_EFFECTS.indexOf(effect);
    const nextIndex = (currentIndex + 1) % VANTA_EFFECTS.length;
    saveEffect(VANTA_EFFECTS[nextIndex], true);
  };

  return (
    <VantaContext.Provider value={{ effect, setEffect: (newEffect) => saveEffect(newEffect, true), nextEffect }}>
      {children}
    </VantaContext.Provider>
  );
}

export function useVanta() {
  const context = useContext(VantaContext);
  if (context === undefined) {
    throw new Error('useVanta must be used within a VantaProvider');
  }
  return context;
}
