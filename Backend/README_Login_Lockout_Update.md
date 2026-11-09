# ARPPB Login API - Account Lockout Update

## Behavior
- The account is locked after 5 consecutive incorrect passwords.
- Lockout duration is 15 minutes.
- While locked, login is rejected with HTTP 429 Too Many Requests.
- The response indicates the remaining wait time.
- A correct password resets the failed-attempt count.
- When the 15-minute lockout expires, the user can try again.
- Unknown users still receive a generic invalid-credentials response.

## Existing database
This update targets the existing MySQL database `u819242402_arppb` and the existing table `Users`. It does not create a new database or replace existing user records.

Before using the updated code, inspect the existing table and run `DatabaseScripts/AddLoginLockoutColumns.sql` only if those columns are not already present. The script checks for the columns and adds only missing ones. Do not run EF migrations.

## Build
From the `ARPPB/Backend` folder:

```powershell
dotnet build Backend.csproj
```

## Test
Run the backend, then call `POST /api/v1/Auth/login` in Swagger using an existing test account:
1. Enter an incorrect password four times. Each response should say how many attempts remain.
2. Enter an incorrect password a fifth time. Expect HTTP 429 and a 15-minute lockout message.
3. Try again while locked. Expect HTTP 429.
4. Wait until the lockout expires, then use the correct password. Login should succeed and the counter resets.

Do not test this with a real user's account; use a test account.

## Note
This change adds persistent per-account failed-login tracking. It is not a per-IP network rate limiter. The existing JWT login response and email notification behavior are unchanged in this update.
