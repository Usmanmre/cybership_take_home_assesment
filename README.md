# Carrier Integration Service

TypeScript service that wraps the UPS Rating API for shipping rates. Built so we can add more carriers (FedEx, USPS, DHL) and operations (labels, tracking) without rewriting existing code.

---

## Design decisions

- **Carrier-agnostic API** — Callers send a generic `RateRequest` (origin, destination, packages) and get a normalized `RateResponse` (quotes). UPS-specific request/response shapes live only inside `carriers/ups/`.
- **Carrier + operation abstraction** — Each carrier implements `CarrierIntegration.execute(operation, input)`. Adding FedEx = new class; UPS code stays unchanged.
- **Auth** — UPS OAuth 2.0 client-credentials in `auth/ups-oauth.ts`: token is fetched once, cached, and refreshed automatically before expiry. Callers use `getValidToken()` only.
- **Config** — All secrets and URLs come from environment variables (see `.env.example`). No hardcoded credentials.
- **Validation** — Zod validates every rate request before any HTTP call. Invalid input throws `CarrierIntegrationError` with code `VALIDATION_ERROR`.
- **Errors** — All failures (auth, 4xx/5xx, timeouts, malformed responses) become `CarrierIntegrationError` with a stable `code` and optional `statusCode`/`carrierCode`.
- **HTTP behind an interface** — `HttpClient` is injectable: production uses `fetch`; tests use a stub so we can test request building, parsing, and errors without a live API.

---

## How to run

```bash
npm install
npm run build
npm test              # run tests (stubbed HTTP, no API key)
npm run example       # demo with stubbed responses
npm run live -- scripts/sample-rate-request.json   # real UPS API (needs .env)
```

**Live run** requires a `.env` with `UPS_CLIENT_ID` and `UPS_CLIENT_SECRET`. Copy **`env.example`** to `.env` and fill in values. (See `env.example` for the full list of variables.)

---

## What I’d improve with more time

- **UPS Rating path/version** — Confirm exact path and query params from current UPS docs and align request/response types.
- **Retries** — Retry with backoff on 5xx and timeouts; optionally retry once on 401 after clearing auth cache.
- **Second carrier** — Add FedEx (or another) to show the pattern end-to-end.
- **More operations** — Stub or implement `label` and `tracking` so the operation abstraction is exercised.
- **Logging** — Structured logger with request/carrier IDs for debugging.
