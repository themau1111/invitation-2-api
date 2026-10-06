# Future API deployment variables

When the second invitation API is implemented, configure its SMTP delivery in its chosen hosting provider using the same non-secret variable names as the original invitation:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_STARTTLS`, `SMTP_SSL`, `INVITATION_EMAIL_FROM`

Use its own server-only Supabase key and separate `ADMIN_EMAILS`, `NOTIFICATION_RECIPIENTS`, and `ADMIN_APP_ORIGIN` values. Do not reuse the original invitation's Supabase service-role key.
