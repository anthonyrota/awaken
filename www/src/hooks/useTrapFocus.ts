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
        let animationRequestId: number | undefined;
        const listener = () => {
            if (animationRequestId !== undefined) {
                cancelAnimationFrame(animationRequestId);
                animationRequestId = undefined;
            }
            animationRequestId = requestAnimationFrame(() => {
                animationRequestId = undefined;
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
            });
        };
        document.addEventListener('focusout', listener);
        return () => {
            if (animationRequestId !== undefined) {
                cancelAnimationFrame(animationRequestId);
            }
            document.removeEventListener('focusout', listener);
        };
    }, [getShouldTrapFocus()]);
}
