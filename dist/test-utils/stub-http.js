/**
 * Stub HTTP client for integration tests. Records requests and returns
 * configurable responses so we can test request building, response parsing,
 * and error handling without live API calls.
 */
export function createStubHttpClient() {
    const requests = [];
    const responseQueue = [];
    let nextReject = null;
    const client = {
        async request(options) {
            requests.push({
                method: options.method,
                url: options.url,
                body: options.body,
            });
            if (nextReject != null) {
                const err = nextReject;
                nextReject = null;
                throw err;
            }
            const nextResponse = responseQueue.shift();
            if (nextResponse != null) {
                return {
                    status: nextResponse.status,
                    headers: nextResponse.headers ?? {},
                    body: nextResponse.body,
                };
            }
            throw new Error("StubHttpClient: no stubbed response set. Use stubNext() or stubNextReject() before the request.");
        },
        stubNext(res) {
            nextReject = null;
            responseQueue.push(res);
        },
        stubNextReject(err) {
            responseQueue.length = 0;
            nextReject = err;
        },
        getRequests() {
            return [...requests];
        },
        reset() {
            requests.length = 0;
            responseQueue.length = 0;
            nextReject = null;
        },
    };
    return client;
}
//# sourceMappingURL=stub-http.js.map