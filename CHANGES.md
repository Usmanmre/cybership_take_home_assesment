# Parsing & Validation Changes

This document describes the changes made to replace **type casting** with **runtime parsing and validation** for external API responses (UPS OAuth and UPS Rating). It also explains why these changes were made.

---

## What Changed

### 1. UPS OAuth token response (`src/auth/ups-oauth.ts`)

**Before**

- The code checked that `res.body` was an object and that `access_token` was a string.
- It then used TypeScript casts: `(data as UpsOAuthTokenResponse).access_token` and `(data as UpsOAuthTokenResponse).expires_in`.
- Casts do not run at runtime: if the API returned a different shape (e.g. `access_token` missing or a number), the code could use invalid data or throw unclear errors.

**After**

- A **Zod schema** `UpsOAuthTokenResponseSchema` was added:
  - `access_token`: required, non-empty string
  - `expires_in`: optional, positive integer, default `3600`
  - `token_type`: optional string
- The OAuth response is parsed with **`UpsOAuthTokenResponseSchema.safeParse(res.body)`**.
- On **success**: only **`parsed.data`** is used (no casts). Types are correct and the shape is guaranteed by the schema.
- On **failure**: a **`CarrierIntegrationError`** is thrown with:
  - `code: "MALFORMED_RESPONSE"`
  - A message built from Zod’s validation issues (field path + message)
  - `context: { body: res.body, issues: parsed.error.flatten() }` for debugging.

**Removed**

- The `UpsOAuthTokenResponse` interface (replaced by the schema and `z.infer` if needed).
- The generic `requestToken<UpsOAuthTokenResponse>()`; the request now uses `request<unknown>()` and the result is validated before use.

---

### 2. UPS Rating API response (`src/carriers/ups/ups-rate.ts`)

**Before**

- The code checked that `body` was an object, then used **`(body as UpsRateResponse).RateResponse`** and read nested fields directly.
- No runtime check that `RatedShipment` was an array or that its elements had the expected shape.
- `parseFloat` / `parseInt` results were used without checking for `NaN`, so invalid strings could produce `NaN` in the normalized output.

**After**

- **Zod schemas** were added:
  - **`UpsRatedShipmentSchema`**: optional `Service` (Code, Name), `TotalCharges` (MonetaryValue, CurrencyCode), `GuaranteedDelivery` (BusinessDaysInTransit), with correct types (e.g. strings where the API sends strings).
  - **`UpsRateResponseSchema`**: optional top-level `RateResponse` with optional `Response` / `ResponseStatus` and optional array of `UpsRatedShipmentSchema`.
- **`parseUpsRateResponse(body, carrierId)`** now:
  - Runs **`UpsRateResponseSchema.safeParse(body)`**.
  - On **failure**: throws **`CarrierIntegrationError`** with `code: "MALFORMED_RESPONSE"`, a message from Zod, and `context: { body, issues: parsed.error.flatten() }`.
  - On **success**: uses only **`parsed.data`** (no casts) to read `RateResponse`, `RatedShipment`, and each shipment’s fields.
- When building each quote:
  - **`totalCharge`**: after `parseFloat(total)`, the value is used only if it’s not `NaN`; otherwise `0` is used.
  - **`transitDays`**: set only when the parsed integer is not `NaN`.
  - **`currencyCode`**: falls back to `"USD"` when missing.

**Removed**

- The **`UpsRateResponse`** interface; the expected shape is now defined by the Zod schema.

---

## Why These Changes Were Made

1. **Safety**  
   External APIs can change or return unexpected data. Casts (`as Type`) tell the compiler to trust the shape but do nothing at runtime. Parsing with Zod ensures we only use data that actually matches the schema and fail clearly when it doesn’t.

2. **Clearer failures**  
   When the response is malformed, we throw a **`CarrierIntegrationError`** with a concrete message (e.g. which field failed and why) and attach Zod’s **`issues`** in **`context`**. That makes debugging and logging much easier than generic type errors or silent misuse of bad data.

3. **No blind trust**  
   Every field we use from the OAuth and Rating responses is now validated (type and, where relevant, shape) before use. We don’t assume the API always returns the documented structure.

4. **Consistency**  
   The rest of the service already uses Zod for domain input (e.g. `RateRequestSchema`). Using Zod for **external** API responses keeps the same pattern: one place to define and validate shape, one place to get typed data.

5. **Numeric robustness**  
   Checking `parseFloat`/`parseInt` results for `NaN` before putting them into `totalCharge` and `transitDays` avoids leaking invalid numbers into the normalized output and downstream consumers.

---

## Summary

| Area              | Before                         | After                                              |
|-------------------|--------------------------------|----------------------------------------------------|
| OAuth response    | Casts + manual checks          | Zod schema + `safeParse`; use only `parsed.data`  |
| Rate response     | Casts + manual checks          | Zod schema + `safeParse`; use only `parsed.data`  |
| Error on invalid  | Possible wrong data or vague errors | Structured `CarrierIntegrationError` with Zod issues |
| Numerics in quotes| No NaN handling                | `totalCharge` and `transitDays` guarded for NaN   |

These updates make the integration more robust and easier to debug when UPS returns an unexpected or invalid payload.
