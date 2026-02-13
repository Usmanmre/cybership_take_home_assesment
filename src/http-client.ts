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
export function createFetchHttpClient(): HttpClient {
  return {
    async request<T>(options: {
      method: string;
      url: string;
      headers?: Record<string, string>;
      body?: string;
      timeoutMs?: number;
    }): Promise<HttpResponse<T>> {
      const controller = new AbortController();
      const timeoutId =
        options.timeoutMs != null
          ? setTimeout(() => controller.abort(), options.timeoutMs)
          : undefined;

      try {
        const res = await fetch(options.url, {
          method: options.method,
          headers: options.headers ?? {},
          body: options.body,
          signal: controller.signal,
        });

        if (timeoutId != null) clearTimeout(timeoutId);

        const headers: Record<string, string> = {};
        res.headers.forEach((v, k) => {
          headers[k] = v;
        });

        let body: T;
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const text = await res.text();
          try {
            body = JSON.parse(text) as T;
          } catch {
            throw new Error(`Malformed JSON in response: ${text.slice(0, 200)}`);
          }
        } else {
          body = (await res.text()) as unknown as T;
        }

        return { status: res.status, headers, body };
      } catch (err) {
        if (timeoutId != null) clearTimeout(timeoutId);
        throw err;
      }
    },
  };
}
