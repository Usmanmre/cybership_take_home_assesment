/**
 * UPS OAuth 2.0 client-credentials flow: token acquisition, caching, and refresh.
 * Callers use getValidToken() and never deal with raw tokens or expiry.
 */

import { z } from "zod";
import type { HttpClient } from "../http-client.js";
import type { UpsConfig } from "../config.js";
import { CarrierIntegrationError } from "../errors.js";

/** Runtime validation for UPS OAuth token response. */
const UpsOAuthTokenResponseSchema = z.object({
  access_token: z.string().min(1, "access_token is required"),
  expires_in: z.number().int().positive().optional().default(3600),
  token_type: z.string().optional(),
});

export interface TokenResult {
  accessToken: string;
  expiresInSeconds: number;
}

/** Cached token with expiry. We refresh when within refreshBufferSeconds of expiry. */
interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

/**
 * UPS OAuth client. Obtains and caches access tokens; refreshes transparently.
 */
export class UpsOAuthClient {
  private readonly config: UpsConfig;
  private readonly http: HttpClient;
  private readonly refreshBufferMs: number;
  private cached: CachedToken | null = null;

  constructor(config: UpsConfig, http: HttpClient) {
    this.config = config;
    this.http = http;
    this.refreshBufferMs = config.oauthRefreshBufferSeconds * 1000;
  }

  /**
   * Returns a valid access token, acquiring or refreshing as needed.
   * Callers should use this before any UPS API call.
   */
  async getValidToken(): Promise<string> {
    const now = Date.now();
    if (this.cached && this.cached.expiresAtMs - this.refreshBufferMs > now) {
      return this.cached.accessToken;
    }
    const result = await this.requestToken();
    this.cached = {
      accessToken: result.accessToken,
      expiresAtMs: now + result.expiresInSeconds * 1000,
    };
    return result.accessToken;
  }

  /** Force clear cache (e.g. after 401 to retry with fresh token). */
  clearCache(): void {
    this.cached = null;
  }

  private async requestToken(): Promise<TokenResult> {
    const url = this.config.oauthTokenUrl;
    const body = new URLSearchParams({ grant_type: "client_credentials" }).toString();
    const auth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
      "utf-8"
    ).toString("base64");

    try {
      const res = await this.http.request<unknown>({
        method: "POST",
        url,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
          "x-merchant-id": this.config.clientId,
        },
        body,
        timeoutMs: this.config.oauthTimeoutMs,
      });

      if (res.status === 401) {
        throw new CarrierIntegrationError({
          code: "AUTH_FAILED",
          message: "UPS OAuth: invalid client credentials (401)",
          statusCode: 401,
          context: { url },
        });
      }

      if (res.status === 429) {
        throw new CarrierIntegrationError({
          code: "RATE_LIMITED",
          message: "UPS OAuth: rate limited (429)",
          statusCode: 429,
          context: { url },
        });
      }

      if (res.status < 200 || res.status >= 300) {
        throw new CarrierIntegrationError({
          code: "AUTH_FAILED",
          message: `UPS OAuth failed: HTTP ${res.status}`,
          statusCode: res.status,
          context: { url, body: res.body },
        });
      }

      const parsed = UpsOAuthTokenResponseSchema.safeParse(res.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        throw new CarrierIntegrationError({
          code: "MALFORMED_RESPONSE",
          message: `UPS OAuth: invalid response — ${message}`,
          statusCode: res.status,
          context: { body: res.body, issues: parsed.error.flatten() },
        });
      }

      const { access_token, expires_in } = parsed.data;
      return {
        accessToken: access_token,
        expiresInSeconds: expires_in,
      };
    } catch (err) {
      if (err instanceof CarrierIntegrationError) throw err;
      const message =
        err instanceof Error ? err.message : "Unknown error during OAuth";
      const isTimeout =
        err instanceof Error &&
        (err.name === "AbortError" || message.includes("abort"));
      throw new CarrierIntegrationError({
        code: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
        message: `UPS OAuth: ${message}`,
        cause: err,
        context: { url },
      });
    }
  }
}
