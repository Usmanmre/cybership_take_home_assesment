/**
 * UPS carrier integration: implements "rate" operation.
 * Adding "label" or "tracking" would mean new operation handlers and clients
 * without changing this file's structure.
 */
import { isRateInput } from "../types.js";
import { UpsRateClient } from "./ups-rate.js";
import { UpsOAuthClient } from "../../auth/ups-oauth.js";
import { CarrierIntegrationError } from "../../errors.js";
const SUPPORTED_OPERATIONS = ["rate"];
/**
 * UPS carrier: rate shopping via Rating API. Auth is handled internally
 * via OAuth client; callers just call execute({ operation: "rate", input }).
 */
export class UpsCarrier {
    carrierId = "ups";
    supportedOperations = SUPPORTED_OPERATIONS;
    rateClient;
    oauth;
    constructor(options) {
        this.oauth = new UpsOAuthClient(options.config, options.http);
        this.rateClient = new UpsRateClient({
            config: options.config,
            http: options.http,
            getToken: () => this.oauth.getValidToken(),
        });
    }
    async execute(input) {
        if (isRateInput(input)) {
            const result = await this.rateClient.getRates(input.input);
            return { operation: "rate", result };
        }
        throw new CarrierIntegrationError({
            code: "VALIDATION_ERROR",
            message: `UPS does not support operation: ${input.operation}`,
            context: { carrierId: this.carrierId, supported: [...this.supportedOperations] },
        });
    }
}
//# sourceMappingURL=ups-carrier.js.map