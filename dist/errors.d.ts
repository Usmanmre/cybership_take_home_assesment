/**
 * Structured errors for the carrier integration service.
 * Callers receive these instead of raw HTTP or carrier-specific errors.
 */
export type ErrorCode = "VALIDATION_ERROR" | "AUTH_FAILED" | "AUTH_TOKEN_EXPIRED" | "RATE_LIMITED" | "NETWORK_ERROR" | "TIMEOUT" | "CARRIER_ERROR" | "MALFORMED_RESPONSE" | "UNKNOWN";
export interface CarrierIntegrationErrorDetails {
    code: ErrorCode;
    message: string;
    /** HTTP status when applicable */
    statusCode?: number;
    /** Raw carrier error code if present */
    carrierCode?: string;
    /** Request/shipment context for logging */
    context?: Record<string, unknown>;
    /** Underlying cause (e.g. for wrapping) */
    cause?: unknown;
}
export declare class CarrierIntegrationError extends Error {
    readonly code: ErrorCode;
    readonly statusCode?: number;
    readonly carrierCode?: string;
    readonly context?: Record<string, unknown>;
    readonly cause?: unknown;
    constructor(details: CarrierIntegrationErrorDetails);
    toJSON(): CarrierIntegrationErrorDetails;
}
export declare function isCarrierIntegrationError(err: unknown): err is CarrierIntegrationError;
//# sourceMappingURL=errors.d.ts.map