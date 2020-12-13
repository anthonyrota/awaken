export const isBrowser = /*@__PURE__*/ (() => typeof window !== 'undefined')();

export const isChromium = /*@__PURE__*/ (() =>
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    isBrowser && !!(window as any).chrome)();

export const isChromebook = /*@__PURE__*/ (() =>
    isBrowser && /\bCrOS\b/.test(navigator.userAgent))();

export const isMobile = /*@__PURE__*/ (() =>
    isBrowser &&
    // eslint-disable-next-line max-len
    (/\b(BlackBerry|webOS|iPhone|IEMobile|Android|Windows Phone|iPad|iPod)\b/i.test(
        navigator.userAgent,
    ) ||
        // Newer iPad.
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)))();

export const isStandalone = /*@__PURE__*/ (() =>
    isBrowser &&
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (!!(window.navigator as any).standalone ||
        window.matchMedia('(display-mode: standalone)').matches))();
