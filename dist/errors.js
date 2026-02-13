/**
 * Structured errors for the carrier integration service.
 * Callers receive these instead of raw HTTP or carrier-specific errors.
 */
export class CarrierIntegrationError extends Error {
    code;
    statusCode;
    carrierCode;
    context;
    cause;
    constructor(details) {
        super(details.message);
        this.name = "CarrierIntegrationError";
        this.code = details.code;
        this.statusCode = details.statusCode;
        this.carrierCode = details.carrierCode;
        this.context = details.context;
        this.cause = details.cause;
        Object.setPrototypeOf(this, CarrierIntegrationError.prototype);
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
            carrierCode: this.carrierCode,
            context: this.context,
            cause: this.cause,
        };
    }
}
export function isCarrierIntegrationError(err) {
    return err instanceof CarrierIntegrationError;
}
//# sourceMappingURL=errors.js.map