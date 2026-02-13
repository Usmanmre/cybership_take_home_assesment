/**
 * Carrier Integration Service — public API.
 * Build the service with your HTTP client and carriers; use getRates() for rate shopping.
 */
export { CarrierIntegrationService } from "./service.js";
export { UpsCarrier } from "./carriers/ups/ups-carrier.js";
export { getUpsConfig, validateUpsConfig } from "./config.js";
export { createFetchHttpClient } from "./http-client.js";
export { CarrierIntegrationError, isCarrierIntegrationError, } from "./errors.js";
export { AddressSchema, PackageSchema, RateRequestSchema, RateQuoteSchema, RateResponseSchema, } from "./domain.js";
//# sourceMappingURL=index.js.map