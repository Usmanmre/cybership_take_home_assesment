/**
 * Carrier Integration Service: single entry point for rate shopping and
 * future operations. Validates input, delegates to the appropriate carrier,
 * and returns normalized results. Callers never see carrier-specific shapes.
 */
import { RateRequestSchema } from "./domain.js";
import { CarrierIntegrationError, isCarrierIntegrationError } from "./errors.js";
/**
 * Main service. Use getRates() for rate shopping; extend with getLabel(), track(), etc.
 */
export class CarrierIntegrationService {
    carriers;
    constructor(options) {
        this.carriers = new Map(options.carriers.map((c) => [c.carrierId, c]));
    }
    /**
     * Get shipping rates from the specified carrier. Input is validated before
     * any external call. Returns normalized quotes; caller does not see UPS (or
     * any carrier) request/response format.
     */
    async getRates(carrierId, request) {
        const carrier = this.carriers.get(carrierId);
        if (!carrier) {
            throw new CarrierIntegrationError({
                code: "VALIDATION_ERROR",
                message: `Unknown carrier: ${carrierId}`,
                context: { availableCarriers: [...this.carriers.keys()] },
            });
        }
        if (!carrier.supportedOperations.includes("rate")) {
            throw new CarrierIntegrationError({
                code: "VALIDATION_ERROR",
                message: `Carrier ${carrierId} does not support rate shopping`,
            });
        }
        const parseResult = RateRequestSchema.safeParse(request);
        if (!parseResult.success) {
            const message = formatZodError(parseResult.error);
            throw new CarrierIntegrationError({
                code: "VALIDATION_ERROR",
                message: `Invalid rate request: ${message}`,
                context: { errors: parseResult.error.flatten() },
            });
        }
        const validatedRequest = parseResult.data;
        try {
            const result = await carrier.execute({
                operation: "rate",
                input: validatedRequest,
            });
            if (result.operation === "rate") {
                return result.result;
            }
            throw new CarrierIntegrationError({
                code: "UNKNOWN",
                message: "Unexpected result type from carrier",
            });
        }
        catch (err) {
            if (isCarrierIntegrationError(err))
                throw err;
            throw new CarrierIntegrationError({
                code: "UNKNOWN",
                message: err instanceof Error ? err.message : "Carrier request failed",
                cause: err,
            });
        }
    }
    /** List carrier IDs that support rate shopping. */
    getCarriersWithRates() {
        return [...this.carriers.values()]
            .filter((c) => c.supportedOperations.includes("rate"))
            .map((c) => c.carrierId);
    }
}
function formatZodError(error) {
    const issues = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    return issues.join("; ");
}
//# sourceMappingURL=service.js.map