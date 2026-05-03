# Deployment Fix Plan - Cloudflare Pages PWA

Status: Approved by user. Breakdown into steps.

## 1. Cloudflare Dashboard Config (Manual - User Action)

- [ ] Go to Cloudflare Pages project (name: ekinerja-pro?)
- [ ] Settings > Build & deployments:
  - Framework preset: None
  - Build command: (empty)
  - Build output directory: `./` (root)
- [ ] Save & trigger redeploy
- [ ] Caching > Configuration > Purge Everything

## 2. Local File Updates (AI Actions - Done/In Progress)

- [x] Create \_headers for optimal caching
- [x] Create \_redirects for SPA routing
- [x] Update service-worker.js (cache v1→v2, skipWaiting/clients.claim, nav fixes)
- [ ] Commit & push to GitHub (triggers auto-deploy)

## 3. Verification

- [ ] Test URL after deploy
- [ ] DevTools > Application > SW > Update on reload
- [ ] Force purge browser cache (Ctrl+Shift+R)

## 4. CLI Commands (Optional)

```
# Install wrangler if needed
npm create cloudflare@latest my-app
npx wrangler login

# Publish direct
npx wrangler pages publish . --project-name=ekinerja-pro
```

Next steps after this: Test & attempt_completion.
