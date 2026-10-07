# API guidance

## Public RSVP

- `GET /v1/rsvp/{accessToken}` returns only the invitation represented by the opaque token.
- `PUT /v1/rsvp/{accessToken}` validates and atomically updates only that invitation and its companions.
- Public routes must never return guest lists, access tokens, contact details beyond the invitation recipient, or administrative data.

## Administration

- `GET` and `POST /v1/admin/guests`, `PATCH` and `DELETE /v1/admin/guests/{id}`, and `GET /v1/admin/guests/export` require a verified Supabase access token and an `admin_profiles` role.
- Export remains administrator-only and never includes access tokens.
- `POST /v1/admin/guests/{id}/access-code` invalidates the previous code and returns a newly issued code once. The API never returns a previously issued plain-text code.
- Seating routes are administrative only: plans and tables are managed through `/v1/admin/seating` and `/v1/admin/seating/tables`; an individual seat assignment is updated through `/v1/admin/seating/seats/{id}`. The database enforces that a guest or companion cannot be seated twice.

All requests and responses use JSON except the CSV export. Keep public RSVP operations narrowly scoped to a guest's allowed record and enforce validation, request-size limits, rate limits, a strict CORS allow-list, and generic Spanish authorization errors.
