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

export const UseStickyNativeStickyReady = 1;
export const UseStickyJsStickyActive = 2;
export const UseStickyNativeNotReadyOrJsStickyNotActive = 0;

export interface UseStickyResult<El extends HTMLElement> {
    heightStyle: string | undefined;
    stickyState:
        | typeof UseStickyNativeStickyReady
        | typeof UseStickyJsStickyActive
        | typeof UseStickyNativeNotReadyOrJsStickyNotActive;
    elRefCb: RefCallback<El>;
}

export function useSticky<El extends HTMLElement>(): UseStickyResult<El> {
    const { 0: heightStyle, 1: setHeightStyle } = useState<string | undefined>(
        undefined,
    );
    const { 0: stickyState, 1: setStickyState } = useState<
        UseStickyResult<El>['stickyState']
    >(UseStickyNativeNotReadyOrJsStickyNotActive);

    const setup = (el: El) => {
        const listener = () => {
            const elementTop = el.getBoundingClientRect().top;
            const _100vh = Math.max(
                document.documentElement.clientHeight,
                window.innerHeight || 0,
            );
            setHeightStyle(
                elementTop > 0 ? `${_100vh - elementTop}px` : undefined,
            );
            if (supportsSticky) {
                return;
            }
            setStickyState(
                elementTop > 0
                    ? UseStickyNativeNotReadyOrJsStickyNotActive
                    : UseStickyJsStickyActive,
            );
        };
        requestAnimationFrame(() => {
            listener();
        });
        if (supportsSticky) {
            setStickyState(UseStickyNativeStickyReady);
        }
        document.addEventListener('scroll', listener);
        window.addEventListener('resize', listener);
        return () => {
            document.removeEventListener('scroll', listener);
            window.addEventListener('resize', listener);
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
