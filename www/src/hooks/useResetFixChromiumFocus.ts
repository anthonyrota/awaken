import { useEffect } from 'preact/hooks';

export interface UseResetFixChromiumFocusParams {
    fixChromiumFocus: boolean;
    resetFixChromiumFocus: () => void;
    isMovingFocusManuallyRef: { current: boolean };
    isEventTargetPartOfComponent: (element: EventTarget) => boolean;
}

export function useResetFixChromiumFocus(
    params: UseResetFixChromiumFocusParams,
): void {
    const {
        fixChromiumFocus,
        resetFixChromiumFocus,
        isMovingFocusManuallyRef,
        isEventTargetPartOfComponent,
    } = params;

    useEffect(() => {
        if (!fixChromiumFocus) {
            return;
        }
        const listener = (event: FocusEvent) => {
            if (
                fixChromiumFocus &&
                !isMovingFocusManuallyRef.current &&
                event.target &&
                isEventTargetPartOfComponent(event.target) &&
                // Moving focus away and back to window reintroduces.
                document.hasFocus()
            ) {
                resetFixChromiumFocus();
            }
        };
        document.addEventListener('focusout', listener);
        return () => document.removeEventListener('focusout', listener);
    }, [fixChromiumFocus]);
}
