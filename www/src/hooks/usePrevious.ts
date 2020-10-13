import { useRef, useLayoutEffect } from 'preact/hooks';

export function usePrevious<T>(value: T): { value: T } | null {
    const ref = useRef<{ value: T } | null>(null);
    useLayoutEffect(() => {
        ref.current = { value };
    }, []);
    return ref.current;
}
