import { useState, useLayoutEffect } from 'preact/hooks';

export const FullScreenOverlayOpenTransitionType = 0;
export const FullScreenOverlayCloseWithSettingFocusTransitionType = 1;
export const FullScreenOverlayCloseWithoutSettingFocusTransitionType = 2;
export type FullScreenOverlayTransitionType =
    | typeof FullScreenOverlayOpenTransitionType
    | typeof FullScreenOverlayCloseWithSettingFocusTransitionType
    | typeof FullScreenOverlayCloseWithoutSettingFocusTransitionType;

export interface UseFullScreenOverlayStateParams {
    setFocusOnOpen: () => void;
    setFocusOnClose: () => void;
}

export interface UseFullScreenOverlayStateResult {
    isOpen: boolean;
    getIsOpen: () => boolean;
    transitionState: (transitionType: FullScreenOverlayTransitionType) => void;
}

export function useFullScreenOverlayState({
    setFocusOnOpen,
    setFocusOnClose,
}: UseFullScreenOverlayStateParams): UseFullScreenOverlayStateResult {
    const { 0: state, 1: setState } = useState<FullScreenOverlayTransitionType>(
        FullScreenOverlayCloseWithoutSettingFocusTransitionType,
    );

    useLayoutEffect(() => {
        if (state === FullScreenOverlayOpenTransitionType) {
            requestAnimationFrame(() => {
                setFocusOnOpen();
            });
        } else if (
            state === FullScreenOverlayCloseWithSettingFocusTransitionType
        ) {
            setFocusOnClose();
        }
    }, [state]);

    return {
        isOpen: state === FullScreenOverlayOpenTransitionType,
        getIsOpen: () => {
            let isOpen: boolean | undefined;
            setState((state) => {
                isOpen = state === FullScreenOverlayOpenTransitionType;
                return state;
            });
            if (isOpen === undefined) {
                throw new Error();
            }
            return isOpen;
        },
        transitionState: setState,
    };
}
