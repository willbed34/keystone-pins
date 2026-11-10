# Pinnsylvania

**Play:** https://pinnsylvania.win/

A static daily Pennsylvania town-guessing game. The site is a single `index.html` file; no build step is required.

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
3. Enter `keystonepins.com` and follow Cloudflare's DNS/TLS setup.
4. Optionally configure `www.pinnsylvania.win` as a redirect to `pinnsylvania.win`.

## Before public launch

- Human-review every fun fact in the `PZ` array.
- Expand the puzzle pool; currently there are three sets and they repeat.
- Verify Esri's current terms and attribution requirements for your expected traffic and use.
- The map requires an internet connection to load Leaflet, aerial imagery tiles, and the Pennsylvania boundary service.
