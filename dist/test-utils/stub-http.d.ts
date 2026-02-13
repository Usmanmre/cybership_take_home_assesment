/**
 * Stub HTTP client for integration tests. Records requests and returns
 * configurable responses so we can test request building, response parsing,
 * and error handling without live API calls.
 */
import type { HttpClient } from "../http-client.js";
export interface StubResponse<T = unknown> {
    status: number;
    body: T;
    headers?: Record<string, string>;
}
export type StubBehavior = "resolve" | "reject";
export interface StubHttpClient extends HttpClient {
    /** Set the next response for a request (by method + url prefix or all). */
    stubNext(res: StubResponse): void;
    /** Stub next request to reject with this error. */
    stubNextReject(err: unknown): void;
    /** Get all requests made (method, url, body). */
    getRequests(): Array<{
        method: string;
        url: string;
        body?: string;
    }>;
    /** Clear stubbed response and request log. */
    reset(): void;
}
export declare function createStubHttpClient(): StubHttpClient;
//# sourceMappingURL=stub-http.d.ts.map