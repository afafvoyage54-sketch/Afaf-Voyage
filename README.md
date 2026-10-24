<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/6c213e27-b16a-418d-8c43-7c523e287f14

## Run Locally

Prerequisites: Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY : "AIzaSyBXB6aRPSPVccbkWzd-j-GRydmFuBvPV6o"` in `.env.local` to your Gemini API key:
   ```env
   GEMINI_API_KEY="AIzaSyBXB6aRPSPVccbkWzd-j-GRydmFuBvPV6o"
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Deploy Online

### Option A: Deploy to Vercel (Recommended & Quickest)

1. Push this project to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"** -> import your GitHub repository.
3. Vercel automatically detects the **Vite** framework:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In **Environment Variables**, add:
   - Key: `GEMINI_API_KEY`
   - Value: `AIzaSyBXB6aRPSPVccbkWzd-j-GRydmFuBvPV6o`
5. Click **Deploy**. The `vercel.json` already included in this repository handles routing automatically.

---

### Option B: Deploy to Firebase Hosting

Since this project already has Firebase integrated:

1. Install the Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```
2. Log in and select your Firebase project:
   ```bash
   firebase login
   firebase use gen-lang-client-0678836362
   ```
3. Build the app with your environment variable:
   ```bash
   export GEMINI_API_KEY="AIzaSyBXB6aRPSPVccbkWzd-j-GRydmFuBvPV6o"
   npm run build
   ```
4. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```
   The `firebase.json` configuration file is already set up to deploy the `dist/` directory with single-page app rewrites.
