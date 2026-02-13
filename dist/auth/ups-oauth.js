/**
 * UPS OAuth 2.0 client-credentials flow: token acquisition, caching, and refresh.
 * Callers use getValidToken() and never deal with raw tokens or expiry.
 */
import { CarrierIntegrationError } from "../errors.js";
/**
 * UPS OAuth client. Obtains and caches access tokens; refreshes transparently.
 */
export class UpsOAuthClient {
    config;
    http;
    refreshBufferMs;
    cached = null;
    constructor(config, http) {
        this.config = config;
        this.http = http;
        this.refreshBufferMs = config.oauthRefreshBufferSeconds * 1000;
    }
    /**
     * Returns a valid access token, acquiring or refreshing as needed.
     * Callers should use this before any UPS API call.
     */
    async getValidToken() {
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
    clearCache() {
        this.cached = null;
    }
    async requestToken() {
        const url = this.config.oauthTokenUrl;
        const body = new URLSearchParams({ grant_type: "client_credentials" }).toString();
        const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`, "utf-8").toString("base64");
        try {
            const res = await this.http.request({
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
            const data = res.body;
            if (!data ||
                typeof data !== "object" ||
                typeof data.access_token !== "string") {
                throw new CarrierIntegrationError({
                    code: "MALFORMED_RESPONSE",
                    message: "UPS OAuth: response missing access_token",
                    statusCode: res.status,
                    context: { body: data },
                });
            }
            const token = data.access_token;
            const rawExpiresIn = data.expires_in;
            const expiresInSeconds = typeof rawExpiresIn === "number" ? rawExpiresIn : 3600;
            return { accessToken: token, expiresInSeconds };
        }
        catch (err) {
            if (err instanceof CarrierIntegrationError)
                throw err;
            const message = err instanceof Error ? err.message : "Unknown error during OAuth";
            const isTimeout = err instanceof Error &&
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
//# sourceMappingURL=ups-oauth.js.map