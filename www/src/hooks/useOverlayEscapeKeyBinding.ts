import { useEffect } from 'preact/hooks';
import { stopEvent } from '../util/stopEvent';

export interface UseOverlayEscapeKeyBindingParams {
    getIsOpen: () => boolean;
    close: () => void;
}

export function useOverlayEscapeKeyBinding({
    getIsOpen,
    close,
}: UseOverlayEscapeKeyBindingParams): void {
    useEffect(() => {
        if (!getIsOpen()) {
            return;
        }
        const listener = (event: KeyboardEvent) => {
            if (
                event.ctrlKey ||
                event.metaKey ||
                event.altKey ||
                event.shiftKey
            ) {
                return;
            }

            switch (event.key) {
                case 'Escape':
                case 'Esc': {
                    close();
                    stopEvent(event);
                    break;
                }
            }
        };
        document.addEventListener('keydown', listener);
        return () => {
            document.removeEventListener('keydown', listener);
        };
    }, [getIsOpen()]);
}
