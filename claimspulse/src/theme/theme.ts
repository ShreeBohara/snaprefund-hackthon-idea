export type ThemeMode = "dark" | "light";

export interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const THEME_STORAGE_KEY = "claimspulse_theme";

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "dark" || value === "light";
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getInitialTheme(storage: Pick<Storage, "getItem"> | null = getBrowserStorage()): ThemeMode {
  const storedValue = storage?.getItem(THEME_STORAGE_KEY) ?? null;
  if (isThemeMode(storedValue)) {
    return storedValue;
  }

  return "dark";
}

export function applyThemeToDocument(mode: ThemeMode): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
}
