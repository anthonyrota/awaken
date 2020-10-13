/// <reference types="service_worker_api" />

// Ensure TypeScript treats this as a module.
export {};

declare const self: ServiceWorkerGlobalScope;

const dynamicPaths = ['::dynamicPaths::'];
const secondaryStaticPaths = ['::secondaryStaticPaths::'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('::cacheName::').then((cache) => {
            const addStaticPathsP = cache.addAll(['::primaryStaticPaths::']);
            // Don't delay installation. If the request fails it doesn't matter
            // because this resource is not necessary for the offline
            // experience.
            void cache.addAll(secondaryStaticPaths);
            void cache.addAll(dynamicPaths);
            // However these static paths are necessary for the offline
            // experience, so delay installation until they complete and scrap
            // the service worker if these resources can't be retrieved.
            return addStaticPathsP;
        }),
    );
});

self.addEventListener('activate', (event) => {
    // This event means that the old service worker was ditched and this one can
    // safely replace it.
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            // Delete all previous caches, only retaining the current one.
            return Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== '::cacheName::')
                    .map((cacheName) => caches.delete(cacheName)),
            );
        }),
    );
});

declare global {
    interface FetchEvent extends ExtendableEvent {}
}

function makeSpaResponse(): Response {
    return new Response('::spaHtml::', {
        headers: {
            'Content-Type': 'text/html',
        },
    });
}

function isSuccessfulResponse(response: Response): boolean {
    return (
        response &&
        response.status === 200 &&
        // Same origin.
        response.type === 'basic'
    );
}

function cacheResponse(
    request: RequestInfo,
    response: Response,
): Promise<void> {
    // IMPORTANT: Clone the response as it is a stream.
    const responseClone = response.clone();

    // Update the cache.
    return caches.open('::cacheName::').then((cache) => {
        return cache.put(
            // Normalize the request url.
            request,
            responseClone,
        );
    });
}

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    const isSecondaryStatic =
        secondaryStaticPaths.indexOf(requestUrl.pathname) !== -1;
    const isDynamic = dynamicPaths.indexOf(requestUrl.pathname) !== -1;

    if (
        // These are served cache first.
        isSecondaryStatic ||
        (event.request.mode !== 'navigate' &&
            // Dynamic files are served network first.
            !isDynamic)
    ) {
        // Cache first.
        event.respondWith(
            caches
                .match(
                    event.request,
                    requestUrl.origin === location.origin
                        ? {
                              // Same origin. None of the resources served in
                              // this app care about the query parameters, so
                              // remove them, normalizing the request.
                              ignoreSearch: true,
                          }
                        : // Cross origin. Preserve the request as is.
                          undefined,
                )
                .then((response) => {
                    if (response) {
                        // Cache hit.
                        return response;
                    }
                    // Cache miss.
                    return fetch(event.request).then((response) => {
                        if (
                            isSecondaryStatic &&
                            // Only cache successful responses.
                            isSuccessfulResponse(response)
                        ) {
                            event.waitUntil(
                                cacheResponse(requestUrl.pathname, response),
                            );
                        }
                        return response;
                    });
                }),
        );
        return;
    }

    // Network first.
    event.respondWith(
        fetch(event.request).then(
            (response) => {
                if (
                    // Only re-cache dynamic files.
                    isDynamic &&
                    // Only cache successful responses.
                    isSuccessfulResponse(response)
                ) {
                    event.waitUntil(
                        cacheResponse(requestUrl.pathname, response),
                    );
                }
                return response;
            },
            // Network error (eg. offline).
            () => {
                if (isDynamic) {
                    // In this case try to serve the cached file instead of the
                    // SPA.
                    return caches.match(requestUrl.pathname).catch(() => {
                        // The dynamic file is not cached: serve the SPA to
                        // avoid the browser's offline page.
                        return makeSpaResponse();
                    });
                }
                // Serve the SPA. All of the static/necessary assets to load
                // this page have been cached upon installation.
                return makeSpaResponse();
            },
        ),
    );
});
