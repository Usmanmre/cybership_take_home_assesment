/**
 * HTTP client interface. Allows stubbing in tests with realistic payloads.
 */
export interface HttpResponse<T = unknown> {
    status: number;
    headers: Record<string, string>;
    body: T;
}
export interface HttpClient {
    request<T = unknown>(options: {
        method: string;
        url: string;
        headers?: Record<string, string>;
        body?: string;
        timeoutMs?: number;
    }): Promise<HttpResponse<T>>;
}
/** Default implementation using global fetch (Node 18+). */
export declare function createFetchHttpClient(): HttpClient;
//# sourceMappingURL=http-client.d.ts.map