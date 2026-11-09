# ARPPB Authentication Flow

## Development OTP behaviour
OTP values are stored as hashes in `otp_verifications`. When `ASPNETCORE_ENVIRONMENT=Development`, OTP generation responses include `DevOtp` formatted as `DEV-123456`. The frontend should extract the six digits for verification. In other environments the `DevOtp` field remains null. No SMS or email gateway is used for OTP delivery in this development implementation; OTPs are returned only as DevOtp when the ASP.NET Core environment is Development.

## Registration
1. `POST /api/v1/Registration/send-mobile-otp` with `{ "mobile": "9876543210" }`.
2. Read `DevOtp` from the response.
3. `POST /api/v1/Registration/verify-mobile-otp` with mobile and six-digit OTP.
4. `POST /api/v1/Registration` with registration details. Registration fails unless a valid Registration OTP was verified for that mobile in the previous five minutes.

## Login
`POST /api/v1/Auth/login` with `identifier` (registered mobile or email) and `password`. No OTP is requested. Five failed password attempts lock the account for 15 minutes.

## Forgot password
1. `POST /api/v1/Auth/forgot-password` with exactly one of email or mobile.
2. Read `DevOtp` in Development.
3. `POST /api/v1/Auth/verify-otp` with the same destination and six-digit OTP.
4. `POST /api/v1/Auth/reset-password` with the same destination, OTP, new password and confirmation.

OTP expiry: 5 minutes. OTP verification attempts: maximum 5.

## Database
Run `DatabaseScripts/AuthenticationOtpSetup.sql` against the existing database. It adds login lockout columns if absent and creates the OTP table if absent. Check the database name at the top before execution.

## Security
`DevOtp` is intentionally exposed only when ASP.NET Core environment is `Development`. Do not deploy with Development environment enabled.
