import { createContext } from 'preact';
import { useState, useContext, useEffect } from 'preact/hooks';
import { ResponseState, NonLoadingResponseState } from './request';

export interface DocPagesResponseContextValue {
    getCurrentResponseState: () => ResponseState;
    onResponseStateChange: (
        setResponseState: (responseState: NonLoadingResponseState) => void,
    ) => () => void;
}

const docPagesResponseContext = createContext<DocPagesResponseContextValue>(
    (null as unknown) as DocPagesResponseContextValue,
);

export const DocPagesResponseContextProvider = docPagesResponseContext.Provider;

export function useDocPagesResponseState(): ResponseState {
    const { getCurrentResponseState, onResponseStateChange } = useContext(
        docPagesResponseContext,
    );
    const { 0: responseState, 1: setResponseState } = useState(
        getCurrentResponseState(),
    );

    useEffect(() => {
        const currentResponseState = getCurrentResponseState();
        if (currentResponseState !== responseState) {
            setResponseState(currentResponseState);
        }
        return onResponseStateChange(setResponseState);
    });

    return responseState;
}
