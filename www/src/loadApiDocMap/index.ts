import {
    ResponseLoadingType,
    ResponseHttpStatusErrorType,
    ResponseJSONParsingErrorType,
    ResponseDoneType,
    changeGlobalState,
} from './types';

changeGlobalState({
    type: ResponseLoadingType,
});

const request = new XMLHttpRequest();

// request state change event
request.onreadystatechange = function () {
    if (request.readyState !== 4) return;

    if (request.status >= 200 && request.status < 300) {
        try {
            changeGlobalState({
                type: ResponseDoneType,
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                data: JSON.parse(request.responseText),
            });
        } catch (error: unknown) {
            changeGlobalState({
                type: ResponseJSONParsingErrorType,
                error,
            });
        }
    } else {
        changeGlobalState({
            type: ResponseHttpStatusErrorType,
            status: request.status,
            statusText: request.statusText,
        });
    }
};

request.open('GET', '/apiDocMap.json');
request.send();
