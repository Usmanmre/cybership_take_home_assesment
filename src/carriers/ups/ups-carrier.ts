/**
 * UPS carrier integration: implements "rate" operation.
 * Adding "label" or "tracking" would mean new operation handlers and clients
 * without changing this file's structure.
 */

import type { CarrierIntegration } from "../types.js";
import type { OperationInput, OperationResult } from "../types.js";
import { isRateInput } from "../types.js";
import { UpsRateClient } from "./ups-rate.js";
import { UpsOAuthClient } from "../../auth/ups-oauth.js";
import type { UpsConfig } from "../../config.js";
import type { HttpClient } from "../../http-client.js";
import { CarrierIntegrationError } from "../../errors.js";

const SUPPORTED_OPERATIONS = ["rate"] as const;

export interface UpsCarrierOptions {
  config: UpsConfig;
  http: HttpClient;
}

/**
 * UPS carrier: rate shopping via Rating API. Auth is handled internally
 * via OAuth client; callers just call execute({ operation: "rate", input }).
 */
export class UpsCarrier implements CarrierIntegration {
  readonly carrierId = "ups";
  readonly supportedOperations: readonly ("rate" | "label" | "tracking" | "address_validation")[] =
    SUPPORTED_OPERATIONS;

  private readonly rateClient: UpsRateClient;
  private readonly oauth: UpsOAuthClient;

  constructor(options: UpsCarrierOptions) {
    this.oauth = new UpsOAuthClient(options.config, options.http);
    this.rateClient = new UpsRateClient({
      config: options.config,
      http: options.http,
      getToken: () => this.oauth.getValidToken(),
    });
  }

  async execute(input: OperationInput): Promise<OperationResult> {
    if (isRateInput(input)) {
      const result = await this.rateClient.getRates(input.input);
      return { operation: "rate", result };
    }
    throw new CarrierIntegrationError({
      code: "VALIDATION_ERROR",
      message: `UPS does not support operation: ${(input as OperationInput).operation}`,
      context: { carrierId: this.carrierId, supported: [...this.supportedOperations] },
    });
  }
}
