/**
 * Domain models and validation for the carrier integration service.
 * These types are carrier-agnostic; carriers map their APIs to/from these.
 */
import { z } from "zod";
export declare const AddressSchema: z.ZodObject<{
    line1: z.ZodString;
    line2: z.ZodOptional<z.ZodString>;
    line3: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    stateProvinceCode: z.ZodOptional<z.ZodString>;
    postalCode: z.ZodString;
    countryCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    line1: string;
    city: string;
    postalCode: string;
    countryCode: string;
    line2?: string | undefined;
    line3?: string | undefined;
    stateProvinceCode?: string | undefined;
}, {
    line1: string;
    city: string;
    postalCode: string;
    countryCode: string;
    line2?: string | undefined;
    line3?: string | undefined;
    stateProvinceCode?: string | undefined;
}>;
export type Address = z.infer<typeof AddressSchema>;
export declare const PackageSchema: z.ZodObject<{
    weight: z.ZodNumber;
    weightUnit: z.ZodDefault<z.ZodEnum<["LBS", "KGS"]>>;
    length: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    dimensionUnit: z.ZodDefault<z.ZodEnum<["IN", "CM"]>>;
}, "strip", z.ZodTypeAny, {
    weight: number;
    weightUnit: "LBS" | "KGS";
    dimensionUnit: "IN" | "CM";
    length?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
}, {
    weight: number;
    length?: number | undefined;
    weightUnit?: "LBS" | "KGS" | undefined;
    width?: number | undefined;
    height?: number | undefined;
    dimensionUnit?: "IN" | "CM" | undefined;
}>;
export type Package = z.infer<typeof PackageSchema>;
export declare const RateRequestSchema: z.ZodObject<{
    origin: z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        line3: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        stateProvinceCode: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        countryCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        line1: string;
        city: string;
        postalCode: string;
        countryCode: string;
        line2?: string | undefined;
        line3?: string | undefined;
        stateProvinceCode?: string | undefined;
    }, {
        line1: string;
        city: string;
        postalCode: string;
        countryCode: string;
        line2?: string | undefined;
        line3?: string | undefined;
        stateProvinceCode?: string | undefined;
    }>;
    destination: z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        line3: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        stateProvinceCode: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        countryCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        line1: string;
        city: string;
        postalCode: string;
        countryCode: string;
        line2?: string | undefined;
        line3?: string | undefined;
        stateProvinceCode?: string | undefined;
    }, {
        line1: string;
        city: string;
        postalCode: string;
        countryCode: string;
        line2?: string | undefined;
        line3?: string | undefined;
        stateProvinceCode?: string | undefined;
    }>;
    packages: z.ZodArray<z.ZodObject<{
        weight: z.ZodNumber;
        weightUnit: z.ZodDefault<z.ZodEnum<["LBS", "KGS"]>>;
        length: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        dimensionUnit: z.ZodDefault<z.ZodEnum<["IN", "CM"]>>;
    }, "strip", z.ZodTypeAny, {
        weight: number;
        weightUnit: "LBS" | "KGS";
        dimensionUnit: "IN" | "CM";
        length?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }, {
        weight: number;
        length?: number | undefined;
        weightUnit?: "LBS" | "KGS" | undefined;
        width?: number | undefined;
        height?: number | undefined;
        dimensionUnit?: "IN" | "CM" | undefined;
    }>, "many">;
    /** Optional: restrict to a specific service level (e.g. "03" for Ground, "07" for Express) */
    serviceCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    origin: {
        line1: string;
        city: string;
        postalCode: string;
        countryCode: string;
        line2?: string | undefined;
        line3?: string | undefined;
        stateProvinceCode?: string | undefined;
    };
    destination: {
        line1: string;
        city: string;
        postalCode: string;
        countryCode: string;
        line2?: string | undefined;
        line3?: string | undefined;
        stateProvinceCode?: string | undefined;
    };
    packages: {
        weight: number;
        weightUnit: "LBS" | "KGS";
        dimensionUnit: "IN" | "CM";
        length?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }[];
    serviceCode?: string | undefined;
}, {
    origin: {
        line1: string;
        city: string;
        postalCode: string;
        countryCode: string;
        line2?: string | undefined;
        line3?: string | undefined;
        stateProvinceCode?: string | undefined;
    };
    destination: {
        line1: string;
        city: string;
        postalCode: string;
        countryCode: string;
        line2?: string | undefined;
        line3?: string | undefined;
        stateProvinceCode?: string | undefined;
    };
    packages: {
        weight: number;
        length?: number | undefined;
        weightUnit?: "LBS" | "KGS" | undefined;
        width?: number | undefined;
        height?: number | undefined;
        dimensionUnit?: "IN" | "CM" | undefined;
    }[];
    serviceCode?: string | undefined;
}>;
export type RateRequest = z.infer<typeof RateRequestSchema>;
export declare const RateQuoteSchema: z.ZodObject<{
    carrier: z.ZodString;
    serviceCode: z.ZodString;
    serviceName: z.ZodString;
    totalCharge: z.ZodNumber;
    currencyCode: z.ZodString;
    /** Estimated transit days if provided by carrier */
    transitDays: z.ZodOptional<z.ZodNumber>;
    /** Carrier-specific raw identifier for this service (e.g. UPS service code) */
    carrierServiceId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    serviceCode: string;
    carrier: string;
    serviceName: string;
    totalCharge: number;
    currencyCode: string;
    transitDays?: number | undefined;
    carrierServiceId?: string | undefined;
}, {
    serviceCode: string;
    carrier: string;
    serviceName: string;
    totalCharge: number;
    currencyCode: string;
    transitDays?: number | undefined;
    carrierServiceId?: string | undefined;
}>;
export type RateQuote = z.infer<typeof RateQuoteSchema>;
export declare const RateResponseSchema: z.ZodObject<{
    quotes: z.ZodArray<z.ZodObject<{
        carrier: z.ZodString;
        serviceCode: z.ZodString;
        serviceName: z.ZodString;
        totalCharge: z.ZodNumber;
        currencyCode: z.ZodString;
        /** Estimated transit days if provided by carrier */
        transitDays: z.ZodOptional<z.ZodNumber>;
        /** Carrier-specific raw identifier for this service (e.g. UPS service code) */
        carrierServiceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        serviceCode: string;
        carrier: string;
        serviceName: string;
        totalCharge: number;
        currencyCode: string;
        transitDays?: number | undefined;
        carrierServiceId?: string | undefined;
    }, {
        serviceCode: string;
        carrier: string;
        serviceName: string;
        totalCharge: number;
        currencyCode: string;
        transitDays?: number | undefined;
        carrierServiceId?: string | undefined;
    }>, "many">;
    /** Request id or correlation id for support */
    requestId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    quotes: {
        serviceCode: string;
        carrier: string;
        serviceName: string;
        totalCharge: number;
        currencyCode: string;
        transitDays?: number | undefined;
        carrierServiceId?: string | undefined;
    }[];
    requestId?: string | undefined;
}, {
    quotes: {
        serviceCode: string;
        carrier: string;
        serviceName: string;
        totalCharge: number;
        currencyCode: string;
        transitDays?: number | undefined;
        carrierServiceId?: string | undefined;
    }[];
    requestId?: string | undefined;
}>;
export type RateResponse = z.infer<typeof RateResponseSchema>;
//# sourceMappingURL=domain.d.ts.map