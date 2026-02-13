/**
 * Configuration from environment. No hardcoded secrets.
 */
export interface UpsConfig {
    clientId: string;
    clientSecret: string;
    apiBaseUrl: string;
    oauthTokenUrl: string;
    requestTimeoutMs: number;
    oauthTimeoutMs: number;
    /** Refresh token this many seconds before expiry */
    oauthRefreshBufferSeconds: number;
}
export declare function getUpsConfig(): UpsConfig;
/** Validate that UPS credentials are present (for runtime use). */
export declare function validateUpsConfig(config: UpsConfig): void;
//# sourceMappingURL=config.d.ts.map