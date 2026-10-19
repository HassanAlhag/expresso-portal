# Email (SMTP)

Used for invitations, password resets and RFQ notices. Without SMTP, production
sends nothing (and, since Phase A, never logs the links).

## Variables (production host and, optionally, staging)

| Variable | Example | Notes |
| --- | --- | --- |
| SMTP_HOST | smtp.office365.com / smtp.gmail.com / email-smtp.<region>.amazonaws.com | Your provider's SMTP server |
| SMTP_PORT | 587 | 587 = STARTTLS; 465 = implicit TLS |
| SMTP_USER | portal@expresso… | Mailbox or SMTP credential username |
| SMTP_PASS | (secret) | App password / SMTP credential, not a personal login password |
| SMTP_FROM | "Expresso Portal <portal@expresso…>" | Must be a sender the account may send as |
| FRONTEND_URL | https://<portal domain> | Links in emails point here — must be the real portal URL in production |

Deliverability: the sending domain should have SPF and DKIM records for the provider.

## Safe testing (no real users affected)

1. **Is production configured?** Sign in as super admin and open
   `GET /api/admin/system-status` (browser: `<api>/api/admin/system-status` with your session, or via the portal later).
   It reports `email.smtpConfigured` and the host — never the password.
2. **Do the credentials work?** On your Mac with the same SMTP values in a staging env:
   `node src/scripts/sendTestEmail.js you@yourdomain.com` — connects, authenticates, sends one plain email. Touches no user.
3. **End-to-end on staging:** invite a test address you own (plus-addressing works:
   `you+invite1@yourdomain.com`), accept it; then use *Forgot password* for that test user.
4. **Production smoke test:** use *Forgot password* for **your own** account only, or invite your own
   plus-address and cancel the invite afterwards. Never test with real client or staff addresses.
