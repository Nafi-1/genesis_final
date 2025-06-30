# 🔐 Google OAuth Setup Instructions

Follow these steps to enable Google Sign-In for GenesisOS:

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Name it**: `GenesisOS` or similar

## Step 2: Enable Google+ API

1. **Go to APIs & Services** → **Library**
2. **Search for**: "Google+ API" 
3. **Click Enable**

## Step 3: Create OAuth 2.0 Credentials

1. **Go to APIs & Services** → **Credentials**
2. **Click "Create Credentials"** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: GenesisOS Web Client

### Authorized JavaScript Origins:
```
http://localhost:5173
https://your-production-domain.com
```

### Authorized Redirect URIs:
```
https://atnmspufnvgfxhilemsd.supabase.co/auth/v1/callback
```

## Step 4: Get Your Credentials

After creation, you'll see:
- **Client ID**: `123456789.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abcdef123456`

## Step 5: Configure in Supabase

1. **Go to Supabase Dashboard** → **Authentication** → **Providers**
2. **Enable Google** provider
3. **Enter**:
   - **Client ID**: Your Google Client ID
   - **Client Secret**: Your Google Client Secret
4. **Site URL**: `http://localhost:5173` (for development)
5. **Redirect URLs**: `http://localhost:5173/auth/callback`

## Step 6: Update Your Domain Settings

In Supabase **Authentication** → **URL Configuration**:
- **Site URL**: `http://localhost:5173`
- **Redirect URLs**: `http://localhost:5173/auth/callback`

## ✅ Test Your Setup

1. Try the Google Sign-In button
2. Should redirect to Google OAuth consent screen
3. After approval, redirects back to your app
4. User should be automatically signed in

## 🚨 Common Issues & Solutions

### Issue: "Redirect URI mismatch"
- **Solution**: Make sure your redirect URI exactly matches what's in Google Cloud Console

### Issue: "provider is not enabled" 
- **Solution**: Ensure Google is enabled in Supabase and credentials are saved

### Issue: "Invalid client"
- **Solution**: Double-check Client ID and Secret are correctly entered

### Issue: Confirmation links point to localhost:3000
- **Solution**: Already fixed in the code - now uses correct current domain

## 📧 Email Confirmation Setup

The system now properly:
- ✅ Shows 24-hour expiry time for confirmation links
- ✅ Uses correct redirect URLs based on current domain  
- ✅ Has improved contrast for better accessibility
- ✅ Handles rate limiting with countdown timers
- ✅ Provides clear error messages for network issues

## 🎯 Next Steps

Once Google OAuth is working:
1. **Test email/password auth** 
2. **Test Google OAuth**
3. **Verify email confirmation flow**
4. **Ready for Phase 3: Backend Integration!**