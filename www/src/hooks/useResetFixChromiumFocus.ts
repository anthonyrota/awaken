import { useEffect } from 'preact/hooks';

export interface UseResetFixChromiumFocusParams {
    fixChromiumFocus: boolean;
    resetFixChromiumFocus: () => void;
    isMovingFocusManuallyRef: { current: boolean };
    linkRefs: { current: HTMLAnchorElement }[];
}

export function useResetFixChromiumFocus(
    params: UseResetFixChromiumFocusParams,
): void {
    const {
        fixChromiumFocus,
        resetFixChromiumFocus,
        isMovingFocusManuallyRef,
        linkRefs,
    } = params;

    useEffect(() => {
        if (!fixChromiumFocus) {
            return;
        }
        const listener = (event: FocusEvent) => {
            if (
                fixChromiumFocus &&
                !isMovingFocusManuallyRef.current &&
                linkRefs.some((ref) => ref.current === event.target) &&
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
