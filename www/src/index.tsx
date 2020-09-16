import { h, Fragment, render, VNode } from 'preact';
import { useState, useEffect, useMemo } from 'preact/hooks';
import {
    getCurrentState,
    onGlobalStateChange,
    ResponseDoneType,
    ResponseHttpStatusErrorType,
    ResponseJSONParsingErrorType,
    ResponseLoadingType,
    ResponseState,
} from './loadApiDocMap/types';

function useApiDocMapResponseState(): ResponseState {
    const { 0: responseState, 1: setResponseState } = useState<ResponseState>(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        getCurrentState()!,
    );

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const currentResponseState: ResponseState = getCurrentState()!;
        if (currentResponseState !== responseState) {
            setResponseState(currentResponseState);
        }
        return onGlobalStateChange(setResponseState);
    });

    return responseState;
}

function App(): VNode {
    const responseState = useApiDocMapResponseState();
    const stringifiedNodeMap = useMemo(
        () =>
            responseState.type === ResponseDoneType
                ? JSON.stringify(responseState.data.pageNodeMap)
                : null,
        [responseState],
    );

    switch (responseState.type) {
        case ResponseLoadingType: {
            return <p>Loading...</p>;
        }
        case ResponseHttpStatusErrorType: {
            console.log(
                'error fetching api doc map',
                responseState.status,
                responseState.statusText,
            );
            return <p>Internal Error.</p>;
        }
        case ResponseJSONParsingErrorType: {
            console.log(
                'error parsing fetched api doc map',
                responseState.error,
            );
            return <p>Internal Error.</p>;
        }
        case ResponseDoneType: {
            const { github } = responseState.data.metadata;
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
