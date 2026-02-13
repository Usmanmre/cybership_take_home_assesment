/**
 * UPS OAuth 2.0 client-credentials flow: token acquisition, caching, and refresh.
 * Callers use getValidToken() and never deal with raw tokens or expiry.
 */
import type { HttpClient } from "../http-client.js";
import type { UpsConfig } from "../config.js";
export interface TokenResult {
    accessToken: string;
    expiresInSeconds: number;
}
/**
 * UPS OAuth client. Obtains and caches access tokens; refreshes transparently.
 */
export declare class UpsOAuthClient {
    private readonly config;
    private readonly http;
    private readonly refreshBufferMs;
    private cached;
    constructor(config: UpsConfig, http: HttpClient);
    /**
     * Returns a valid access token, acquiring or refreshing as needed.
     * Callers should use this before any UPS API call.
     */
    getValidToken(): Promise<string>;
    /** Force clear cache (e.g. after 401 to retry with fresh token). */
    clearCache(): void;
    private requestToken;
}
//# sourceMappingURL=ups-oauth.d.ts.map