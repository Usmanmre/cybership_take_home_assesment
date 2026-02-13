/**
 * UPS carrier integration: implements "rate" operation.
 * Adding "label" or "tracking" would mean new operation handlers and clients
 * without changing this file's structure.
 */
import type { CarrierIntegration } from "../types.js";
import type { OperationInput, OperationResult } from "../types.js";
import type { UpsConfig } from "../../config.js";
import type { HttpClient } from "../../http-client.js";
export interface UpsCarrierOptions {
    config: UpsConfig;
    http: HttpClient;
}
/**
 * UPS carrier: rate shopping via Rating API. Auth is handled internally
 * via OAuth client; callers just call execute({ operation: "rate", input }).
 */
export declare class UpsCarrier implements CarrierIntegration {
    readonly carrierId = "ups";
    readonly supportedOperations: readonly ("rate" | "label" | "tracking" | "address_validation")[];
    private readonly rateClient;
    private readonly oauth;
    constructor(options: UpsCarrierOptions);
    execute(input: OperationInput): Promise<OperationResult>;
}
//# sourceMappingURL=ups-carrier.d.ts.map