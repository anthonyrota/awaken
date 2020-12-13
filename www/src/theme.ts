import { isBrowser } from './env';

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

export function setupTheme(): void {
    const theme = getStoredTheme();
    const newTheme =
        theme === null || (theme !== ThemeLight && theme !== ThemeDark)
            ? defaultTheme
            : theme;
    if (theme !== newTheme) {
        storeTheme(newTheme);
    }
    setThemeClass(newTheme);
}

export function getTheme(): Theme {
    // Already initialized in template.html.
    return isBrowser ? (getStoredTheme() as Theme) : ThemeDark;
}

const themeChangeListeners: (readonly [(theme: Theme) => void])[] = [];

export function setTheme(theme: Theme): void {
    if (theme === getTheme()) {
        return;
    }
    storeTheme(theme);
    setThemeClass(theme);
    themeChangeListeners.forEach(([listener]) => {
        listener(theme);
    });
}

export function onThemeChange(
    themeChangeListener: (theme: Theme) => void,
): () => void {
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
