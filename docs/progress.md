# Progress log

## 2026-09-08

- Repository identified as empty API/backend for the second invitation.
- Agent documentation baseline created.
- Pending: stack decision, API contract, Supabase schema and access.
- Defined the shared SMTP variable convention; no credentials are stored in this repository.
- The initial Supabase RSVP schema is live and versioned in `../invitation-2`. The shared API contract is `../invitation-2/docs/api-contract.md`; implementation must enforce token-scoped RSVP and administrator-only list management/export.
- Implemented the Vercel API skeleton on 2026-09-10: token-scoped `GET`/`PUT` RSVP, authenticated administrative guest CRUD, and a CSV export. It uses server-only Supabase credentials, strict origin handling, validation, no-store responses, request IDs, and a server-side rate limiter. Configure its environment variables in Vercel before use; no deployment has been made.
- Created and linked the `invitation-2-api` Vercel project on 2026-09-11. Its production variables, including the server-only Supabase secret, are configured; no deployment was created. Supabase Auth now uses the new frontend URL as its Site URL and allowed redirect URL. Two requested administrator invitations and profiles were created. The third invitation is pending because the project hit Supabase's temporary email rate limit; do not retry it automatically.
- The security advisor was rechecked on 2026-09-11. The two RLS information messages are intentional: guest tables have no browser-access policies. Supabase's leaked-password protection is unavailable on the current Free plan; reassess it if the project upgrades to Pro.
- On 2026-10-06, documented the independent runtime boundary: this API owns its contract and deployment and has no runtime dependency on the original invitation or the frontend repository.
- On 2026-10-07, deployed the API to `https://invitation-2-api.vercel.app`. Its `APP_ORIGIN` is restricted to the named Diana y Héctor frontend URL. Added a deployment rewrite from public `/v1/*` contract routes to Vercel's internal `/api/v1/*` functions; the invalid-token verification returns the intentional generic `404` with the expected CORS header. API tests and syntax checks pass.
- On 2026-10-07, the Vercel team view showed both `invitation-2-api` and `diana-y-hector` under Standard Protection. Do not release RSVP links until their hosting is made public; no team-wide access-control change was made.
- Updated the production CORS origin and public RSVP base URL to `https://diana-y-hector.vercel.app` and redeployed on 2026-10-07. The invalid-token route responds with its generic `404` and exact `Access-Control-Allow-Origin` for that canonical URL.
- Added the four-digit RSVP-code flow on 2026-10-07. An authenticated administrator receives a newly generated unique code when creating an invitation; only its HMAC hash is stored. `POST /v1/rsvp/access` resolves a valid code to the existing opaque RSVP token without returning guest details. The limit is generic per origin/IP, not a per-invitation counter or lockout. `RSVP_CODE_SECRET` is configured as a production-only Vercel Secret. API unit tests and syntax checks pass; deployment is pending.
