import 'promise-polyfill/src/polyfill';
import 'unfetch/polyfill';
import { h, Fragment, render, VNode } from 'preact';
import { useState, useEffect, useMemo } from 'preact/hooks';
import { PageNodeMapWithMetadata } from '../script/docs/apigen/types';

type LoadingType = 0;
const LoadingType: LoadingType = 0;
type ErrorType = 1;
const ErrorType: ErrorType = 1;
type DoneType = 2;
const DoneType: DoneType = 2;

type FetchJSONResult<Data = unknown> =
    | { type: LoadingType }
    | { type: ErrorType; error: unknown }
    | { type: DoneType; data: Data };

function useFetchJSON(url: string): FetchJSONResult {
    const [result, setResult] = useState<FetchJSONResult>({
        type: LoadingType,
    });

    useEffect(() => {
        if (result.type !== DoneType) {
            setResult({ type: LoadingType });
        }

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                setResult({
                    type: DoneType,
                    // eslint-disable-next-line max-len
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    data,
                });
            })
            .catch((error) => {
                setResult({
                    type: ErrorType,
                    // eslint-disable-next-line max-len
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    error,
                });
            });
    }, [url]);

    return result;
}

function App(): VNode {
    const result = useFetchJSON('/apiDocMap.json') as FetchJSONResult<
        PageNodeMapWithMetadata
    >;
    const stringifiedNodeMap = useMemo(
        () =>
            result.type === DoneType
                ? JSON.stringify(result.data.pageNodeMap)
                : null,
        [result],
    );

    switch (result.type) {
        case LoadingType: {
            return <p>Loading...</p>;
        }
        case ErrorType: {
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            return <p>Error: {`${result.error}`}</p>;
        }
        case DoneType: {
            const { commit } = result.data.metadata;
            return (
                <Fragment>
                    <h1>
                        AwakenJS{' '}
                        <a
                            href={`https://github.com/anthonyrota/awaken/tree/${commit}`}
                        >
                            {commit}
                        </a>
                        <br />
                    </h1>
                    <pre>{stringifiedNodeMap}</pre>
                </Fragment>
            );
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
render(<App />, document.getElementById('root')!);
