export const isBrowser = typeof window !== 'undefined';

export const isChromium =
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    isBrowser && !!(window as any).chrome;

// eslint-disable-next-line max-len
export const isMobile =
    isBrowser &&
    // eslint-disable-next-line max-len
    /\b(BlackBerry|webOS|iPhone|IEMobile|Android|Windows Phone|iPad|iPod)\b/i.test(
        navigator.userAgent,
    );

export const isStandalone =
    isBrowser &&
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (!!(window.navigator as any).standalone ||
        window.matchMedia('(display-mode: standalone)').matches);
