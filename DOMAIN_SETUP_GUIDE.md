# Custom Domain Authentication Setup Guide

## Issue: Login Errors with nxtkonektpartners.com

Users trying to login from `nxtkonektpartners.com` are experiencing authentication errors because the custom domain is not registered with Replit's OIDC authentication provider.

## Root Cause

The application correctly redirects to Replit's OIDC server with the callback URL:
```
https://replit.com/oidc/auth?...&redirect_uri=https%3A%2F%2Fnxtkonektpartners.com%2Fapi%2Fcallback
```

However, `nxtkonektpartners.com` is not in the allowed callback URLs list in Replit's OIDC application configuration.

## Solution Required

**The custom domain must be registered in Replit's OIDC application settings:**

1. **Contact Replit Support** or access your Replit application's OIDC configuration
2. **Add the following callback URLs** to the allowed list:
   - `https://nxtkonektpartners.com/api/callback`
   - `http://nxtkonektpartners.com/api/callback` (if HTTP is needed)

## Current Workaround

Users can authenticate via the main Replit domain first:
- Main domain: `https://f80523b4-52dc-45cc-bda8-89c5a1a9b3dd-00-2vzuokq3tubk4.spock.replit.dev`
- Once authenticated, sessions should work across domains

## Technical Details

### Authentication Strategy Registration
The application correctly registers authentication strategies for:
- `f80523b4-52dc-45cc-bda8-89c5a1a9b3dd-00-2vzuokq3tubk4.spock.replit.dev`
- `nxtkonektpartners.com` ✅ (Added)
- `localhost:5000` (development)
- `localhost` (development)

### Error Logging Enhanced
Added comprehensive error logging to identify authentication issues:
- Full callback URL logging
- Detailed error messages with reasons
- Enhanced error display in login-error page

### Code Changes Made
1. **server/replitAuth.ts**: Added `nxtkonektpartners.com` to domain list
2. **client/src/pages/login-error.tsx**: Enhanced error display with domain-specific guidance
3. **Enhanced logging**: Added detailed authentication flow logging

## Next Steps

1. **Submit request to Replit** to add `nxtkonektpartners.com` to OIDC allowed callback URLs
2. **Test authentication** once domain is registered
3. **Update documentation** when issue is resolved

## Status
- ❌ **Current**: Authentication fails for nxtkonektpartners.com
- ⏳ **Pending**: Replit OIDC configuration update needed
- ✅ **Workaround**: Use main Replit domain for authentication