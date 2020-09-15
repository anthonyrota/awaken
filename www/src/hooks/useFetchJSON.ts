import { useState, useEffect } from 'preact/hooks';
import { fetchJSON } from '../util/fetchJSON';

export type LoadingType = 0;
export const LoadingType: LoadingType = 0;
export type ErrorType = 1;
export const ErrorType: ErrorType = 1;
export type DoneType = 2;
export const DoneType: DoneType = 2;

export type FetchJSONResult<Data = unknown> =
    | { type: LoadingType }
    | { type: ErrorType; error: unknown }
    | { type: DoneType; data: Data };

export function useFetchJSON(url: string): FetchJSONResult {
    let urlIndex = 0;
    const [result, setResult] = useState<FetchJSONResult>({
        type: LoadingType,
    });

    useEffect(() => {
        const urlIndex_ = urlIndex;

        if (result.type !== DoneType) {
            setResult({
                type: LoadingType,
            });
        }

        fetchJSON(url)
            .then((data) => {
                if (urlIndex_ === urlIndex) {
                    setResult({
                        type: DoneType,
                        data,
                    });
                }
            })
            .catch((error: unknown) => {
                if (urlIndex_ === urlIndex) {
                    setResult({
                        type: ErrorType,
                        error,
                    });
                }
            });

        return () => urlIndex++;
    }, [url]);

    return result;
}
