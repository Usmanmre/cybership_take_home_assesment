/**
 * Carrier Integration Service — public API.
 * Build the service with your HTTP client and carriers; use getRates() for rate shopping.
 */
export { CarrierIntegrationService } from "./service.js";
export type { CarrierServiceOptions } from "./service.js";
export { UpsCarrier } from "./carriers/ups/ups-carrier.js";
export type { UpsCarrierOptions } from "./carriers/ups/ups-carrier.js";
export { getUpsConfig, validateUpsConfig } from "./config.js";
export type { UpsConfig } from "./config.js";
export { createFetchHttpClient } from "./http-client.js";
export type { HttpClient } from "./http-client.js";
export { CarrierIntegrationError, isCarrierIntegrationError, } from "./errors.js";
export type { ErrorCode, CarrierIntegrationErrorDetails } from "./errors.js";
export type { Address, Package, RateRequest, RateResponse, RateQuote, } from "./domain.js";
export { AddressSchema, PackageSchema, RateRequestSchema, RateQuoteSchema, RateResponseSchema, } from "./domain.js";
export type { CarrierIntegration, CarrierOperation } from "./carriers/types.js";
//# sourceMappingURL=index.d.ts.map