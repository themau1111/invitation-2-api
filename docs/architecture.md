# Autonomous service boundary

`invitation-2-api` is an independently deployable Vercel service. It is the sole server-side owner of guest data access, Supabase service credentials, administrator checks, exports, and any future mail delivery.

It communicates with the frontend through versioned HTTPS routes only. It does not import source files, assets, environment files, credentials, or data from the original invitation or from the frontend repository.

The full endpoint contract is maintained in this repository's `docs/api.md`. References to sibling repositories are local-development context only, not runtime dependencies.
