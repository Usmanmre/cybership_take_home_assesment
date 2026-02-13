/**
 * Domain models and validation for the carrier integration service.
 * These types are carrier-agnostic; carriers map their APIs to/from these.
 */
import { z } from "zod";
// --- Address ---
export const AddressSchema = z.object({
    line1: z.string().min(1, "Address line1 is required"),
    line2: z.string().optional(),
    line3: z.string().optional(),
    city: z.string().min(1, "City is required"),
    stateProvinceCode: z.string().max(10).optional(),
    postalCode: z.string().min(1, "Postal code is required"),
    countryCode: z.string().length(2, "Country code must be 2 characters (ISO 3166-1 alpha-2)"),
});
// --- Package ---
export const PackageSchema = z.object({
    weight: z.number().positive("Weight must be positive"),
    weightUnit: z.enum(["LBS", "KGS"]).default("LBS"),
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    dimensionUnit: z.enum(["IN", "CM"]).default("IN"),
});
// --- Rate request (carrier-agnostic) ---
export const RateRequestSchema = z.object({
    origin: AddressSchema,
    destination: AddressSchema,
    packages: z.array(PackageSchema).min(1, "At least one package is required"),
    /** Optional: restrict to a specific service level (e.g. "03" for Ground, "07" for Express) */
    serviceCode: z.string().max(10).optional(),
});
// --- Normalized rate quote (what we return to callers) ---
export const RateQuoteSchema = z.object({
    carrier: z.string(),
    serviceCode: z.string(),
    serviceName: z.string(),
    totalCharge: z.number(),
    currencyCode: z.string(),
    /** Estimated transit days if provided by carrier */
    transitDays: z.number().optional(),
    /** Carrier-specific raw identifier for this service (e.g. UPS service code) */
    carrierServiceId: z.string().optional(),
});
export const RateResponseSchema = z.object({
    quotes: z.array(RateQuoteSchema),
    /** Request id or correlation id for support */
    requestId: z.string().optional(),
});
//# sourceMappingURL=domain.js.map