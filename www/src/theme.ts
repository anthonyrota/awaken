import { isBrowser } from './env';
export const ThemeLight = 'theme-light';
export const ThemeDark = 'theme-dark';

export type Theme = typeof ThemeLight | typeof ThemeDark;

const themeKey = 'theme';
const defaultTheme: Theme = ThemeDark;

export function setupTheme(): void {
    const theme = localStorage.getItem(themeKey);
    setThemeClass(
        theme === null || (theme !== ThemeLight && theme !== ThemeDark)
            ? defaultTheme
            : theme,
    );
}

export function getTheme(): Theme {
    // Already initialized in template.html.
    return isBrowser ? (localStorage.getItem(themeKey) as Theme) : ThemeDark;
}

export function setTheme(theme: Theme): void {
    localStorage.setItem(themeKey, theme);
    setThemeClass(theme);
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
