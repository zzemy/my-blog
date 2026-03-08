"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

type VantaEffectType = 'none' | 'birds' | 'waves' | 'globe' | 'topology' | 'rings' | 'dots' | 'halo';

export const VANTA_EFFECTS: VantaEffectType[] = [
  'none',
  'birds', 
  'waves', 
  'globe', 
  'topology', 
  'rings', 
  'dots', 
  'halo'
];

interface VantaContextType {
  effect: VantaEffectType;
  setEffect: (effect: VantaEffectType) => void;
  nextEffect: () => void;
}

const VantaContext = createContext<VantaContextType | undefined>(undefined);

const normalizeEffect = (value: string | null): VantaEffectType | null => {
  if (!value) return null;
  if (value === 'global') return 'globe';
  return VANTA_EFFECTS.includes(value as VantaEffectType) ? (value as VantaEffectType) : null;
};

const getPreferredTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

const getDeviceDefaultEffect = (): VantaEffectType => {
  if (typeof window === 'undefined') return 'halo';

  const ua = navigator.userAgent || '';
  const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  const isSmallScreen = window.innerWidth < 768;
  const isMobile = isMobileUA || isSmallScreen;
  const preferredTheme = getPreferredTheme();

  if (isMobile) return 'globe';
  return preferredTheme === 'light' ? 'topology' : 'halo';
};

export function VantaProvider({ children }: { children: React.ReactNode }) {
  const [effect, setEffect] = useState<VantaEffectType>(() => {
    if (typeof window === 'undefined') return 'halo';

    const savedEffect = normalizeEffect(localStorage.getItem('vanta-effect'));
    return savedEffect ?? getDeviceDefaultEffect();
  });

  const [hasUserSelected, setHasUserSelected] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;

    const selectedFlag = localStorage.getItem('vanta-user-selected');
    if (selectedFlag === '1') return true;
    if (selectedFlag === '0') return false;

    return normalizeEffect(localStorage.getItem('vanta-effect')) !== null;
  });

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

    const defaultEffect = getDeviceDefaultEffect();
    setEffect(defaultEffect);
    localStorage.setItem('vanta-effect', defaultEffect);
    localStorage.setItem('vanta-user-selected', '0');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasUserSelected) return;

    const applyThemeDefault = () => {
      const nextDefault = getDeviceDefaultEffect();
      setEffect((prev) => {
        if (prev === nextDefault) return prev;
        localStorage.setItem('vanta-effect', nextDefault);
        localStorage.setItem('vanta-user-selected', '0');
        return nextDefault;
      });
    };

    applyThemeDefault();

    const observer = new MutationObserver(() => {
      applyThemeDefault();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
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
