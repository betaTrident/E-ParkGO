"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

const STORAGE_KEY = "theme"

type ThemeSetting = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

type ThemeContextValue = {
  theme: ThemeSetting
  setTheme: (theme: ThemeSetting) => void
  resolvedTheme: ResolvedTheme | undefined
  systemTheme: ResolvedTheme | undefined
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function resolveTheme(theme: ThemeSetting): ResolvedTheme {
  return theme === "system" ? readSystemTheme() : theme
}

function applyResolvedTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(resolved)
  root.style.colorScheme = resolved
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSetting>("system")
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme | undefined>(
    undefined,
  )
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme | undefined>(
    undefined,
  )

  const setTheme = useCallback((next: ThemeSetting) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Ignore storage failures (private mode, blocked storage).
    }
    const resolved = resolveTheme(next)
    setResolvedTheme(resolved)
    applyResolvedTheme(resolved)
  }, [])

  useEffect(() => {
    let stored: ThemeSetting = "system"
    try {
      const value = localStorage.getItem(STORAGE_KEY)
      if (value === "light" || value === "dark" || value === "system") {
        stored = value
      }
    } catch {
      stored = "system"
    }

    const system = readSystemTheme()
    const resolved = stored === "system" ? system : stored
    setThemeState(stored)
    setSystemTheme(system)
    setResolvedTheme(resolved)
    applyResolvedTheme(resolved)
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      const system = readSystemTheme()
      setSystemTheme(system)
      if (theme === "system") {
        setResolvedTheme(system)
        applyResolvedTheme(system)
      }
    }

    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      systemTheme,
    }),
    [resolvedTheme, setTheme, systemTheme, theme],
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      theme: "system" as ThemeSetting,
      setTheme: () => undefined,
      resolvedTheme: undefined,
      systemTheme: undefined,
      themes: ["light", "dark", "system"] as const,
    }
  }

  return {
    ...context,
    themes: ["light", "dark", "system"] as const,
  }
}
