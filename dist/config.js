/**
 * Configuration from environment. No hardcoded secrets.
 */
function env(key) {
    return process.env[key];
}
function envNumber(key, defaultValue) {
    const v = process.env[key];
    if (v === undefined || v === "")
        return defaultValue;
    const n = Number(v);
    if (Number.isNaN(n))
        return defaultValue;
    return n;
}
export function getUpsConfig() {
    const clientId = env("UPS_CLIENT_ID");
    const clientSecret = env("UPS_CLIENT_SECRET");
    const apiBaseUrl = env("UPS_API_BASE_URL") ?? "https://onlinetools.ups.com";
    const oauthTokenUrl = env("UPS_OAUTH_TOKEN_URL") ?? "https://onlinetools.ups.com/security/v1/oauth/token";
    return {
        clientId: clientId ?? "",
        clientSecret: clientSecret ?? "",
        apiBaseUrl,
        oauthTokenUrl,
        requestTimeoutMs: envNumber("HTTP_TIMEOUT_MS", 15_000),
        oauthTimeoutMs: envNumber("OAUTH_TIMEOUT_MS", 10_000),
        oauthRefreshBufferSeconds: envNumber("OAUTH_REFRESH_BUFFER_SECONDS", 60),
    };
}
/** Validate that UPS credentials are present (for runtime use). */
export function validateUpsConfig(config) {
    if (!config.clientId?.trim() || !config.clientSecret?.trim()) {
        throw new Error("UPS_CLIENT_ID and UPS_CLIENT_SECRET must be set for UPS carrier. " +
            "See env.example for required variables.");
    }
}
//# sourceMappingURL=config.js.map