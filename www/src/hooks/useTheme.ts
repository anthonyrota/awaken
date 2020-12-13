import { useState, useEffect } from 'preact/hooks';
import { Theme, getTheme, onThemeChange } from '../theme';

export function useTheme(): Theme {
    const { 0: theme, 1: setTheme } = useState<Theme>(getTheme());

    useEffect(() => {
        return onThemeChange(setTheme);
    }, []);

    return theme;
}
