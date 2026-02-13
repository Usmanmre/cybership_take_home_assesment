/**
 * Carrier and operation abstractions. New carriers and operations plug in here
 * without changing existing code.
 */
import type { RateRequest, RateResponse } from "../domain.js";
/** Supported operations. Each carrier can implement a subset. */
export type CarrierOperation = "rate" | "label" | "tracking" | "address_validation";
/** Result of an operation; type depends on operation. */
export type OperationResult = {
    operation: "rate";
    result: RateResponse;
} | {
    operation: "label";
    result: unknown;
} | {
    operation: "tracking";
    result: unknown;
} | {
    operation: "address_validation";
    result: unknown;
};
/** Input for an operation. */
export type OperationInput = {
    operation: "rate";
    input: RateRequest;
} | {
    operation: "label";
    input: unknown;
} | {
    operation: "tracking";
    input: unknown;
} | {
    operation: "address_validation";
    input: unknown;
};
/**
 * A carrier integration implements one or more operations.
 * Example: UpsCarrier implements "rate"; adding FedEx would implement "rate" too.
 */
export interface CarrierIntegration {
    readonly carrierId: string;
    /** Which operations this carrier supports. */
    readonly supportedOperations: readonly CarrierOperation[];
    /** Execute an operation. Input/output types depend on operation. */
    execute(op: OperationInput): Promise<OperationResult>;
}
/** Type guard: rate operation. */
export declare function isRateInput(op: OperationInput): op is {
    operation: "rate";
    input: RateRequest;
};
export declare function isRateResult(op: OperationResult): op is {
    operation: "rate";
    result: RateResponse;
};
//# sourceMappingURL=types.d.ts.map