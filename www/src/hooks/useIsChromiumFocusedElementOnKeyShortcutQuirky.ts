import { useRef, useEffect } from 'preact/hooks';
import { isChromium } from '../env';

export interface UseIsChromiumFocusedElementOnKeyShortcutQuirkyParams {
    isKeyShortcutActive: boolean;
    getFixChromiumFocus: () => boolean;
}

export function useIsChromiumFocusedElementOnKeyShortcutQuirky({
    isKeyShortcutActive,
    getFixChromiumFocus,
}: UseIsChromiumFocusedElementOnKeyShortcutQuirkyParams): () => boolean {
    const isChromiumFocusedElementOnKeyShortcutQuirkyRef = useRef({
        value: false,
        activeElement: null as Element | null,
    });

    if (isChromium) {
        useEffect(() => {
            if (isKeyShortcutActive) {
                return;
            }
            let animationId = requestAnimationFrame(function cb(): void {
                let isChromiumFocusedElementOnKeyShortcutQuirky = false;
                if (document.activeElement) {
                    if (document.activeElement.tagName === 'INPUT') {
                        isChromiumFocusedElementOnKeyShortcutQuirky = true;
                    } else if ('matches' in document.activeElement) {
                        let matchesFocusVisible: boolean | undefined;
                        try {
                            // eslint-disable-next-line max-len
                            matchesFocusVisible = document.activeElement.matches(
                                ':focus-visible',
                            );
                        } catch (error) {
                            // Focus visible not supported;
                        }
                        if (matchesFocusVisible) {
                            const fixChromiumFocus = getFixChromiumFocus();
                            if (
                                // eslint-disable-next-line max-len
                                isChromiumFocusedElementOnKeyShortcutQuirkyRef
                                    .current.value &&
                                document.activeElement ===
                                    // eslint-disable-next-line max-len
                                    isChromiumFocusedElementOnKeyShortcutQuirkyRef
                                        .current.activeElement &&
                                matchesFocusVisible &&
                                !fixChromiumFocus
                            ) {
                                // Example case: when the anchor is focused
                                // but does not match :focus-visible and the
                                // user hits a key, the anchor will match
                                // :focus-visible but no outline will be
                                // shown.
                                // eslint-disable-next-line max-len
                                isChromiumFocusedElementOnKeyShortcutQuirky = true;
                            }
                        } else if (matchesFocusVisible !== undefined) {
                            isChromiumFocusedElementOnKeyShortcutQuirky = true;
                        }
                    }
                }
                // eslint-disable-next-line max-len
                isChromiumFocusedElementOnKeyShortcutQuirkyRef.current = {
                    value: isChromiumFocusedElementOnKeyShortcutQuirky,
                    activeElement: document.activeElement,
                };
                animationId = requestAnimationFrame(cb);
            });
            return () => {
                cancelAnimationFrame(animationId);
            };
        }, [isKeyShortcutActive]);
    }

    return () => isChromiumFocusedElementOnKeyShortcutQuirkyRef.current.value;
}
