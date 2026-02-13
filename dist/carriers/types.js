/**
 * Carrier and operation abstractions. New carriers and operations plug in here
 * without changing existing code.
 */
/** Type guard: rate operation. */
export function isRateInput(op) {
    return op.operation === "rate";
}
export function isRateResult(op) {
    return op.operation === "rate";
}
//# sourceMappingURL=types.js.map