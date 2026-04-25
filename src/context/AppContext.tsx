import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LOCALES, type CountryCode, type Locale } from "@/lib/locales";
import type { UILocale } from "@/lib/i18n";
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
  uiLocale: UILocale;
  setUiLocale: (l: UILocale) => void;
  gender: "female" | "male" | "other" | null;
  setGender: (g: "female" | "male" | "other" | null) => void;
}

const Ctx = createContext<AppContextValue | null>(null);

const LS_KEYS = {
  country: "unmapped.country",
  view: "unmapped.view",
  profile: "unmapped.profile",
  uiLocale: "unmapped.uiLocale",
  gender: "unmapped.gender",
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
  const [uiLocaleState, setUiLocaleState] = useState<UILocale>("en");
  const [gender, setGenderState] = useState<"female" | "male" | "other" | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const country = readLS<CountryCode>(LS_KEYS.country, "GH");
    setCountryCodeState(country);
    setViewModeState(readLS<ViewMode>(LS_KEYS.view, "user"));
    setProfileState(readLS<UserProfile | null>(LS_KEYS.profile, null));
    setGenderState(readLS<"female" | "male" | "other" | null>(LS_KEYS.gender, null));
    // Default uiLocale to 'ur' for Pakistan unless manually overridden
    const savedLocale = readLS<UILocale | null>(LS_KEYS.uiLocale, null);
    setUiLocaleState(savedLocale ?? (country === "PK" ? "ur" : "en"));
    setHydrated(true);
  }, []);

  const setCountry = useCallback((c: CountryCode) => {
    setCountryCodeState(c);
    if (typeof window !== "undefined") localStorage.setItem(LS_KEYS.country, JSON.stringify(c));
    // Auto-switch UI language when country changes (unless manually set)
    const savedLocale = readLS<UILocale | null>(LS_KEYS.uiLocale, null);
    if (!savedLocale) {
      setUiLocaleState(c === "PK" ? "ur" : "en");
    }
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
  const setUiLocale = useCallback((l: UILocale) => {
    setUiLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem(LS_KEYS.uiLocale, JSON.stringify(l));
  }, []);
  const setGender = useCallback((g: "female" | "male" | "other" | null) => {
    setGenderState(g);
    if (typeof window !== "undefined") localStorage.setItem(LS_KEYS.gender, JSON.stringify(g));
  }, []);
  const resetAll = useCallback(() => {
    setProfile(null);
    setViewMode("user");
    setGender(null);
  }, [setProfile, setViewMode, setGender]);

  const value = useMemo<AppContextValue>(() => ({
    locale: LOCALES[countryCode],
    countryCode,
    setCountry,
    viewMode,
    setViewMode,
    profile,
    setProfile,
    resetAll,
    uiLocale: uiLocaleState,
    setUiLocale,
    gender,
    setGender,
  }), [countryCode, viewMode, profile, uiLocaleState, gender, setCountry, setViewMode, setProfile, resetAll, setUiLocale, setGender]);

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
