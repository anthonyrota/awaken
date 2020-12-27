import { useRef, useEffect, useState, StateUpdater } from 'preact/hooks';
import { isChromium } from '../env';
import { findIndex } from '../util/findIndex';
import { stopEvent } from '../util/stopEvent';
import { useIsChromiumFocusedElementOnKeyShortcutQuirky } from './useIsChromiumFocusedElementOnKeyShortcutQuirky';
import { useResetFixChromiumFocus } from './useResetFixChromiumFocus';

export const NoBindKeys = 0;
export const BindKeysRequireFocus = 1;
export const BindKeysNoRequireFocus = 2;
export type BindKeys =
    | typeof NoBindKeys
    | typeof BindKeysRequireFocus
    | typeof BindKeysNoRequireFocus;

export interface UseNavigationListKeyBindingsParams {
    bindKeys: BindKeys;
    bindKeysRequireFocusAllowAnyways?: () => boolean;
    getAllowSingleLetterKeyLinkJumpShortcut?: () => boolean;
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
    bindKeysRequireFocusAllowAnyways,
    getAllowSingleLetterKeyLinkJumpShortcut,
    isMovingFocusManuallyRef = useRef(false),
    linkTexts,
    linkRefs,
    fixChromiumFocus: fixChromiumFocusParam,
}: UseNavigationListKeyBindingsParams): UseNavigationListKeyBindingsResult {
    const { 0: fixChromiumFocus, 1: setFixChromiumFocus } =
        fixChromiumFocusParam || useState<boolean>(false);

    // eslint-disable-next-line max-len
    const isChromiumFocusedElementOnKeyShortcutQuirky = useIsChromiumFocusedElementOnKeyShortcutQuirky(
        {
            isKeyShortcutActive: bindKeys === NoBindKeys,
            getFixChromiumFocus: (): boolean => {
                let fixChromiumFocus: boolean | undefined;
                setFixChromiumFocus((value) => {
                    fixChromiumFocus = value;
                    return value;
                });
                if (fixChromiumFocus === undefined) {
                    throw new Error();
                }
                return fixChromiumFocus;
            },
        },
    );

    const setFocus = (element: HTMLElement) => {
        if (
            findIndex(linkRefs, (ref) => ref.current === element) !== -1 &&
            isChromiumFocusedElementOnKeyShortcutQuirky()
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
            if (event.ctrlKey || event.metaKey || event.altKey) {
                return;
            }

            if (
                bindKeys === BindKeysRequireFocus &&
                !(
                    bindKeysRequireFocusAllowAnyways &&
                    bindKeysRequireFocusAllowAnyways()
                ) &&
                getLinkFocusIndex() === -1
            ) {
                return;
            }

            if (
                event.key.length === 1 &&
                /\S/.test(event.key) &&
                getAllowSingleLetterKeyLinkJumpShortcut &&
                getAllowSingleLetterKeyLinkJumpShortcut()
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
