# Custom Domain Setup for app.metaboliclongcovidconsulting.com

## Step 1: Configure Domain in Netlify Dashboard

1. **Go to your Netlify site dashboard**:
   - Visit [app.netlify.com](https://app.netlify.com)
   - Find your `longcovidtracker` site
   - Click on it to open the site dashboard

2. **Add Custom Domain**:
   - Go to **Site settings** > **Domain management**
   - Click **"Add custom domain"**
   - Enter: `app.metaboliclongcovidconsulting.com`
   - Click **"Verify"** and then **"Add domain"**

## Step 2: Configure DNS Settings

You need to update your DNS settings with your domain registrar (where you bought `metaboliclongcovidconsulting.com`).

### Option A: CNAME Record (Recommended)

Add a CNAME record:
- **Name/Host**: `app`
- **Value/Target**: `longcovidtracker.netlify.app` (your current Netlify subdomain)
- **TTL**: 3600 (or Auto)

### Option B: A Record (Alternative)

If CNAME doesn't work, use A records pointing to Netlify's load balancer:
- **Name/Host**: `app`
- **Value**: `75.2.60.5`
- **TTL**: 3600

## Step 3: Enable HTTPS

1. **In Netlify Dashboard**:
   - Go to **Site settings** > **Domain management**
   - Find your custom domain in the list
   - Wait for DNS to propagate (can take up to 24 hours)
   - Once DNS is verified, Netlify will automatically provision an SSL certificate

2. **Force HTTPS** (recommended):
   - In the same Domain management section
   - Enable **"Force HTTPS"** to redirect all HTTP traffic to HTTPS

## Step 4: Update CNAME File (Optional)

If you want to ensure the custom domain is properly configured, you can update the CNAME file: