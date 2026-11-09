# ARPPB Email Setup

1. Configure `EmailSettings` in `appsettings.json` or (recommended) .NET User Secrets.
2. For Gmail, enable 2-Step Verification and create a Google App Password. Use that 16-character App Password as `EmailSettings:Password`; do not use your normal Gmail password.
3. Set `Username` and `FromEmail` to the Gmail address that owns the App Password.
4. Replace the MySQL password and JWT secret with your own values. Never commit real credentials to Git.

## Email behavior
- Successful login sends a sign-in notification to the registered email address. A mail failure is logged and does not invalidate a valid login.
- Forgot-password and generate-OTP send a six-digit OTP to the submitted email. The API response does not disclose the OTP.
- OTP expires after five minutes, allows up to five attempts, and is single-use.

## Important production note
OTP records currently live in process memory. For multi-instance or restart-safe production deployment, replace this store with Redis or a database table and add request rate limiting.
