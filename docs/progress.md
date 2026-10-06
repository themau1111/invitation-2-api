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
