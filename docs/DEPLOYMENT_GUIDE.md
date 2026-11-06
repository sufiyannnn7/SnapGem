# Netlify & Vercel Deployment Guide

This guide walks through deploying the SnapGem application to Netlify or Vercel in production.

---

## 1. Prerequisites

1. Active Supabase project with environment credentials:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Netlify account connected to GitHub or Git repository.

---

## 2. Netlify Deployment Steps

1. **Connect Repository**:
   - Go to [Netlify Dashboard](https://app.netlify.com) and click **"Add new site" -> "Import an existing project"**.
   - Select your Git repository.

2. **Build Settings**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

3. **Environment Variables**:
   - Navigate to **Site Settings -> Environment variables** and add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_WHATSAPP_NUMBER`

4. **SPA Single Page App Rewrites**:
   - The included `netlify.toml` automatically handles client-side route redirects:
     ```toml
     [[redirects]]
       from = "/*"
       to = "/index.html"
       status = 200
     ```

5. **Deploy Site**:
   - Click **Deploy Site**. Netlify will build the production assets in under 1 minute.

---

## 3. Post-Deployment QA Checklist

- [x] Admin Login works at `/admin/login`.
- [x] WhatsApp Checkout formats invoice and opens `https://wa.me/` correctly.
- [x] Direct product page reloads do not return 404.
- [x] Customer storefront loads active homepage sections from Supabase.
