# Pinnsylvania

**Play:** https://pinnsylvania.win/

**New Jersey game:** https://pinnsylvania.win/new-jersey

**New York game:** https://pinnsylvania.win/new-york

A static daily Pennsylvania town-guessing game. The site is a single `index.html` file; no build step is required.

## New Jersey game

The `/new-jersey` route serves a separate New Jersey version of the daily game. It uses New Jersey Census place/population data, the New Jersey state boundary, and New Jersey county geometries. Its local streak and puzzle state are stored separately, and the Worker keeps New Jersey daily score averages separate from Pennsylvania scores.

## New York game

The `/new-york` route serves **New York State of Find**, a separate daily New York map game. It uses the 2024 New York Census Gazetteer, 2020 Census place populations, the New York state boundary, and New York county geometries. Its streak, puzzle state, and daily score averages are stored separately from Pennsylvania and New Jersey. The visual theme is inspired by New York subway wayfinding.

## Map implementation

- Leaflet handles map navigation, zooming, dragging, touch gestures, and guess placement.
- Esri World Imagery supplies the aerial/satellite basemap.
- The basemap is imagery-only: the app intentionally does **not** add roads, place names, labels, or a reference-label overlay.
- The Pennsylvania state outline is loaded as a GeoJSON boundary file from the PublicaMundi US states dataset. The app filters that dataset to Pennsylvania and draws only its outline on top of the imagery.
- The imagery tiles are loaded on demand, so no large aerial image needs to be stored in this repository.

## Local preview

Open `index.html` in a local web server (for example, VS Code Live Server). Because the PA boundary is fetched from an external GIS service, serving the file over localhost is preferable to opening it directly as a `file://` URL.

## Deploy with the existing Cloudflare Worker

The public site uses the custom domain:

https://pinnsylvania.win/

The underlying Cloudflare Worker endpoint remains available at:

https://keystonepins.william-bednarz.workers.dev/

If the Worker is already configured to serve the repository's `index.html`, pushing this commit to the connected GitHub branch should trigger a deployment automatically. If it is not connected to GitHub, use the Cloudflare dashboard instructions below.

### Check whether GitHub auto-deploy is enabled

1. Open the [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Go to **Workers & Pages** and select the `keystonepins` Worker.
3. Open **Settings → Builds** (or the build/deployment configuration shown for the Worker).
4. Confirm the GitHub repository is `willbed34/keystone-pins` and the production branch is `main`.
5. If it is connected, a push to `main` should start a deployment. Check the Worker’s **Deployments** tab for the latest successful deployment.

### If the Worker is not connected to GitHub

Use Cloudflare's Git integration for Workers if available in the project, and connect:
- Repository: `willbed34/keystone-pins`
- Production branch: `main`
- Build command: leave blank (no build step)
- Deploy command: configure the Worker to serve the static assets, if prompted

Do not create a separate Pages project unless you specifically want to migrate away from the existing Worker URL.

## Custom domain

The production custom domain is `pinnsylvania.win`:

1. Own/register the domain and add it to Cloudflare DNS (or transfer its DNS management to Cloudflare).
2. In **Workers & Pages → keystonepins → Settings → Domains & Routes**, choose **Add → Custom Domain**.
3. Enter `pinnsylvania.win` and follow Cloudflare's DNS/TLS setup.
4. Optionally configure `www.pinnsylvania.win` as a redirect to `pinnsylvania.win`.

## Daily score average (Cloudflare D1)

The Worker adds two same-origin endpoints:

- `GET /api/daily-average?day=YYYY-MM-DD` returns the shared average and number of submitted scores for that Eastern Time date.
- `POST /api/score` records a score once per browser ID per day. The database primary key prevents duplicate submissions from the same browser ID.

The score API uses the D1 binding named `DB`. The D1 database ID is configured in `wrangler.toml`. Before deploying, confirm that `database_name` in that file exactly matches the name of the existing database in Cloudflare.

Apply the schema to the **remote** D1 database once:

```sh
npx wrangler d1 migrations apply pinnsylvania-scores --remote
```

Then deploy the Worker and static assets:

```sh
npx wrangler deploy
```

For Cloudflare Git deployments, set the deploy command to `npx wrangler deploy` (the repository now includes `wrangler.toml`). The `.assetsignore` file prevents Worker source, migration SQL, and repository documentation from being published as public website files.

## Town pool and difficulty

- The app loads Pennsylvania place coordinates and land area from the 2024 Census Gazetteer.
- It uses the 2020 Decennial Census population table to keep incorporated places and filter census-designated places: CDPs with at least 5,000 residents remain, along with Hershey as a deliberate exception. If the population service is unavailable, it safely falls back to incorporated places plus Hershey.
- Recognizable places (including Allentown, Erie, and Hershey) are explicitly placed in the easiest difficulty tier; remaining towns are ordered by 2020 population as a rough familiarity proxy.
- The original hand-written facts are preserved. Other places receive a basic geographic fact generated from Census land/water area; those generic facts are not individually researched trivia.

## Before public launch

- Confirm the D1 database name in `wrangler.toml`, apply the migration, and verify the two API endpoints after deployment.
- Human-review the original hand-researched facts and consider replacing generic area facts with locally researched trivia.
- Verify Esri's current terms and attribution requirements for your expected traffic and use.
- The map requires an internet connection to load Leaflet, aerial imagery tiles, the Pennsylvania boundary, and Census place/population data.
