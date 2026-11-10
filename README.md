# Keystone Pins — deploy

Static site: just `index.html`. No build step.

## Fastest: Cloudflare Pages (drag & drop, no GitHub needed)
1. dash.cloudflare.com → Workers & Pages → Create → Pages → Upload assets.
2. Name the project `keystonepins`, drag in this folder (or the zip), Deploy.
3. Custom domains → add keystonepins.com (if the domain isn't on Cloudflare, add the CNAME it shows at your registrar).

## Later: GitHub auto-deploy
Push this folder to a repo, then Pages → Connect to Git; every push redeploys.

## Before launch
- Human-review every fun fact in the `PZ` array in index.html.
- Grow the puzzle pool (currently 3; they repeat).
