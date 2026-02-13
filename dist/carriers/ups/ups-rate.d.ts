/**
 * UPS Rating API: build request from domain model, call API, normalize response.
 * Based on UPS Rating API (Shop for rates). Request/response shapes follow UPS docs.
 */
import type { HttpClient } from "../../http-client.js";
import type { RateRequest, RateResponse } from "../../domain.js";
import type { UpsConfig } from "../../config.js";
/** UPS Rating API request body (simplified from UPS docs). */
export interface UpsRateRequest {
    RateRequest?: {
        Request?: {
            RequestOption?: string[];
        };
        Shipment?: {
            ShipFrom?: UpsAddress;
            ShipTo?: UpsAddress;
            Package?: UpsPackage[];
            Service?: {
                Code?: string;
            };
        };
    };
}
interface UpsAddress {
    Address?: {
        AddressLine?: string[];
        City?: string;
        StateProvinceCode?: string;
        PostalCode?: string;
        CountryCode?: string;
    };
}
interface UpsPackage {
    Packaging?: {
        Code?: string;
    };
    Dimensions?: {
        UnitOfMeasurement?: {
            Code?: string;
        };
        Length?: string;
        Width?: string;
        Height?: string;
    };
    PackageWeight?: {
        UnitOfMeasurement?: {
            Code?: string;
        };
        Weight?: string;
    };
}
/** UPS Rating API response (simplified). */
export interface UpsRateResponse {
    RateResponse?: {
        Response?: {
            ResponseStatus?: {
                Code?: string;
                Description?: string;
            };
        };
        RatedShipment?: Array<{
            Service?: {
                Code?: string;
                Name?: string;
            };
            TotalCharges?: {
                MonetaryValue?: string;
                CurrencyCode?: string;
            };
            GuaranteedDelivery?: {
                BusinessDaysInTransit?: string;
            };
        }>;
    };
}
/** Build UPS RateRequest body from our domain RateRequest. */
export declare function buildUpsRateRequest(req: RateRequest): UpsRateRequest;
/** Parse UPS response into our normalized RateResponse. */
export declare function parseUpsRateResponse(body: unknown, carrierId: string): RateResponse;
export interface UpsRateClientOptions {
    config: UpsConfig;
    http: HttpClient;
    getToken: () => Promise<string>;
}
/**
 * Client for UPS Rating API. Uses getToken() for auth (from UpsOAuthClient).
 */
export declare class UpsRateClient {
    private readonly config;
    private readonly http;
    private readonly getToken;
    constructor(options: UpsRateClientOptions);
    getRates(req: RateRequest): Promise<RateResponse>;
}
export {};
//# sourceMappingURL=ups-rate.d.ts.map