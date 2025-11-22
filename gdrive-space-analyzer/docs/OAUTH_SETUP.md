# 🔐 Google OAuth Setup Guide

Complete guide to setting up Google OAuth credentials for Google Drive Space Analyzer.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step-by-Step Setup](#step-by-step-setup)
- [Configure OAuth Consent Screen](#configure-oauth-consent-screen)
- [Create OAuth Credentials](#create-oauth-credentials)
- [Download and Install Credentials](#download-and-install-credentials)
- [First-Time Authentication](#first-time-authentication)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

---

## Overview

Google Drive Space Analyzer requires OAuth 2.0 credentials to access your Google Drive. This guide walks you through creating these credentials in Google Cloud Console.

**What you'll need:**
- A Google account
- 10-15 minutes
- Web browser

**Scopes used:**
- `https://www.googleapis.com/auth/drive.readonly`
- `https://www.googleapis.com/auth/drive.metadata.readonly`

**Important**: These are **read-only** scopes. The application **cannot** modify or delete your files.

---

## Prerequisites

1. **Google Account**: You need a Google account (free or Workspace)
2. **Google Cloud Project**: You'll create one (free)
3. **Application Installed**: Complete [INSTALL.md](INSTALL.md) first

---

## Step-by-Step Setup

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Accept Terms of Service if prompted

### Step 2: Create a New Project

1. Click the **project dropdown** at the top of the page
2. Click **"New Project"**
3. Enter project details:
   - **Project name**: `GDrive Analyzer` (or any name you prefer)
   - **Organization**: Leave as "No organization" (for personal use)
4. Click **"Create"**
5. Wait for project creation (takes ~30 seconds)
6. Select your new project from the dropdown

---

## Configure OAuth Consent Screen

Before creating credentials, you must configure the OAuth consent screen.

### Step 1: Navigate to OAuth Consent Screen

1. In the left sidebar, go to **"APIs & Services"** > **"OAuth consent screen"**
2. Click **"Configure Consent Screen"**

### Step 2: Choose User Type

**For Personal Use:**
- Select **"External"** (allows any Google account)
- Click **"Create"**

**For Organization/Workspace:**
- Select **"Internal"** (only for your organization)
- Click **"Create"**

### Step 3: Fill App Information

**App Information:**
- **App name**: `Google Drive Space Analyzer`
- **User support email**: Your email
- **App logo**: (Optional) Upload logo

**App Domain (Optional):**
- Leave blank for personal use

**Developer contact information:**
- **Email addresses**: Your email

Click **"Save and Continue"**

### Step 4: Configure Scopes

1. Click **"Add or Remove Scopes"**
2. Search for and select:
   - ✅ `../auth/drive.readonly` (View files in your Google Drive)
   - ✅ `../auth/drive.metadata.readonly` (View metadata)
3. Click **"Update"**
4. Click **"Save and Continue"**

### Step 5: Test Users (External Apps Only)

If you selected "External" user type:

1. Click **"Add Users"**
2. Add your Google account email
3. Click **"Add"**
4. Click **"Save and Continue"**

**Note**: In testing mode, only these users can use the app. To publish (optional), click "Publish App" later.

### Step 6: Summary

Review and click **"Back to Dashboard"**

---

## Create OAuth Credentials

### Step 1: Enable Google Drive API

1. Go to **"APIs & Services"** > **"Library"**
2. Search for **"Google Drive API"**
3. Click on it
4. Click **"Enable"**
5. Wait for activation (~30 seconds)

### Step 2: Create OAuth Client ID

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ Create Credentials"** at the top
3. Select **"OAuth client ID"**

### Step 3: Configure OAuth Client

**Application type:**
- Select **"Desktop app"**

**Name:**
- Enter: `GDrive Analyzer Desktop`

Click **"Create"**

### Step 4: Credentials Created

You'll see a dialog: **"OAuth client created"**

- **Client ID**: `xxxxxxxxxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`

**Important**: Don't share these! They're like passwords.

Click **"Download JSON"** button

---

## Download and Install Credentials

### Step 1: Locate Downloaded File

The file will be named something like:
```
client_secret_XXXXXXXXXXXXX.apps.googleusercontent.com.json
```

It's usually in your `~/Downloads` folder.

### Step 2: Install Credentials

**Method 1: Using terminal**

```bash
# Create config directory
mkdir -p ~/.config/gdrive-analyzer

# Copy downloaded file
cp ~/Downloads/client_secret_*.json ~/.config/gdrive-analyzer/client_secret.json

# Verify
ls -la ~/.config/gdrive-analyzer/client_secret.json
```

**Method 2: Using file manager**

1. Open file manager
2. Press `Ctrl+H` to show hidden files
3. Navigate to home folder
4. Open `.config` folder (create if doesn't exist)
5. Create `gdrive-analyzer` folder
6. Copy JSON file into it
7. Rename to `client_secret.json`

### Step 3: Verify File Format

```bash
# Check file content
cat ~/.config/gdrive-analyzer/client_secret.json
```

Should look like:
```json
{
  "installed": {
    "client_id": "xxxxx.apps.googleusercontent.com",
    "project_id": "your-project",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "GOCSPX-xxxxx",
    "redirect_uris": ["http://localhost"]
  }
}
```

---

## First-Time Authentication

### Step 1: Launch Application

```bash
python -m src.main
```

### Step 2: Add Account

1. Click **"Add Account"** button in the application
2. Browser will open automatically
3. You'll see Google OAuth consent screen

### Step 3: Authenticate

1. **Choose your Google account**
2. You may see a warning: **"Google hasn't verified this app"**
   - Click **"Advanced"**
   - Click **"Go to Google Drive Space Analyzer (unsafe)"**
   - This is normal for unpublished apps
3. Review permissions:
   - ✅ View files in Google Drive
   - ✅ View metadata of files
4. Click **"Allow"**

### Step 4: Success

1. Browser shows: **"The authentication flow has completed. You may close this window."**
2. Return to the application
3. Your account is now added
4. Scan starts automatically

---

## Troubleshooting

### Issue: "Error 400: redirect_uri_mismatch"

**Cause**: Redirect URI not configured correctly

**Solution**:
1. Go to Google Cloud Console > Credentials
2. Click on your OAuth client
3. Under "Authorized redirect URIs", add:
   - `http://localhost:8080`
   - `http://localhost:8080/`
4. Save and try again

### Issue: "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen not configured

**Solution**:
1. Complete OAuth consent screen configuration
2. Add your email as test user
3. Try again

### Issue: "Error 403: access_denied"

**Cause**: User not added to test users list

**Solution**:
1. Go to OAuth consent screen
2. Add your email under "Test users"
3. Save and try again

### Issue: "File 'client_secret.json' not found"

**Cause**: Credentials file not in correct location

**Solution**:
```bash
# Check current location
find ~ -name "client_secret*.json" 2>/dev/null

# Move to correct location
mv /path/to/file ~/.config/gdrive-analyzer/client_secret.json
```

### Issue: "Invalid client_secret.json format"

**Cause**: File corrupted or wrong format

**Solution**:
1. Re-download from Google Cloud Console
2. Don't edit the file manually
3. Verify JSON is valid:
   ```bash
   python -m json.tool ~/.config/gdrive-analyzer/client_secret.json
   ```

---

## Security Best Practices

### ✅ DO

- **Keep credentials private**: Never share `client_secret.json`
- **Use read-only scopes**: App only needs read access
- **Use test users**: Start with limited users
- **Regenerate if leaked**: Create new credentials if exposed
- **Use different projects**: Separate dev/prod credentials

### ❌ DON'T

- **Don't commit to git**: Add to `.gitignore`
- **Don't share publicly**: Never post online
- **Don't use in multiple apps**: One project per app
- **Don't give write permissions**: Stick to read-only

### Rotating Credentials

If you suspect credentials are compromised:

1. Go to Google Cloud Console > Credentials
2. Click the **trash icon** next to your OAuth client
3. Confirm deletion
4. Create new OAuth client (follow steps above)
5. Download new `client_secret.json`
6. Replace old file

---

## Publishing Your App (Optional)

By default, your app is in "Testing" mode (max 100 users).

**To publish:**

1. Go to OAuth consent screen
2. Click **"Publish App"**
3. Click **"Confirm"**

**Verification (if required):**

For apps requesting sensitive scopes, Google may require verification. This is not needed for personal use.

---

## Multiple Google Accounts

You can use different Google accounts with the same OAuth client:

1. Each user authorizes individually
2. Tokens stored separately in keyring
3. No limit on number of accounts

---

## Workspace Accounts

**For Google Workspace domains:**

1. Admin must enable API access:
   - Admin Console > Security > API Controls
   - Enable "Allow users to access third-party apps"
2. May need admin to approve app

---

## API Quotas

**Free Tier Limits (per project):**
- 1,000,000,000 queries/day (more than enough)
- 10,000 queries/100 seconds per user

**Staying within limits:**
- App uses smart caching
- Batch requests when possible
- Configurable cache TTL

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Reference](https://developers.google.com/drive/api/v3/reference)
- [OAuth Consent Screen Guidelines](https://support.google.com/cloud/answer/10311615)

---

## Support

Need help?
- [GitHub Issues](https://github.com/flamstyl/gdrive-space-analyzer/issues)
- [GitHub Discussions](https://github.com/flamstyl/gdrive-space-analyzer/discussions)

---

**Last Updated**: 2025-01-22
