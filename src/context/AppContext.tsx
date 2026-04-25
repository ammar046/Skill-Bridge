import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LOCALES, type CountryCode, type Locale } from "@/lib/locales";
import type { UserProfile } from "@/types/api";

type ViewMode = "user" | "admin";

interface AppContextValue {
  locale: Locale;
  countryCode: CountryCode;
  setCountry: (c: CountryCode) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;
  resetAll: () => void;
}

const Ctx = createContext<AppContextValue | null>(null);

const LS_KEYS = {
  country: "unmapped.country",
  view: "unmapped.view",
  profile: "unmapped.profile",
};

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [countryCode, setCountryCodeState] = useState<CountryCode>("GH");
  const [viewMode, setViewModeState] = useState<ViewMode>("user");
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate after mount to avoid SSR mismatch
  useEffect(() => {
    setCountryCodeState(readLS<CountryCode>(LS_KEYS.country, "GH"));
    setViewModeState(readLS<ViewMode>(LS_KEYS.view, "user"));
    setProfileState(readLS<UserProfile | null>(LS_KEYS.profile, null));
    setHydrated(true);
  }, []);

  const setCountry = useCallback((c: CountryCode) => {
    setCountryCodeState(c);
    if (typeof window !== "undefined") localStorage.setItem(LS_KEYS.country, JSON.stringify(c));
  }, []);
  const setViewMode = useCallback((v: ViewMode) => {
    setViewModeState(v);
    if (typeof window !== "undefined") localStorage.setItem(LS_KEYS.view, JSON.stringify(v));
  }, []);
  const setProfile = useCallback((p: UserProfile | null) => {
    setProfileState(p);
    if (typeof window !== "undefined") {
      if (p) localStorage.setItem(LS_KEYS.profile, JSON.stringify(p));
      else localStorage.removeItem(LS_KEYS.profile);
    }
  }, []);
  const resetAll = useCallback(() => {
    setProfile(null);
    setViewMode("user");
  }, [setProfile, setViewMode]);

  const value = useMemo<AppContextValue>(() => ({
    locale: LOCALES[countryCode],
    countryCode,
    setCountry,
    viewMode,
    setViewMode,
    profile,
    setProfile,
    resetAll,
  }), [countryCode, viewMode, profile, setCountry, setViewMode, setProfile, resetAll]);

  // Avoid hydration flicker by rendering a stable shell first
  if (!hydrated) {
    return <Ctx.Provider value={value}><div style={{ visibility: "hidden" }}>{children}</div></Ctx.Provider>;
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
