/**
 * HTTP client interface. Allows stubbing in tests with realistic payloads.
 */
/** Default implementation using global fetch (Node 18+). */
export function createFetchHttpClient() {
    return {
        async request(options) {
            const controller = new AbortController();
            const timeoutId = options.timeoutMs != null
                ? setTimeout(() => controller.abort(), options.timeoutMs)
                : undefined;
            try {
                const res = await fetch(options.url, {
                    method: options.method,
                    headers: options.headers ?? {},
                    body: options.body,
                    signal: controller.signal,
                });
                if (timeoutId != null)
                    clearTimeout(timeoutId);
                const headers = {};
                res.headers.forEach((v, k) => {
                    headers[k] = v;
                });
                let body;
                const contentType = res.headers.get("content-type") ?? "";
                if (contentType.includes("application/json")) {
                    const text = await res.text();
                    try {
                        body = JSON.parse(text);
                    }
                    catch {
                        throw new Error(`Malformed JSON in response: ${text.slice(0, 200)}`);
                    }
                }
                else {
                    body = (await res.text());
                }
                return { status: res.status, headers, body };
            }
            catch (err) {
                if (timeoutId != null)
                    clearTimeout(timeoutId);
                throw err;
            }
        },
    };
}
//# sourceMappingURL=http-client.js.map