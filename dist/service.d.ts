/**
 * Carrier Integration Service: single entry point for rate shopping and
 * future operations. Validates input, delegates to the appropriate carrier,
 * and returns normalized results. Callers never see carrier-specific shapes.
 */
import { type RateResponse } from "./domain.js";
import type { CarrierIntegration } from "./carriers/types.js";
export interface CarrierServiceOptions {
    carriers: CarrierIntegration[];
}
/**
 * Main service. Use getRates() for rate shopping; extend with getLabel(), track(), etc.
 */
export declare class CarrierIntegrationService {
    private readonly carriers;
    constructor(options: CarrierServiceOptions);
    /**
     * Get shipping rates from the specified carrier. Input is validated before
     * any external call. Returns normalized quotes; caller does not see UPS (or
     * any carrier) request/response format.
     */
    getRates(carrierId: string, request: unknown): Promise<RateResponse>;
    /** List carrier IDs that support rate shopping. */
    getCarriersWithRates(): string[];
}
//# sourceMappingURL=service.d.ts.map