/**
 * UPS Rating API: build request from domain model, call API, normalize response.
 * Based on UPS Rating API (Shop for rates). Request/response shapes follow UPS docs.
 */

import { z } from "zod";
import type { HttpClient } from "../../http-client.js";
import type { RateRequest, RateResponse, RateQuote, Address, Package } from "../../domain.js";
import { CarrierIntegrationError } from "../../errors.js";
import type { UpsConfig } from "../../config.js";

/** Runtime validation for UPS rate API response. */
const UpsRatedShipmentSchema = z.object({
  Service: z.object({ Code: z.string().optional(), Name: z.string().optional() }).optional(),
  TotalCharges: z
    .object({
      MonetaryValue: z.string().optional(),
      CurrencyCode: z.string().optional(),
    })
    .optional(),
  GuaranteedDelivery: z.object({ BusinessDaysInTransit: z.string().optional() }).optional(),
});

const UpsRateResponseSchema = z.object({
  RateResponse: z
    .object({
      Response: z
        .object({
          ResponseStatus: z
            .object({ Code: z.string().optional(), Description: z.string().optional() })
            .optional(),
        })
        .optional(),
      RatedShipment: z.array(UpsRatedShipmentSchema).optional(),
    })
    .optional(),
});

const UPS_RATING_PATH = "/api/ratings/v1/Shop";
const UPS_RATE_VERSION = "v1";

/** UPS Rating API request body (simplified from UPS docs). */
export interface UpsRateRequest {
  RateRequest?: {
    Request?: { RequestOption?: string[] };
    Shipment?: {
      ShipFrom?: UpsAddress;
      ShipTo?: UpsAddress;
      Package?: UpsPackage[];
      Service?: { Code?: string };
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
  Packaging?: { Code?: string };
  Dimensions?: {
    UnitOfMeasurement?: { Code?: string };
    Length?: string;
    Width?: string;
    Height?: string;
  };
  PackageWeight?: {
    UnitOfMeasurement?: { Code?: string };
    Weight?: string;
  };
}

/** Map domain Address to UPS ShipFrom/ShipTo format. */
function toUpsAddress(addr: Address): UpsAddress {
  const lines = [addr.line1, addr.line2, addr.line3].filter(Boolean) as string[];
  return {
    Address: {
      AddressLine: lines.length ? lines : undefined,
      City: addr.city,
      StateProvinceCode: addr.stateProvinceCode,
      PostalCode: addr.postalCode,
      CountryCode: addr.countryCode,
    },
  };
}

/** Map domain Package to UPS Package format. */
function toUpsPackage(pkg: Package): UpsPackage {
  const dimUnit = pkg.dimensionUnit === "CM" ? "CM" : "IN";
  const weightUnit = pkg.weightUnit === "KGS" ? "KGS" : "LBS";
  const result: UpsPackage = {
    Packaging: { Code: "02" }, // Customer supplied
    PackageWeight: {
      UnitOfMeasurement: { Code: weightUnit },
      Weight: String(pkg.weight),
    },
  };
  if (
    pkg.length != null &&
    pkg.width != null &&
    pkg.height != null
  ) {
    result.Dimensions = {
      UnitOfMeasurement: { Code: dimUnit },
      Length: String(pkg.length),
      Width: String(pkg.width),
      Height: String(pkg.height),
    };
  }
  return result;
}

/** Build UPS RateRequest body from our domain RateRequest. */
export function buildUpsRateRequest(req: RateRequest): UpsRateRequest {
  return {
    RateRequest: {
      Request: { RequestOption: ["Shop"] },
      Shipment: {
        ShipFrom: toUpsAddress(req.origin),
        ShipTo: toUpsAddress(req.destination),
        Package: req.packages.map(toUpsPackage),
        Service: req.serviceCode ? { Code: req.serviceCode } : undefined,
      },
    },
  };
}

/** Known UPS service code -> display name (subset). */
const UPS_SERVICE_NAMES: Record<string, string> = {
  "01": "Next Day Air",
  "02": "2nd Day Air",
  "03": "Ground",
  "07": "Worldwide Express",
  "08": "Worldwide Expedited",
  "11": "Standard",
  "12": "3 Day Select",
  "13": "Next Day Air Saver",
  "14": "Next Day Air Early",
  "54": "Worldwide Express Plus",
  "59": "2nd Day Air A.M.",
  "65": "Worldwide Saver",
  "70": "Worldwide Express Sprint",
  "71": "Worldwide Express Sprint Plus",
  "96": "Worldwide Express Freight",
  "M2": "First Class Mail",
  "M3": "Priority Mail",
  "M4": "Expedited Mail Innovations",
  "M5": "Priority Mail Innovations",
  "M6": "Economy Mail Innovations",
};

function upsServiceName(code: string): string {
  return UPS_SERVICE_NAMES[code] ?? code;
}

/** Parse UPS response into our normalized RateResponse. */
export function parseUpsRateResponse(
  body: unknown,
  carrierId: string
): RateResponse {
  const parsed = UpsRateResponseSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new CarrierIntegrationError({
      code: "MALFORMED_RESPONSE",
      message: `UPS rate response invalid — ${message}`,
      context: { body, issues: parsed.error.flatten() },
    });
  }

  const rateResponse = parsed.data.RateResponse;
  if (!rateResponse) {
    throw new CarrierIntegrationError({
      code: "MALFORMED_RESPONSE",
      message: "UPS rate response missing RateResponse",
      context: { body },
    });
  }

  const status = rateResponse.Response?.ResponseStatus;
  if (status?.Code && status.Code !== "1") {
    throw new CarrierIntegrationError({
      code: "CARRIER_ERROR",
      message: status.Description ?? `UPS error: ${status.Code}`,
      carrierCode: status.Code,
      context: { body },
    });
  }

  const ratedShipments = rateResponse.RatedShipment ?? [];
  const quotes: RateQuote[] = ratedShipments.map((s) => {
    const svc = s.Service;
    const code = svc?.Code ?? "UNKNOWN";
    const total = s.TotalCharges?.MonetaryValue;
    const currency = s.TotalCharges?.CurrencyCode ?? "USD";
    const transitDays = s.GuaranteedDelivery?.BusinessDaysInTransit;
    const totalCharge =
      total != null && total !== "" ? parseFloat(total) : 0;
    const transitDaysNum =
      transitDays != null && transitDays !== ""
        ? parseInt(transitDays, 10)
        : undefined;
    return {
      carrier: carrierId,
      serviceCode: code,
      serviceName: svc?.Name ?? upsServiceName(code),
      totalCharge: Number.isNaN(totalCharge) ? 0 : totalCharge,
      currencyCode: currency ?? "USD",
      transitDays: transitDaysNum != null && !Number.isNaN(transitDaysNum) ? transitDaysNum : undefined,
      carrierServiceId: code,
    };
  });

  return { quotes };
}

export interface UpsRateClientOptions {
  config: UpsConfig;
  http: HttpClient;
  getToken: () => Promise<string>;
}

/**
 * Client for UPS Rating API. Uses getToken() for auth (from UpsOAuthClient).
 */
export class UpsRateClient {
  private readonly config: UpsConfig;
  private readonly http: HttpClient;
  private readonly getToken: () => Promise<string>;

  constructor(options: UpsRateClientOptions) {
    this.config = options.config;
    this.http = options.http;
    this.getToken = options.getToken;
  }

  async getRates(req: RateRequest): Promise<RateResponse> {
    const token = await this.getToken();
    const url = `${this.config.apiBaseUrl}${UPS_RATING_PATH}`;
    const requestBody = buildUpsRateRequest(req);
    const query = new URLSearchParams({ version: UPS_RATE_VERSION }).toString();

    const res = await this.http.request<unknown>({
      method: "POST",
      url: `${url}?${query}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
      timeoutMs: this.config.requestTimeoutMs,
    });

    if (res.status === 401) {
      throw new CarrierIntegrationError({
        code: "AUTH_TOKEN_EXPIRED",
        message: "UPS rate request unauthorized (401); token may have expired",
        statusCode: 401,
      });
    }

    if (res.status === 429) {
      throw new CarrierIntegrationError({
        code: "RATE_LIMITED",
        message: "UPS rate limited (429)",
        statusCode: 429,
      });
    }

    if (res.status >= 400) {
      const carrierCode = tryGetCarrierErrorCode(res.body);
      throw new CarrierIntegrationError({
        code: "CARRIER_ERROR",
        message: `UPS rate request failed: HTTP ${res.status}`,
        statusCode: res.status,
        carrierCode,
        context: { body: res.body },
      });
    }

    return parseUpsRateResponse(res.body, "ups");
  }
}

function tryGetCarrierErrorCode(body: unknown): string | undefined {
  if (body && typeof body === "object") {
    const response = (body as { response?: { errors?: Array<{ code?: string }> } })
      .response;
    const code = response?.errors?.[0]?.code;
    if (typeof code === "string") return code;
  }
  return undefined;
}
