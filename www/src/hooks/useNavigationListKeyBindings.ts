import { useRef, useEffect, useState, StateUpdater } from 'preact/hooks';
import { isChromium } from '../env';
import { stopEvent } from '../util/stopEvent';
import { useResetFixChromiumFocus } from './useResetFixChromiumFocus';

// Not supported in IE.
function findIndex<T>(
    list: readonly T[],
    predicate: (value: T) => boolean,
    startIndex = 0,
    endIndex = list.length - 1,
): number {
    for (let i = startIndex; i <= endIndex; i++) {
        if (predicate(list[i])) {
            return i;
        }
    }
    return -1;
}

export const NoBindKeys = 0;
export const BindKeysRequireFocus = 1;
export const BindKeysNoRequireFocus = 2;
export type BindKeys =
    | typeof NoBindKeys
    | typeof BindKeysRequireFocus
    | typeof BindKeysNoRequireFocus;

export interface UseNavigationListKeyBindingsParams {
    bindKeys: BindKeys;
    getAllowSingleLetterKeyLinkJumpShortcut?: (() => boolean) | undefined;
    isMovingFocusManuallyRef?: { current: boolean };
    linkTexts: string[];
    linkRefs: { current: HTMLAnchorElement }[];
    fixChromiumFocus?: [boolean, StateUpdater<boolean>];
}

export const fixChromiumFocusClass = 'cls-fix-chromium-focus';
export interface UseNavigationListKeyBindingsResult {
    fixChromiumFocus: boolean;
}

export function useNavigationListKeyBindings({
    bindKeys,
    getAllowSingleLetterKeyLinkJumpShortcut,
    isMovingFocusManuallyRef = useRef(false),
    linkTexts,
    linkRefs,
    fixChromiumFocus: fixChromiumFocusParam,
}: UseNavigationListKeyBindingsParams): UseNavigationListKeyBindingsResult {
    const { 0: fixChromiumFocus, 1: setFixChromiumFocus } =
        fixChromiumFocusParam || useState<boolean>(false);
    const isChromiumFocusedElementOnKeyShortcutQuirkyRef = useRef({
        value: false,
        activeElement: null as Element | null,
    });

    if (isChromium) {
        useEffect(() => {
            if (bindKeys === NoBindKeys) {
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
                            // This callback should be called synchronously.
                            setFixChromiumFocus((value) => {
                                if (
                                    // eslint-disable-next-line max-len
                                    isChromiumFocusedElementOnKeyShortcutQuirkyRef
                                        .current.value &&
                                    document.activeElement ===
                                        // eslint-disable-next-line max-len
                                        isChromiumFocusedElementOnKeyShortcutQuirkyRef
                                            .current.activeElement &&
                                    matchesFocusVisible &&
                                    !value
                                ) {
                                    // Example case: when the anchor is focused
                                    // but does not match :focus-visible and the
                                    // user hits a key, the anchor will match
                                    // :focus-visible but no outline will be
                                    // shown.
                                    // eslint-disable-next-line max-len
                                    isChromiumFocusedElementOnKeyShortcutQuirky = true;
                                }
                                return value;
                            });
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
        }, [bindKeys === NoBindKeys]);
    }

    const setFocus = (element: HTMLElement) => {
        if (
            findIndex(linkRefs, (ref) => ref.current === element) !== -1 &&
            isChromiumFocusedElementOnKeyShortcutQuirkyRef.current.value
        ) {
            setFixChromiumFocus(true);
        }

        isMovingFocusManuallyRef.current = true;
        element.focus();
        isMovingFocusManuallyRef.current = false;
    };

    if (isChromium && !fixChromiumFocusParam) {
        useResetFixChromiumFocus({
            fixChromiumFocus,
            resetFixChromiumFocus: () => setFixChromiumFocus(false),
            isMovingFocusManuallyRef,
            isEventTargetPartOfComponent: (target) =>
                linkRefs.some((ref) => ref.current === target),
        });
    }

    function getLinkFocusIndex(): number {
        const focusedElement = document.activeElement;
        return findIndex(linkRefs, (ref) => ref.current === focusedElement);
    }

    useEffect(() => {
        if (!bindKeys) {
            return;
        }
        const listener = (event: KeyboardEvent) => {
            if (
                bindKeys === BindKeysRequireFocus &&
                getLinkFocusIndex() === -1
            ) {
                return;
            }

            if (event.ctrlKey || event.metaKey || event.altKey) {
                return;
            }

            if (
                event.key.length === 1 &&
                /\S/.test(event.key) &&
                (!getAllowSingleLetterKeyLinkJumpShortcut ||
                    getAllowSingleLetterKeyLinkJumpShortcut())
            ) {
                const index = getLinkFocusIndex();
                const predicate = (title: string) =>
                    title.toLowerCase()[0] === event.key.toLowerCase();
                let nextIndexStartingWithChar = findIndex(
                    linkTexts,
                    predicate,
                    index + 1,
                );
                if (nextIndexStartingWithChar === -1) {
                    nextIndexStartingWithChar = findIndex(
                        linkTexts,
                        predicate,
                        0,
                        index - 1,
                    );
                }
                if (nextIndexStartingWithChar === -1) {
                    return;
                }
                setFocus(linkRefs[nextIndexStartingWithChar].current);
                if (event.shiftKey) {
                    stopEvent(event);
                }
                return;
            }

            if (event.shiftKey) {
                return;
            }

            switch (event.key) {
                case 'ArrowUp':
                case 'Up': {
                    const index = getLinkFocusIndex();
                    if (index === -1) {
                        return;
                    }
                    setFocus(
                        linkRefs[index === 0 ? linkRefs.length - 1 : index - 1]
                            .current,
                    );
                    stopEvent(event);
                    break;
                }
                case 'ArrowDown':
                case 'Down': {
                    const index = getLinkFocusIndex();
                    if (index === -1) {
                        return;
                    }
                    setFocus(
                        linkRefs[index === linkRefs.length - 1 ? 0 : index + 1]
                            .current,
                    );
                    stopEvent(event);
                    break;
                }
                case 'Home':
                case 'PageUp': {
                    setFocus(linkRefs[0].current);
                    stopEvent(event);
                    break;
                }
                case 'End':
                case 'PageDown': {
                    setFocus(linkRefs[linkRefs.length - 1].current);
                    stopEvent(event);
                }
            }
        };
        document.addEventListener('keydown', listener);
        return () => {
            document.removeEventListener('keydown', listener);
        };
    }, [bindKeys]);

    return {
        fixChromiumFocus,
    };
}
