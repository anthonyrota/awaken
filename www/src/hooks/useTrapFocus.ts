import { useEffect } from 'preact/hooks';

export interface UseTrapFocusParams {
    getShouldTrapFocus: () => boolean;
    shouldIgnoreChangedFocus: (focusedElement: Element) => boolean;
    getStartFocusPlaceholder: () => HTMLElement;
    getEndFocusPlaceholder: () => HTMLElement;
    setFocusStart: () => void;
    setFocusEnd: () => void;
    onFocusOutside: () => void;
}

export function useTrapFocus({
    getShouldTrapFocus,
    shouldIgnoreChangedFocus,
    getStartFocusPlaceholder,
    getEndFocusPlaceholder,
    setFocusStart,
    setFocusEnd,
    onFocusOutside,
}: UseTrapFocusParams): void {
    useEffect(() => {
        if (!getShouldTrapFocus()) {
            return;
        }
        const listener = () => {
            if (!getShouldTrapFocus()) {
                return;
            }
            const focusedElement = document.activeElement;
            if (
                !focusedElement ||
                focusedElement === document.body ||
                shouldIgnoreChangedFocus(focusedElement)
            ) {
                return;
            }
            if (focusedElement === getStartFocusPlaceholder()) {
                setFocusEnd();
            } else if (focusedElement === getEndFocusPlaceholder()) {
                setFocusStart();
            } else {
                onFocusOutside();
            }
        };
        document.addEventListener('focusin', listener);
        return () => {
            document.removeEventListener('focusin', listener);
        };
    }, [getShouldTrapFocus()]);
}
