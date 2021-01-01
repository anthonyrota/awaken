import { isBrowser } from './env';
import { globalThemeCallbackKey } from './globalKeys';

export const ThemeLight = 'light';
export const ThemeDark = 'dark';

export type Theme = typeof ThemeLight | typeof ThemeDark;

const themeKey = 'theme';

function getStoredTheme(): string | null {
    return localStorage.getItem(themeKey);
}

function storeTheme(theme: Theme): void {
    localStorage.setItem(themeKey, theme);
}

const defaultTheme: Theme = ThemeDark;

function isValidThemeValue(value: string | null): value is Theme {
    return value === ThemeLight || value === ThemeDark;
}

export function setupTheme(): void {
    const theme = getStoredTheme();
    const newTheme =
        theme === null || !isValidThemeValue(theme) ? defaultTheme : theme;
    if (theme !== newTheme) {
        storeTheme(newTheme);
    }
    setThemeClass(newTheme);
    window.addEventListener('storage', (e) => {
        const { key, newValue } = e;
        if (key === themeKey && isValidThemeValue(newValue)) {
            setThemeClass(newValue);
            propagateThemeChange(newValue);
        }
    });
}

export function getTheme(): Theme {
    if (!isBrowser) {
        return defaultTheme;
    }
    const storedTheme = getStoredTheme();
    if (!isValidThemeValue(storedTheme)) {
        return defaultTheme;
    }
    return storedTheme;
}

type ThemeChangeCallbackList = (readonly [(theme: Theme) => void])[];

function getThemeChangeListeners(): ThemeChangeCallbackList {
    if (!(globalThemeCallbackKey in window)) {
        window[globalThemeCallbackKey] = [];
    }
    return window[globalThemeCallbackKey] as ThemeChangeCallbackList;
}

export function setTheme(theme: Theme): void {
    if (theme === getTheme()) {
        return;
    }
    storeTheme(theme);
    setThemeClass(theme);
    propagateThemeChange(theme);
}

function propagateThemeChange(newTheme: Theme): void {
    getThemeChangeListeners().forEach((box) => {
        const listener = box[0];
        listener(newTheme);
    });
}

export function onThemeChange(
    themeChangeListener: (theme: Theme) => void,
): () => void {
    const themeChangeListeners = getThemeChangeListeners();
    const box = [themeChangeListener] as const;
    themeChangeListeners.push(box);
    return () => {
        themeChangeListeners.splice(themeChangeListeners.indexOf(box, 1));
    };
}

const ThemeLightCssClass = 'cls-theme-light';
const ThemeDarkCssClass = 'cls-theme-dark';

function setThemeClass(theme: Theme): void {
    switch (theme) {
        case ThemeLight: {
            document.documentElement.classList.remove(ThemeDarkCssClass);
            document.documentElement.classList.add(ThemeLightCssClass);
            break;
        }
        case ThemeDark: {
            document.documentElement.classList.remove(ThemeLightCssClass);
            document.documentElement.classList.add(ThemeDarkCssClass);
            break;
        }
    }
}
