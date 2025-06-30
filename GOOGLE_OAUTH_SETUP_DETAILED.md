# 🔐 Complete Google OAuth Setup Guide

## 🎯 Quick Setup (5 Minutes)

### Step 1: Create Google Cloud Project
1. **Visit**: https://console.cloud.google.com/
2. **Click**: "New Project" (top-left dropdown)
3. **Name**: "GenesisOS-Auth"
4. **Click**: "Create"

### Step 2: Enable Required APIs
1. **Go to**: APIs & Services → Library
2. **Search**: "Google+ API"
3. **Click**: "Google+ API" → "Enable"

### Step 3: Create OAuth 2.0 Credentials
1. **Go to**: APIs & Services → Credentials
2. **Click**: "+ Create Credentials" → "OAuth client ID"
3. **First time?**: Click "Configure Consent Screen"
   - **User Type**: External
   - **App Name**: GenesisOS
   - **User support email**: Your email
   - **Developer email**: Your email
   - **Click**: Save and Continue (through all steps)

4. **Create OAuth Client**:
   - **Application type**: Web application
   - **Name**: GenesisOS Web Client

### Step 4: Configure URLs (CRITICAL!)

**Authorized JavaScript origins**:
```
http://localhost:5173
```

**Authorized redirect URIs**:
```
https://atnmspufnvgfxhilemsd.supabase.co/auth/v1/callback
```

**Click**: Create

### Step 5: Copy Your Credentials
You'll see a popup with:
- **Client ID**: `123456789-abcdef.apps.googleusercontent.com`
- **Client secret**: `GOCSPX-abcdef123456`

**COPY BOTH** - you need them for Supabase!

### Step 6: Configure Supabase
1. **Go to**: https://supabase.com/dashboard/project/atnmspufnvgfxhilemsd
2. **Navigate**: Authentication → Providers
3. **Find**: Google (should show toggle)
4. **Enable**: Toggle ON
5. **Enter**:
   - **Client ID**: Your Google Client ID (from Step 5)
   - **Client Secret**: Your Google Client Secret (from Step 5)
6. **Click**: Save

### Step 7: Verify Supabase URLs
In **Authentication** → **URL Configuration**:
- **Site URL**: `http://localhost:5173`
- **Redirect URLs**: `http://localhost:5173/auth/callback`

**Save if changed**.

## ✅ Test Your Setup

1. **Restart your dev server**: `npm run dev`
2. **Click "Continue with Google"** button
3. **Should redirect** to Google login
4. **After login**: Should redirect back to your app
5. **User should be signed in** automatically

## 🚨 Troubleshooting Common Issues

### ❌ "redirect_uri_mismatch"
**Solution**: Check Step 4 - URLs must match EXACTLY
- Google Cloud Console URIs
- Supabase redirect configuration

### ❌ "provider is not enabled"
**Solution**: 
1. Go to Supabase Dashboard
2. Authentication → Providers
3. Ensure Google toggle is ON
4. Client ID & Secret are entered
5. Click Save

### ❌ "invalid_client"
**Solution**: 
- Double-check Client ID in Supabase
- Ensure no extra spaces/characters

### ❌ "Failed to fetch" / Network errors
**Solution**: This is now fixed in the code with:
- Enhanced error handling
- Better connection testing
- Clearer error messages

## 🎉 Success Indicators

When working correctly, you'll see:
- ✅ Google button appears and is clickable
- ✅ Clicking redirects to Google OAuth page
- ✅ After Google login, redirects back to GenesisOS
- ✅ User automatically signed in
- ✅ No console errors

## 📧 Email Confirmation Notes

The updated system now:
- ✅ **24-hour expiry warnings** on confirmation emails
- ✅ **Perfect contrast** - White text on dark backgrounds
- ✅ **Rate limiting** with countdown timers (20 seconds)
- ✅ **Domain detection** - No more localhost:3000 issues!
- ✅ **Network error handling** with retry options
- ✅ **Spam folder reminders** for users

## 🔐 Security Notes

Your current setup:
- ✅ **Supabase URL**: `https://atnmspufnvgfxhilemsd.supabase.co`
- ✅ **Callback URL**: `https://atnmspufnvgfxhilemsd.supabase.co/auth/v1/callback` (CORRECT!)
- ✅ **Environment Variables**: All properly configured
- ✅ **CORS Settings**: Configured for development

## 🚀 Ready for Phase 3!

Once Google OAuth works:
1. ✅ **Email/Password Auth** - Working
2. ✅ **Google OAuth** - Working (after setup)
3. ✅ **Email Confirmation** - Perfect UX
4. ✅ **Error Handling** - Robust
5. 🎯 **Phase 3: Backend Integration** - READY!

**Let me know when Google OAuth is working and we'll move to Phase 3!** 🚀