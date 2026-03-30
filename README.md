<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This repository is configured to deploy to GitHub Pages through [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

Saved examples are stored in the browser with `localStorage`, so the app stays compatible with static hosting.

View your app in AI Studio: https://ai.studio/apps/2dbe04c3-5e89-4176-b527-c28474821221

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Preview the production build

1. Build the site:
   `npm run build`
2. Preview the static output:
   `npm run preview -- --host 0.0.0.0 --port 4173`

## Deploy to GitHub Pages

Push to `main` to trigger the Pages workflow and publish the contents of `dist/`.
