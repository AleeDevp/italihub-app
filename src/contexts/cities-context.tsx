'use client';

import type { City } from '@/types/city';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Storage mode:
 *  - "session": survives hard refresh in the same tab (recommended per your goal)
 *  - "local":   survives hard refresh and new tabs
 */
type StorageMode = 'session' | 'local';

const DEFAULT_STORAGE_KEY = 'cities@v1';
const CitiesCtx = createContext<City[] | null>(null);

function readStorage(key: string, mode: StorageMode): City[] | null {
  try {
    const raw =
      mode === 'local' ? window.localStorage.getItem(key) : window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as City[]) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, mode: StorageMode, cities: City[]) {
  try {
    const raw = JSON.stringify(cities);
    if (mode === 'local') window.localStorage.setItem(key, raw);
    else window.sessionStorage.setItem(key, raw);
  } catch {
    /* ignore quota/SSR issues */
  }
}

/** quick freshness stamp: `${count}-${max(updatedAt)}` */
function stamp(cities: City[]): string {
  if (!cities.length) return '0-0';
  const maxUpd = Math.max(...cities.map((c) => new Date(c.updatedAt).getTime()));
  return `${cities.length}-${maxUpd}`;
}

export function CitiesProvider({
  children,
  /** Optional server-provided cities (RSC). If omitted, we try to boot from storage. */
  cities: initialCities,
  /** Choose where to persist; "session" matches your “hard refresh” requirement */
  storageMode = 'session',
  /** Change this if you ever alter the shape; bump to invalidate old cache */
  storageKey = DEFAULT_STORAGE_KEY,
}: {
  children: React.ReactNode;
  cities?: City[]; // optional: RootLayout can pass server-fetched cities
  storageMode?: StorageMode;
  storageKey?: string;
}) {
  // 1) Initial source on the client: prefer storage, else the server prop, else []
  const [cities, setCities] = useState<City[]>(() => {
    if (typeof window === 'undefined') return initialCities ?? [];
    const stored = readStorage(storageKey, storageMode);
    return stored ?? initialCities ?? [];
  });

  // 2) Keep storage in sync whenever cities state changes
  useEffect(() => {
    writeStorage(storageKey, storageMode, cities);
  }, [cities, storageKey, storageMode]);

  // 3) If server passed fresher data than storage, adopt it once on mount
  useEffect(() => {
    if (!initialCities || !initialCities.length) return;
    // Compare stamps; if prop seems newer/different, take it
    const currentStamp = stamp(cities);
    const incomingStamp = stamp(initialCities);
    if (incomingStamp !== currentStamp) {
      setCities(initialCities);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  const value = useMemo(() => cities, [cities]);
  return <CitiesCtx.Provider value={value}>{children}</CitiesCtx.Provider>;
}

export const useCities = () => useContext(CitiesCtx) ?? [];

export function useCityName(id?: number | null) {
  const cities = useCities();
  return useMemo(() => {
    if (!id) return '';
    const c = cities.find((x) => x.id === id);
    return c?.name ?? '';
  }, [cities, id]);
}

export function useCityById(id?: number | null) {
  const cities = useCities();
  return useMemo(() => {
    if (!id) return null;
    return cities.find((x) => x.id === id) ?? null;
  }, [cities, id]);
}
