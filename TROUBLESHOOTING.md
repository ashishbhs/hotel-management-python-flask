# Troubleshooting Guide - Vercel Deployment

## Current Issue
Getting `FUNCTION_INVOCATION_FAILED` error on Vercel production deployment.

## Root Cause
The Python serverless functions are crashing, most likely due to:
1. Missing environment variables in Vercel
2. Incorrect Supabase credentials
3. Python runtime compatibility issues

## Solution Steps

### Step 1: Verify Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project (`hotel-management-python-flask`)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables for **Production**, **Preview**, and **Development**:
   - `SUPABASE_URL` = your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
   - `SUPABASE_SERVICE_KEY` = your Supabase service role key (starts with `eyJ...`)

**IMPORTANT**: After adding environment variables, you MUST redeploy:
```bash
vercel --prod
```

### Step 2: Test Locally First

Before deploying to Vercel, test locally to ensure everything works:

```bash
# Make sure Flask server is running
python app.py

# Open browser to http://127.0.0.1:5000
# Check if the app loads and API calls work
```

If local testing works, the issue is definitely with Vercel environment variables.

### Step 3: Check Supabase Credentials

Verify your `.env` file has the correct credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...your-service-key
```

You can find these in your Supabase dashboard:
- Go to https://supabase.com/dashboard
- Select your project
- Settings → API
- Copy the URL and service_role key (NOT the anon key)

### Step 4: View Vercel Function Logs

To see the exact error:
1. Go to your Vercel project dashboard
2. Click on the latest deployment
3. Go to **Functions** tab
4. Click on any of the failing functions (guests, rooms, bookings)
5. View the error logs

### Step 5: Redeploy After Fixing

Once environment variables are set:
```bash
vercel --prod
```

## Alternative: Use Local Flask Server

If Vercel deployment continues to have issues, you can use the local Flask server for development:

```bash
python app.py
```

This works perfectly on Windows and has all the same functionality as the Vercel deployment.

## Common Errors

### "module 'socket' has no attribute 'AF_UNIX'"
- This is a Windows + `vercel dev` issue
- Solution: Use `python app.py` for local development instead

### "FUNCTION_INVOCATION_FAILED"
- Missing or incorrect environment variables in Vercel
- Solution: Add environment variables in Vercel dashboard and redeploy

### "Supabase connection error"
- Incorrect Supabase credentials
- Solution: Verify SUPABASE_URL and SUPABASE_SERVICE_KEY are correct

## Next Steps

1. ✅ Set environment variables in Vercel dashboard
2. ✅ Redeploy with `vercel --prod`
3. ✅ Test the production URL
4. ✅ If still failing, check Vercel function logs for specific error

If you continue to have issues, please share:
- The exact error from Vercel function logs
- Your Supabase project URL (without the key)
- Whether local testing with `python app.py` works
