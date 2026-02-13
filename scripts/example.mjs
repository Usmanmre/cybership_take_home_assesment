/**
 * Example: run the rate service with stubbed HTTP (no real UPS API key).
 * Run: npm run build && npm run example
 */

import { createStubHttpClient } from "../dist/test-utils/stub-http.js";
import { CarrierIntegrationService } from "../dist/service.js";
import { UpsCarrier } from "../dist/carriers/ups/ups-carrier.js";
import { getUpsConfig } from "../dist/config.js";

const rateRequest = {
  origin: {
    line1: "123 Origin Street",
    line2: "Suite 100",
    city: "Atlanta",
    stateProvinceCode: "GA",
    postalCode: "30301",
    countryCode: "US",
  },
  destination: {
    line1: "456 Destination Ave",
    city: "New York",
    stateProvinceCode: "NY",
    postalCode: "10001",
    countryCode: "US",
  },
  packages: [
    {
      weight: 5,
      weightUnit: "LBS",
      length: 10,
      width: 8,
      height: 6,
      dimensionUnit: "IN",
    },
  ],
};

const stub = createStubHttpClient();
stub.stubNext({
  status: 200,
  body: { access_token: "stub_token", expires_in: 3600 },
});
stub.stubNext({
  status: 200,
  body: {
    RateResponse: {
      Response: { ResponseStatus: { Code: "1", Description: "Success" } },
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
  },
});

const config = {
  ...getUpsConfig(),
  clientId: "example",
  clientSecret: "example",
  apiBaseUrl: "https://api.example.com",
  oauthTokenUrl: "https://auth.example.com/token",
};

const service = new CarrierIntegrationService({
  carriers: [new UpsCarrier({ config, http: stub })],
});

console.log("--- INPUT (RateRequest) ---");
console.log(JSON.stringify(rateRequest, null, 2));

const result = await service.getRates("ups", rateRequest);

console.log("\n--- OUTPUT (RateResponse) ---");
console.log(JSON.stringify(result, null, 2));
