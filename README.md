# 💀 PHANTOM CMO — AI Marketing Intelligence Oracle

AI-powered marketing strategy agent. Input two URLs + industry + goal → get ICP, competitor gap analysis, 30-day blueprint, and killer content hooks.

---

## Architecture

```
[index.html → GitHub Pages]
        ↓  POST /analyze
[backend/server.js → Render.com]
        ↓  POST /v1/messages
[Anthropic API + Web Search]
```

---

## Deployment Steps

### Step 1 — Push to GitHub

1. Create a new repo on GitHub called `phantom-cmo`
2. Push this entire folder to it
3. Go to **Settings → Pages → Source: main branch / root**
4. GitHub Pages URL will be: `https://YOURUSERNAME.github.io/phantom-cmo`

### Step 2 — Deploy Backend to Render

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npm start`
6. Under **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your key from console.anthropic.com

Render will give you a URL like: `https://phantom-cmo-backend.onrender.com`

### Step 3 — Connect Frontend to Backend

In `index.html`, find this line:

```javascript
const BACKEND_URL = 'https://YOUR-APP-NAME.onrender.com';
```

Replace with your actual Render URL. Commit and push.

### Step 4 — Done ✓

Visit your GitHub Pages URL and test it.

---

## Industries Supported

Real Estate · Fashion & Luxury · Food & Beverage · Fitness & Health ·
Finance & Crypto · Tech & SaaS · E-commerce · Travel & Hospitality ·
Education · Media & Entertainment · Healthcare · Automotive ·
Sports & Gaming · Beauty & Cosmetics · Legal & Professional ·
Solar & Energy · Logistics · Restaurants

---

## Local Testing

```bash
cd backend
cp .env.example .env
# Add your API key to .env
npm install
npm run dev
```

Then open `index.html` in a browser (or use Live Server).
Update `BACKEND_URL` to `http://localhost:3000` for local testing.
