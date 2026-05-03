# 🔄 GitHub Actions Setup untuk Auto-Deployment

## 📋 Prerequisites

1. GitHub repository dengan project ini
2. Cloudflare account dengan Pages enabled
3. API Token dari Cloudflare

---

## 🔑 SETUP SECRETS DI GITHUB

### Step 1: Get Cloudflare Credentials

#### Get Account ID:

1. Login ke https://dash.cloudflare.com/
2. Klik profile icon (top-right) → **Accounts**
3. Copy **Account ID**

#### Get API Token:

1. Cloudflare Dashboard → **Account Home** (top-left)
2. Scroll down → **API Tokens** section
3. Klik **Create Token** → Choose **Edit Cloudflare Workers**
4. Copy token (it's your `CLOUDFLARE_API_TOKEN`)

### Step 2: Add Secrets ke GitHub

1. Go to GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

```
Name: CLOUDFLARE_API_TOKEN
Value: (paste your Cloudflare API token)

Name: CLOUDFLARE_ACCOUNT_ID
Value: (paste your Account ID)
```

---

## ✅ VERIFY SETUP

### Check Workflow Status

1. Go to GitHub repository
2. **Actions** tab
3. Should see "🚀 Deploy to Cloudflare Pages" workflow

### Test Deployment

```bash
# Make a small change and push
echo "# Test" >> README.md
git add README.md
git commit -m "test: Trigger workflow"
git push origin main

# Watch in GitHub Actions tab
# Should see workflow running
```

---

## 📝 WORKFLOW EXPLANATION

### On Push to main

```yaml
on:
  push:
    branches:
      - main # Deploy on push to main
      - master # Or master
      - develop # Or develop
```

→ Automatically deploys when you push to these branches

### Build Steps

1. **Checkout** → Get latest code
2. **Setup Node** → Install Node.js
3. **Install** → Run `npm ci`
4. **Build** → Run `npm run build`
5. **Verify** → Check important files exist
6. **Deploy** → Upload to Cloudflare Pages

### Pull Request Comments

Workflow automatically comments on PRs dengan deployment status dan preview URL

---

## 🚀 DEPLOYMENT PROCESS

### Manual Trigger (Optional)

Untuk trigger deployment tanpa push:

1. Go to **Actions** tab
2. Select "🚀 Deploy to Cloudflare Pages"
3. Click **Run workflow** → **Run workflow**

### Auto-Deploy Workflow

```
git push origin main
        ↓
GitHub detects push
        ↓
Workflow triggered automatically
        ↓
Checkout + Build + Test
        ↓
Deploy to Cloudflare Pages
        ↓
Deployment complete ✅
        ↓
Comment added to PR (if PR)
```

---

## 🐛 TROUBLESHOOTING

### Workflow Failed - Check Logs

1. **Actions** tab → Click failed workflow
2. Expand job to see error
3. Common issues:

#### ❌ "CLOUDFLARE_API_TOKEN not found"

**Solution:** Add secret ke GitHub (see Setup Secrets)

#### ❌ "index.html not found"

**Solution:** Make sure file di root repository

#### ❌ "accountId is invalid"

**Solution:** Check CLOUDFLARE_ACCOUNT_ID in secrets

#### ❌ "Build failed"

**Solution:** Check `npm run build` output locally

### Manual Debug

```bash
# Test locally
npm install
npm run build
ls -la index.html
ls -la _redirects
```

---

## 📊 MONITORING

### View Deployment History

1. Cloudflare Dashboard → **Pages** → **ekinerja-pro**
2. **Deployments** tab → See all deployments
3. Click deployment → View build logs

### View Workflow Runs

1. GitHub → **Actions** tab
2. See all workflow runs with status
3. Click run → See detailed logs

---

## 🔄 CONTINUOUS INTEGRATION

Workflow includes:

- ✅ Automatic testing (npm run build)
- ✅ Build verification
- ✅ File validation
- ✅ Deployment to Cloudflare Pages
- ✅ PR comments with status
- ✅ Slack notifications (optional)

---

## 💡 ADVANCED OPTIONS

### Deploy to Different Project

Edit `.github/workflows/deploy.yml`:

```yaml
projectName: your-project-name # Change this
```

### Add Environment Variables

```yaml
env:
  NODE_ENV: production
  VERSION: 2.1.0
```

### Only Deploy on Release Tags

```yaml
on:
  push:
    tags:
      - "v*" # Only deploy on version tags
```

### Slack Notifications

Add secret `SLACK_WEBHOOK` untuk Slack alerts

---

## 🎯 DEPLOYMENT CHECKLIST

- [ ] Cloudflare API Token added to GitHub Secrets
- [ ] Cloudflare Account ID added to GitHub Secrets
- [ ] `_redirects` file exists in repository
- [ ] `service-worker.js` exists
- [ ] `index.html` in repository root
- [ ] `package.json` dengan `build` script
- [ ] Test deployment dengan push ke main

---

## 📞 QUICK REFERENCE

| Task              | Command                                |
| ----------------- | -------------------------------------- |
| Deploy manually   | Push to `main` or use **Run workflow** |
| Check status      | GitHub **Actions** tab                 |
| View logs         | Click failed workflow → Expand logs    |
| Verify deployment | Visit https://ekinerja-pro.pages.dev   |

---

**Setup Complete! 🎉**

Semua deployment sekarang otomatis via GitHub Actions → Cloudflare Pages

Next: Push code dan monitor workflow di GitHub Actions tab
