/**
 * Integration tests: service + carrier + stubbed HTTP.
 * Verifies request building, response parsing, auth lifecycle, and error handling
 * using realistic UPS-style payloads (no live API).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CarrierIntegrationService } from "./service.js";
import { UpsCarrier } from "./carriers/ups/ups-carrier.js";
import { getUpsConfig } from "./config.js";
import { createStubHttpClient } from "./test-utils/stub-http.js";
import { CarrierIntegrationError, isCarrierIntegrationError } from "./errors.js";
import { buildUpsRateRequest, parseUpsRateResponse } from "./carriers/ups/ups-rate.js";
import type { RateRequest } from "./domain.js";

// --- Realistic UPS OAuth response (from UPS docs) ---
const UPS_OAUTH_SUCCESS = {
  access_token: "test_token_abc123",
  token_type: "Bearer",
  expires_in: 3600,
};

// --- Realistic UPS Rating API success (simplified from UPS Rating response) ---
const UPS_RATE_SUCCESS = {
  RateResponse: {
    Response: {
      ResponseStatus: { Code: "1", Description: "Success" },
    },
    RatedShipment: [
      {
        Service: { Code: "03", Name: "Ground" },
        TotalCharges: { MonetaryValue: "12.50", CurrencyCode: "USD" },
        GuaranteedDelivery: { BusinessDaysInTransit: "3" },
      },
      {
        Service: { Code: "07", Name: "Worldwide Express" },
        TotalCharges: { MonetaryValue: "24.99", CurrencyCode: "USD" },
        GuaranteedDelivery: { BusinessDaysInTransit: "1" },
      },
    ],
  },
};

const SAMPLE_RATE_REQUEST: RateRequest = {
  origin: {
    line1: "123 Origin St",
    city: "Atlanta",
    stateProvinceCode: "GA",
    postalCode: "30301",
    countryCode: "US",
  },
  destination: {
    line1: "456 Dest Ave",
    city: "New York",
    stateProvinceCode: "NY",
    postalCode: "10001",
    countryCode: "US",
  },
  packages: [
    { weight: 5, weightUnit: "LBS", length: 10, width: 8, height: 6, dimensionUnit: "IN" },
  ],
};

const config = {
  ...getUpsConfig(),
  clientId: "test_client",
  clientSecret: "test_secret",
  apiBaseUrl: "https://api.example.com",
  oauthTokenUrl: "https://auth.example.com/token",
};

describe("CarrierIntegrationService", () => {
  let stubHttp: ReturnType<typeof createStubHttpClient>;
  let service: CarrierIntegrationService;

  beforeEach(() => {
    stubHttp = createStubHttpClient();
    const ups = new UpsCarrier({ config, http: stubHttp });
    service = new CarrierIntegrationService({ carriers: [ups] });
  });

  describe("getRates", () => {
    it("builds correct UPS request and returns normalized quotes", async () => {
      stubHttp.stubNext({ status: 200, body: UPS_OAUTH_SUCCESS });
      stubHttp.stubNext({ status: 200, body: UPS_RATE_SUCCESS });

      const result = await service.getRates("ups", SAMPLE_RATE_REQUEST);

      expect(result.quotes).toHaveLength(2);
      expect(result.quotes[0]).toMatchObject({
        carrier: "ups",
        serviceCode: "03",
        serviceName: "Ground",
        totalCharge: 12.5,
        currencyCode: "USD",
        transitDays: 3,
      });
      expect(result.quotes[1]).toMatchObject({
        serviceCode: "07",
        totalCharge: 24.99,
        transitDays: 1,
      });

      const requests = stubHttp.getRequests();
      expect(requests).toHaveLength(2);
      expect(requests[0].url).toContain("token");
      expect(requests[0].method).toBe("POST");
      expect(requests[1].url).toContain("ratings");
      expect(requests[1].method).toBe("POST");

      const rateBody = JSON.parse(requests[1].body ?? "{}");
      expect(rateBody.RateRequest?.Shipment?.ShipFrom?.Address?.City).toBe("Atlanta");
      expect(rateBody.RateRequest?.Shipment?.ShipTo?.Address?.PostalCode).toBe("10001");
      expect(rateBody.RateRequest?.Shipment?.Package).toHaveLength(1);
      expect(rateBody.RateRequest?.Shipment?.Package?.[0]?.PackageWeight?.Weight).toBe("5");
    });

    it("reuses auth token on second rate call", async () => {
      stubHttp.stubNext({ status: 200, body: UPS_OAUTH_SUCCESS });
      stubHttp.stubNext({ status: 200, body: UPS_RATE_SUCCESS });
      await service.getRates("ups", SAMPLE_RATE_REQUEST);

      stubHttp.stubNext({ status: 200, body: UPS_RATE_SUCCESS });
      await service.getRates("ups", SAMPLE_RATE_REQUEST);

      const requests = stubHttp.getRequests();
      const tokenRequests = requests.filter((r) => r.url.includes("token"));
      expect(tokenRequests).toHaveLength(1);
    });

    it("validates input and throws VALIDATION_ERROR for invalid request", async () => {
      await expect(
        service.getRates("ups", {
          origin: { line1: "x", city: "x", postalCode: "x", countryCode: "US" },
          destination: { line1: "y", city: "y", postalCode: "y", countryCode: "US" },
          packages: [], // invalid: at least one package required
        })
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        message: expect.stringContaining("package"),
      });
    });

    it("throws for unknown carrier", async () => {
      await expect(service.getRates("fedex", SAMPLE_RATE_REQUEST)).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        message: expect.stringContaining("Unknown carrier"),
      });
    });
  });
});

describe("UPS request builder and response parser", () => {
  it("buildUpsRateRequest produces valid UPS-shaped payload", () => {
    const built = buildUpsRateRequest(SAMPLE_RATE_REQUEST);
    expect(built.RateRequest?.Request?.RequestOption).toContain("Shop");
    expect(built.RateRequest?.Shipment?.ShipFrom?.Address?.City).toBe("Atlanta");
    expect(built.RateRequest?.Shipment?.Package?.[0]?.PackageWeight?.Weight).toBe("5");
    expect(built.RateRequest?.Shipment?.Package?.[0]?.Dimensions?.Length).toBe("10");
  });

  it("parseUpsRateResponse normalizes to RateResponse", () => {
    const result = parseUpsRateResponse(UPS_RATE_SUCCESS, "ups");
    expect(result.quotes).toHaveLength(2);
    expect(result.quotes[0].totalCharge).toBe(12.5);
    expect(result.quotes[0].carrierServiceId).toBe("03");
  });

  it("parseUpsRateResponse throws on malformed response", () => {
    expect(() => parseUpsRateResponse(null, "ups")).toThrow(CarrierIntegrationError);
    expect(() => parseUpsRateResponse({}, "ups")).toThrow(CarrierIntegrationError);
    expect(() => parseUpsRateResponse({ RateResponse: {} }, "ups")).not.toThrow();
  });
});

describe("Auth token lifecycle", () => {
  it("acquires token on first use", async () => {
    const stub = createStubHttpClient();
    stub.stubNext({ status: 200, body: UPS_OAUTH_SUCCESS });

    const { UpsOAuthClient } = await import("./auth/ups-oauth.js");
    const client = new UpsOAuthClient(config, stub);
    const token = await client.getValidToken();

    expect(token).toBe("test_token_abc123");
    const reqs = stub.getRequests();
    expect(reqs).toHaveLength(1);
    expect(reqs[0].url).toContain("token");
    expect(reqs[0].body).toContain("grant_type=client_credentials");
  });

  it("returns structured error on auth 401", async () => {
    const stub = createStubHttpClient();
    stub.stubNext({ status: 401, body: { error: "unauthorized" } });

    const { UpsOAuthClient } = await import("./auth/ups-oauth.js");
    const client = new UpsOAuthClient(config, stub);

    await expect(client.getValidToken()).rejects.toMatchObject({
      code: "AUTH_FAILED",
      statusCode: 401,
    });
  });

  it("returns structured error on auth 429 rate limit", async () => {
    const stub = createStubHttpClient();
    stub.stubNext({ status: 429, body: {} });

    const { UpsOAuthClient } = await import("./auth/ups-oauth.js");
    const client = new UpsOAuthClient(config, stub);

    await expect(client.getValidToken()).rejects.toMatchObject({
      code: "RATE_LIMITED",
      statusCode: 429,
    });
  });
});

describe("Error handling: rate API", () => {
  it("4xx from rate API produces CARRIER_ERROR", async () => {
    const stub = createStubHttpClient();
    stub.stubNext({ status: 200, body: UPS_OAUTH_SUCCESS });
    stub.stubNext({
      status: 400,
      body: { response: { errors: [{ code: "INVALID_REQUEST" }] } },
    });

    const ups = new UpsCarrier({ config, http: stub });
    const service = new CarrierIntegrationService({ carriers: [ups] });

    await expect(service.getRates("ups", SAMPLE_RATE_REQUEST)).rejects.toMatchObject({
      code: "CARRIER_ERROR",
      statusCode: 400,
      carrierCode: "INVALID_REQUEST",
    });
  });

  it("401 from rate API produces AUTH_TOKEN_EXPIRED", async () => {
    const stub = createStubHttpClient();
    stub.stubNext({ status: 200, body: UPS_OAUTH_SUCCESS });
    stub.stubNext({ status: 401, body: {} });

    const ups = new UpsCarrier({ config, http: stub });
    const service = new CarrierIntegrationService({ carriers: [ups] });

    await expect(service.getRates("ups", SAMPLE_RATE_REQUEST)).rejects.toMatchObject({
      code: "AUTH_TOKEN_EXPIRED",
      statusCode: 401,
    });
  });

  it("5xx from rate API produces CARRIER_ERROR", async () => {
    const stub = createStubHttpClient();
    stub.stubNext({ status: 200, body: UPS_OAUTH_SUCCESS });
    stub.stubNext({ status: 503, body: { message: "Service Unavailable" } });

    const ups = new UpsCarrier({ config, http: stub });
    const service = new CarrierIntegrationService({ carriers: [ups] });

    await expect(service.getRates("ups", SAMPLE_RATE_REQUEST)).rejects.toMatchObject({
      code: "CARRIER_ERROR",
      statusCode: 503,
    });
  });

  it("network/timeout error produces TIMEOUT or NETWORK_ERROR", async () => {
    const stub = createStubHttpClient();
    stub.stubNext({ status: 200, body: UPS_OAUTH_SUCCESS });
    stub.stubNextReject(new Error("fetch failed: timeout"));

    const ups = new UpsCarrier({ config, http: stub });
    const service = new CarrierIntegrationService({ carriers: [ups] });

    const err = await service.getRates("ups", SAMPLE_RATE_REQUEST).then(
      () => null,
      (e) => e
    );
    expect(err).toBeInstanceOf(CarrierIntegrationError);
    expect(isCarrierIntegrationError(err)).toBe(true);
    expect(["NETWORK_ERROR", "TIMEOUT", "UNKNOWN"]).toContain((err as CarrierIntegrationError).code);
  });
});
