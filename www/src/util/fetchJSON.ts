export class FetchJSONError extends Error {
    public name = 'FetchJSONError';

    constructor(
        message: string,
        url: string,
        public status: number,
        public statusText: string,
    ) {
        super(`Fetch failed ${url} ${status}: ${message}`);
    }
}

export class JSONErrorResponseError extends FetchJSONError {
    public name = 'JSONErrorResponseError';

    constructor(
        public data: unknown,
        url: string,
        status: number,
        statusText: string,
    ) {
        super(JSON.stringify(data), url, status, statusText);
    }
}

export class TextErrorResponseError extends FetchJSONError {
    public name = 'TextErrorResponseError';

    constructor(
        public text: string,
        url: string,
        status: number,
        statusText: string,
    ) {
        super(text, url, status, statusText);
    }
}

export class NonJSONResponseError extends FetchJSONError {
    public name = 'NonJSONResponseError';

    constructor(
        public text: string,
        url: string,
        status: number,
        statusText: string,
    ) {
        super(
            `Response Content-Type is not JSON\n${text}`,
            url,
            status,
            statusText,
        );
    }
}

export function fetchJSON(url: string): Promise<unknown> {
    return fetch(url).then((response) => {
        const contentType = response.headers.get('content-type');
        const isJSON = contentType && contentType.includes('application/json');

        if (isJSON) {
            return response.json().then((data: unknown) => {
                if (response.ok) {
                    return data;
                } else {
                    return Promise.reject(
                        new JSONErrorResponseError(
                            data,
                            url,
                            response.status,
                            response.statusText,
                        ),
                    );
                }
            });
        } else {
            return response.text().then((text) => {
                if (response.ok) {
                    return Promise.reject(
                        new NonJSONResponseError(
                            text,
                            url,
                            response.status,
                            response.statusText,
                        ),
                    );
                } else {
                    return Promise.reject(
                        new TextErrorResponseError(
                            text,
                            url,
                            response.status,
                            response.statusText,
                        ),
                    );
                }
            });
        }
    });
}
