import 'promise-polyfill/src/polyfill';
import 'unfetch/polyfill';
import { h, Fragment, render, VNode } from 'preact';
import { useMemo } from 'preact/hooks';
import { PageNodeMapWithMetadata } from '../script/docs/apigen/types';
import {
    DoneType,
    ErrorType,
    FetchJSONResult,
    LoadingType,
    useFetchJSON,
} from './hooks/useFetchJSON';

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
            const { github } = result.data.metadata;
            let headingContents: VNode | string = 'AwakenJS';
            if (github) {
                const githubLink = `https://github.com/${github.org}/${github.repo}/tree/${github.sha}`;
                headingContents = <a href={githubLink}>{githubLink}</a>;
            }
            return (
                <Fragment>
                    <h1>{headingContents}</h1>
                    <br />
                    <pre>{stringifiedNodeMap}</pre>
                </Fragment>
            );
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
render(<App />, document.getElementById('root')!);
