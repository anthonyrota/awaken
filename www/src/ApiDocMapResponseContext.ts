import { createContext } from 'preact';
import { useState, useContext, useEffect } from 'preact/hooks';
import { ResponseState, NonLoadingResponseState } from './loadApiDocMap';

export interface ApiDocMapResponseContextValue {
    getCurrentResponseState: () => ResponseState;
    onResponseStateChange: (
        setResponseState: (responseState: NonLoadingResponseState) => void,
    ) => () => void;
}

const apiDocMapResponseContext = createContext<ApiDocMapResponseContextValue>(
    (null as unknown) as ApiDocMapResponseContextValue,
);

export const ApiDocMapResponseContextProvider =
    apiDocMapResponseContext.Provider;

export function useApiDocMapResponseState(): ResponseState {
    const { getCurrentResponseState, onResponseStateChange } = useContext(
        apiDocMapResponseContext,
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
