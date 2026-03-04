# FlacronControl — Complete Deployment Guide

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  RENDER                                                          │
│                                                                  │
│  ┌─────────────────────────────┐  ┌────────────────────────────┐│
│  │  flacron-frontend           │  │  flacron-voice-bridge      ││
│  │  Static Site (React + Vite) │  │  Web Service (WebSocket)   ││
│  │  Auto-deploys on git push   │  │  Twilio <-> OpenAI bridge  ││
│  └─────────────────────────────┘  └────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  FIREBASE  (must stay here — Firestore triggers + PubSub)        │
│                                                                  │
│  Auth · Firestore · Storage · Cloud Functions                    │
│  (Stripe webhooks, AI chat, invoices, email, voice triggers)     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Install these tools before starting:

```bash
npm install -g firebase-tools     # Firebase CLI
```

Accounts needed:
- [Firebase Console](https://console.firebase.google.com) — project: `flacroncontrol`
- [Render](https://render.com) — free account works for static site
- [Stripe Dashboard](https://dashboard.stripe.com)
- [OpenAI Platform](https://platform.openai.com)
- [Twilio Console](https://console.twilio.com) — only if using Voice Agent feature
- [Brevo](https://app.brevo.com) — only if using email reminders

---

## STEP 1 — Firebase Cloud Functions

> These MUST be deployed to Firebase. They use Firestore triggers and PubSub
> schedules that cannot run on Render.

### 1.1 — Set Firebase Function Config (secrets)

Run these commands from the project root one by one:

```bash
firebase functions:config:set \
  openai.key="sk-proj-YOUR_OPENAI_KEY"

firebase functions:config:set \
  stripe.secret_key="sk_test_YOUR_STRIPE_SECRET" \
  stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"

firebase functions:config:set \
  twilio.account_sid="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  twilio.auth_token="YOUR_TWILIO_AUTH_TOKEN"

firebase functions:config:set \
  app.url="https://YOUR-RENDER-FRONTEND-URL.onrender.com"

firebase functions:config:set \
  brevo.api_key="YOUR_BREVO_API_KEY" \
  brevo.from_email="noreply@yourdomain.com" \
  brevo.from_name="FlacronControl"
```

> **Note:** `app.url` is your Render frontend URL. Set it after Step 2.
> You can update it later with the same command and redeploy functions.

### 1.2 — Install & Deploy

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

After deploy, Firebase will print function URLs like:
```
✔  functions[us-central1-stripeWebhook]: https://us-central1-flacroncontrol.cloudfunctions.net/stripeWebhook
✔  functions[us-central1-aiChat]: https://us-central1-flacroncontrol.cloudfunctions.net/aiChat
```

Save these URLs — you'll need them for Stripe and Twilio config.

### 1.3 — Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

---

## STEP 2 — Frontend on Render (Static Site)

### 2.1 — Connect Repo via Blueprint

1. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
2. Click **New Blueprint Instance**
3. Connect GitHub repo: `devkashaniqbal/FlacronConnect`
4. Render detects `render.yaml` automatically
5. Select the `flacron-frontend` service

### 2.2 — Environment Variables for Frontend

In Render dashboard → `flacron-frontend` → **Environment** tab, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyDNXPtapm9B4QX5zMqfOf5lRLIovCbp_I8` | Firebase config |
| `VITE_FIREBASE_AUTH_DOMAIN` | `flacroncontrol.firebaseapp.com` | Firebase config |
| `VITE_FIREBASE_PROJECT_ID` | `flacroncontrol` | Firebase config |
| `VITE_FIREBASE_STORAGE_BUCKET` | `flacroncontrol.firebasestorage.app` | Firebase config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `29609290916` | Firebase config |
| `VITE_FIREBASE_APP_ID` | `1:29609290916:web:ed7b0700acf9d9d66e4a31` | Firebase config |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-CMR0KZFF35` | Optional — Analytics |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_51T6dtW...` | From Stripe Dashboard |
| `VITE_OPENAI_API_KEY` | `sk-proj-...` | From OpenAI Platform |
| `VITE_WATSONX_API_KEY` | `mIC8vqaK...` | From IBM Cloud |
| `VITE_WATSONX_URL` | `https://us-south.ml.cloud.ibm.com` | IBM WatsonX |
| `VITE_WATSONX_PROJECT_ID` | `87ccf9e5-6957-4f9d-9982-04ec2df1345a` | IBM WatsonX |
| `VITE_GOOGLE_MAPS_API_KEY` | *(leave blank or add key)* | Optional — Route Planning |
| `VITE_APP_URL` | `https://your-app.onrender.com` | Your Render frontend URL |

### 2.3 — Build Settings (auto-detected from render.yaml)

| Setting | Value |
|---------|-------|
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Node Version | `20` |

### 2.4 — Add Firebase Authorized Domain

**CRITICAL — without this, all logins will fail.**

1. Go to [Firebase Console → Authentication → Settings](https://console.firebase.google.com/project/flacroncontrol/authentication/settings)
2. Click **Authorized domains** tab
3. Click **Add domain**
4. Add your Render URL: `your-app.onrender.com`

---

## STEP 3 — Voice Bridge on Render (Web Service)

> Only needed if you are using the Voice Agent feature (Pro/Enterprise plan).
> Skip this step if voice is not needed.

### 3.1 — Create Web Service

1. In Render dashboard → **New → Web Service**
2. Connect same GitHub repo: `devkashaniqbal/FlacronConnect`
3. Configure:

| Setting | Value |
|---------|-------|
| Name | `flacron-voice-bridge` |
| Root Directory | `voice-bridge` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Plan | **Starter ($7/mo)** — free plan spins down and breaks WebSockets |

### 3.2 — Environment Variables for Voice Bridge

| Variable | Value | Notes |
|----------|-------|-------|
| `OPENAI_API_KEY` | `sk-proj-...` | Must have Realtime API access |
| `PORT` | `8080` | Render sets this automatically |

### 3.3 — Update Twilio TwiML to Point at Bridge

After deploy, copy your bridge URL (e.g. `https://flacron-voice-bridge.onrender.com`).

In your Twilio console or agent config, set the Media Stream URL to:
```
wss://flacron-voice-bridge.onrender.com/media-stream?agentId=AGENT_ID&businessId=BIZ_ID
```

---

## STEP 4 — Stripe Webhook Setup

### 4.1 — Add Webhook Endpoint

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Endpoint URL:
   ```
   https://us-central1-flacroncontrol.cloudfunctions.net/stripeWebhook
   ```
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (`whsec_...`)
7. Update Firebase Functions config:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_YOUR_NEW_SECRET"
   firebase deploy --only functions
   ```

### 4.2 — Stripe Price IDs

Create products in Stripe Dashboard and get the Price IDs.
Update these in `src/constants/plans.ts`:

| Plan | Monthly Price ID |
|------|-----------------|
| Starter | `price_starter_monthly` |
| Pro | `price_pro_monthly` |
| Enterprise | `price_enterprise_monthly` |

---

## STEP 5 — Twilio Setup (Voice Feature Only)

### 5.1 — Get Credentials

From [Twilio Console](https://console.twilio.com):
- **Account SID:** `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Auth Token:** found on Console Dashboard

### 5.2 — Configure Firebase Functions

```bash
firebase functions:config:set \
  twilio.account_sid="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  twilio.auth_token="YOUR_AUTH_TOKEN"

firebase deploy --only functions
```

### 5.3 — Set Twilio Webhook URLs

In Twilio Console → Phone Numbers → your number → Voice config:

| Field | Value |
|-------|-------|
| A call comes in | `https://us-central1-flacroncontrol.cloudfunctions.net/twilioVoiceInbound` |
| Call status changes | `https://us-central1-flacroncontrol.cloudfunctions.net/twilioCallStatus` |

---

## STEP 6 — Brevo Email Setup (Optional)

For appointment reminders and invoice emails.

1. Create account at [brevo.com](https://app.brevo.com)
2. Go to **Settings → API Keys** → Generate API key
3. Set config:
   ```bash
   firebase functions:config:set \
     brevo.api_key="YOUR_BREVO_API_KEY" \
     brevo.from_email="noreply@yourdomain.com" \
     brevo.from_name="FlacronControl"
   firebase deploy --only functions
   ```
4. Verify your sender domain in Brevo to avoid emails going to spam

---

## STEP 7 — Final Checks

After all services are deployed, verify:

### Frontend
- [ ] App loads at your Render URL
- [ ] Signup creates a new user in Firebase Auth console
- [ ] Login works and redirects to dashboard
- [ ] No CORS errors in browser console

### Firebase Functions
- [ ] All functions visible in [Firebase Console → Functions](https://console.firebase.google.com/project/flacroncontrol/functions)
- [ ] No errors in [Firebase Functions Logs](https://console.firebase.google.com/project/flacroncontrol/functions/logs)

### Firestore
- [ ] After signup, user doc created under `/users/{uid}` with correct `businessId`
- [ ] Business doc created under `/businesses/biz_{uid}`
- [ ] Data is isolated — logging in as user A shows no data from user B

### Stripe
- [ ] Test checkout with card `4242 4242 4242 4242`, exp `12/30`, CVC `123`
- [ ] Webhook receives events (check Stripe Dashboard → Webhooks → your endpoint)
- [ ] Plan updates in Firestore after successful subscription

---

## Auto-Deploy on Push

Once connected to Render, every `git push` to `main` triggers an automatic redeploy:

```bash
# Make changes, then:
git add .
git commit -m "your message"
git push origin main
# Render auto-deploys in ~2 minutes
```

---

## Environment Variables — Quick Reference

### Frontend (Render Static Site)

```env
VITE_FIREBASE_API_KEY=AIzaSyDNXPtapm9B4QX5zMqfOf5lRLIovCbp_I8
VITE_FIREBASE_AUTH_DOMAIN=flacroncontrol.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=flacroncontrol
VITE_FIREBASE_STORAGE_BUCKET=flacroncontrol.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=29609290916
VITE_FIREBASE_APP_ID=1:29609290916:web:ed7b0700acf9d9d66e4a31
VITE_FIREBASE_MEASUREMENT_ID=G-CMR0KZFF35
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51T6dtW...
VITE_OPENAI_API_KEY=sk-proj-...
VITE_WATSONX_API_KEY=mIC8vqaK...
VITE_WATSONX_URL=https://us-south.ml.cloud.ibm.com
VITE_WATSONX_PROJECT_ID=87ccf9e5-6957-4f9d-9982-04ec2df1345a
VITE_APP_URL=https://your-app.onrender.com
```

### Voice Bridge (Render Web Service)

```env
OPENAI_API_KEY=sk-proj-...
PORT=8080
```

### Firebase Functions Config (via firebase functions:config:set)

```
openai.key              → sk-proj-...
stripe.secret_key       → sk_test_... or sk_live_...
stripe.webhook_secret   → whsec_...
twilio.account_sid      → ACxxxxxx...
twilio.auth_token       → your_auth_token
app.url                 → https://your-app.onrender.com
brevo.api_key           → your_brevo_key
brevo.from_email        → noreply@yourdomain.com
brevo.from_name         → FlacronControl
```

---

## Switching to Production (Go Live)

When ready to go live, swap test keys for live keys:

1. **Stripe:** Replace `pk_test_` → `pk_live_` and `sk_test_` → `sk_live_`
2. **Firebase:** No change needed — same project
3. **OpenAI:** Same key works for both test and production
4. **Twilio:** Consider upgrading to a paid plan for production call volume
5. **Render:** Upgrade voice bridge from Starter to Standard if you expect high WebSocket traffic

---

## Support & Troubleshooting

| Problem | Solution |
|---------|----------|
| Login fails with auth/unauthorized-domain | Add Render URL to Firebase Authorized Domains (Step 2.4) |
| Functions not found (404) | Run `firebase deploy --only functions` |
| Stripe webhook fails (400) | Check `stripe.webhook_secret` matches Stripe Dashboard signing secret |
| Voice bridge disconnects | Upgrade Render plan from Free to Starter (free plan spins down) |
| All users see same data | Confirm Firestore rules are deployed: `firebase deploy --only firestore:rules` |
| CORS error on API calls | Firebase Callable Functions handle CORS automatically — check function logs |
| Build fails on Render | Check Node version is 20 in Render settings |
