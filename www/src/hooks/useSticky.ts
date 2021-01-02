import { RefCallback } from 'preact';
import { useState, useRef, useCallback } from 'preact/hooks';
import { isBrowser } from '../env';

const supportsSticky =
    isBrowser &&
    (typeof CSS !== 'undefined' && 'supports' in CSS
        ? CSS.supports('position', 'sticky') ||
          CSS.supports('position', '-webkit-sticky')
        : (() => {
              const tempDiv = document.createElement('div');
              tempDiv.style.position = 'sticky';
              if (tempDiv.style.position === 'sticky') {
                  return true;
              }
              tempDiv.style.position = '-webkit-sticky';
              return tempDiv.style.position === '-webkit-sticky';
          })());

export const UseStickyNativeStickyReady = 0;
export const UseStickyJsStickyActive = 1;
export const UseStickyNativeNotReadyOrJsStickyNotActive = 2;

export interface UseStickyResult<El extends HTMLElement> {
    heightStyle: string | undefined;
    stickyState:
        | typeof UseStickyNativeStickyReady
        | typeof UseStickyJsStickyActive
        | typeof UseStickyNativeNotReadyOrJsStickyNotActive;
    elRefCb: RefCallback<El>;
}

export interface UseStickyParams {
    useNativeSticky?: boolean;
    calculateHeight?: boolean;
}

export function useSticky<El extends HTMLElement>({
    useNativeSticky = supportsSticky,
    calculateHeight = true,
}: UseStickyParams = {}): UseStickyResult<El> {
    const { 0: heightStyle, 1: setHeightStyle } = useState<string | undefined>(
        undefined,
    );
    const { 0: stickyState, 1: setStickyState } = useState<
        UseStickyResult<El>['stickyState']
    >(UseStickyNativeNotReadyOrJsStickyNotActive);

    const setup = (el: El) => {
        const listener = () => {
            const elementTop = el.getBoundingClientRect().top;
            if (calculateHeight) {
                const _100vh = Math.max(
                    document.documentElement.clientHeight,
                    window.innerHeight || 0,
                );
                setHeightStyle(
                    elementTop > 0 ? `${_100vh - elementTop}px` : undefined,
                );
            }
            if (useNativeSticky) {
                return;
            }
            setStickyState(
                elementTop > 0
                    ? UseStickyNativeNotReadyOrJsStickyNotActive
                    : UseStickyJsStickyActive,
            );
        };
        let rafHandle: number | undefined;
        function listenerRaf(): void {
            rafHandle = requestAnimationFrame(listener);
        }
        listenerRaf();
        if (useNativeSticky) {
            setStickyState(UseStickyNativeStickyReady);
        }
        document.addEventListener('scroll', listenerRaf);
        window.addEventListener('resize', listenerRaf);
        return () => {
            if (rafHandle !== undefined) {
                cancelAnimationFrame(rafHandle);
            }
            document.removeEventListener('scroll', listenerRaf);
            window.removeEventListener('resize', listenerRaf);
        };
    };

    const cleanupRef = useRef<(() => void) | undefined>(undefined);
    return {
        heightStyle,
        stickyState,
        elRefCb: useCallback((el) => {
            if (cleanupRef.current) {
                cleanupRef.current();
            }

            if (el) {
                cleanupRef.current = setup(el);
            }
        }, []),
    };
}
