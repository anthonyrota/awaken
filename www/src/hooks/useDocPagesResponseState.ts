import { useState, useEffect } from 'preact/hooks';
import {
    ResponseState,
    getOnResponseStateChangeFunction,
    getCurrentResponseState,
} from '../data/docPages';

export function useDocPagesResponseState(): ResponseState {
    const onResponseStateChange = getOnResponseStateChangeFunction();
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
