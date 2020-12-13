import { useEffect } from 'preact/hooks';

export function useSizeShowMenuChange(
    callback: (isSizeShowMenu: boolean) => void,
    condition: boolean,
    useInitial?: boolean,
): void {
    useEffect(() => {
        if (!condition) {
            return;
        }

        let mql: MediaQueryList | null = window.matchMedia(
            'screen and (max-width: 840px)',
        );

        const listener = () => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            callback(mql!.matches);
        };

        mql.addEventListener('change', listener);

        if (useInitial) {
            callback(mql.matches);
        }

        return () => {
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            mql!.removeEventListener('change', listener);
            mql = null;
        };
    });
}
