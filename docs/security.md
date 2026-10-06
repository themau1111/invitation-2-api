# Security and privacy

Validate all input at the API boundary, limit request size and frequency, set a precise CORS allow-list, and log operational context without guest payloads or secrets. Keep SMTP, Supabase service credentials, and administrative access outside source control.

The initial implementation includes an in-memory per-instance limit for public RSVP mutations. Before production deployment, configure a Vercel Firewall rate-limit rule (or a shared rate-limit store) because serverless instances do not share in-memory state.
