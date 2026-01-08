# FlowXtate - Cloudflare Pages Deployment

## Quick Deploy

Your FlowXtate app is built and ready to deploy to Cloudflare Pages.

### Option 1: Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
2. Click "Create a project"
3. Choose "Upload assets"
4. Upload the entire `out` directory
5. Your site will be live at `https://your-project.pages.dev`

### Option 2: Wrangler CLI

```bash
# Install Wrangler (if not already installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy out --project-name=flowxtate
```

## Build Info

- **Framework**: Next.js 16 (Static Export)
- **Build Output**: `/out` directory
- **Build Command**: `npm run build`
- **Output Mode**: Static (no server-side rendering)

## Important Notes

- All data is stored in browser localStorage (client-side only)
- Crossmark wallet extension required for XRPL transactions
- Currently configured for XRPL Testnet
- Seeds/private keys are stored in localStorage (demo only - not production safe)

## Continuous Deployment

To set up automatic deployments:

1. Push your code to GitHub
2. Connect the repository in Cloudflare Pages dashboard
3. Set build configuration:
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
   - **Framework preset**: Next.js

## Post-Deployment

After deployment, test:
- [ ] Wallet connection with Crossmark
- [ ] Admin token issuance
- [ ] Properties listing page
- [ ] Trading interface
- [ ] Token management (freeze/clawback)
