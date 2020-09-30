import { h, Fragment, VNode } from 'preact';
import { useMemo } from 'preact/hooks';
import { Header } from '../components/Header';
import {
    ResponseDoneType,
    ResponseHttpStatusErrorType,
    ResponseJSONParsingErrorType,
    ResponseLoadingType,
} from '../docPages/request';
import { useDocPagesResponseState } from '../hooks/useDocPagesResponseState';

interface DocPageProps {
    pageId: string;
}

export function DocPage({ pageId }: DocPageProps): VNode {
    const responseState = useDocPagesResponseState();
    const stringifiedNodeMap = useMemo(
        () =>
            responseState.type === ResponseDoneType
                ? JSON.stringify(
                      responseState.data.pages.filter(
                          (page) => page.pageId === pageId,
                      )[0],
                      null,
                      4,
                  )
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
                    <Header></Header>
                    <h1>{headingContents}</h1>
                    <br />
                    <pre>{stringifiedNodeMap}</pre>
                </Fragment>
            );
        }
    }
}
