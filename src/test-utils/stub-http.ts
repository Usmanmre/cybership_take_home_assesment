/**
 * Stub HTTP client for integration tests. Records requests and returns
 * configurable responses so we can test request building, response parsing,
 * and error handling without live API calls.
 */

import type { HttpClient, HttpResponse } from "../http-client.js";

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
  getRequests(): Array<{ method: string; url: string; body?: string }>;
  /** Clear stubbed response and request log. */
  reset(): void;
}

export function createStubHttpClient(): StubHttpClient {
  const requests: Array<{ method: string; url: string; body?: string }> = [];
  const responseQueue: StubResponse[] = [];
  let nextReject: unknown = null;

  const client: StubHttpClient = {
    async request<T>(options: {
      method: string;
      url: string;
      headers?: Record<string, string>;
      body?: string;
      timeoutMs?: number;
    }): Promise<HttpResponse<T>> {
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
          body: nextResponse.body as T,
        };
      }

      throw new Error(
        "StubHttpClient: no stubbed response set. Use stubNext() or stubNextReject() before the request."
      );
    },

    stubNext(res: StubResponse): void {
      nextReject = null;
      responseQueue.push(res);
    },

    stubNextReject(err: unknown): void {
      responseQueue.length = 0;
      nextReject = err;
    },

    getRequests(): Array<{ method: string; url: string; body?: string }> {
      return [...requests];
    },

    reset(): void {
      requests.length = 0;
      responseQueue.length = 0;
      nextReject = null;
    },
  };

  return client;
}
