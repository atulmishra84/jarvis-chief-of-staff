# JARVIS — Chief of Staff (Vercel Edition)

## Deploy to Vercel in 4 steps

### Step 1 — Push to GitHub
1. Go to github.com → New repository → name it `jarvis-chief-of-staff`
2. Upload all files from this zip keeping the folder structure:
   ```
   vercel.json
   package.json
   api/
     status.js
     chat.js
     triage/run.js
     triage/action.js
     meetings/run.js
     connectors/microsoft365.js
     connectors/fathom.js
   public/
     index.html
   ```

### Step 2 — Import to Vercel
1. Go to vercel.com → New Project
2. Import from GitHub → select `jarvis-chief-of-staff`
3. Framework preset: **Other** (not Next.js)
4. Click Deploy

### Step 3 — Add Environment Variables
In Vercel project → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | Your key from console.anthropic.com |
| `YOUR_NAME` | Your full name |
| `YOUR_ROLE` | Your job title |
| `MS_CLIENT_ID` | Add when ready |
| `MS_CLIENT_SECRET` | Add when ready |
| `MS_TENANT_ID` | Add when ready |
| `MS_USER_EMAIL` | Add when ready |
| `FATHOM_API_KEY` | Add when ready |

### Step 4 — Redeploy
After adding environment variables → Deployments → Redeploy

Your JARVIS is live at: `https://jarvis-chief-of-staff.vercel.app`

## API Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/status` | GET | System status |
| `/api/chat` | POST | Voice assistant proxy |
| `/api/triage/run` | POST | Fetch + classify emails |
| `/api/triage/action` | POST | Approve or rewrite draft |
| `/api/meetings/run` | POST | Fetch + process meeting transcripts |

## Voice activation
- Say **"Hey JARVIS"** followed by your command
- Or click the orb icon in the top-right corner
- Or press **Space** to push-to-talk
- Requires Chrome or Edge browser
# jarvis-chief-of-staff
