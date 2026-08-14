# DeployPilot download site

## Files
- `index.html` — initial loader + confirmation screen
- `styles.css` — responsive UI
- `script.js` — session/token flow and 5-second preparation delay
- `download.html` — instructions + video placeholder
- `download.js` — automatic download trigger
- `worker.js` — Cloudflare Worker API, HMAC token validation, Telegram tracking and installer redirect
- `assets/install-help.mp4` — upload your future video here
- `assets/video-poster.jpg` — optional poster image

## Cloudflare Worker variables/secrets
Set:
- `BOT_TOKEN` as a Worker Secret
- `CHAT_ID` as a Worker Secret
- `LINK_SECRET` as a Worker Secret (use a long random value)
- `INSTALLER_URL` as a Worker variable containing the exact GitHub Release asset URL
- `SITE_ORIGIN` as a Worker variable containing the deployed site origin

No D1, KV, R2, or paid database is required.

## Important security note
A browser cannot be made incapable of opening DevTools or viewing client-side HTML/CSS/JavaScript. Those controls only deter casual inspection and are not security boundaries. The security boundary is the Worker: signed, expiring tokens, no installer URL in client-side source, CSP/security headers, and server-side validation before redirecting to the installer.

## Tokenized links
The Worker creates a signed access token without storing it. The token expires after 30 minutes. Because the signature is deterministic from the payload + secret, the Worker can validate it without D1/KV.

The client currently exposes the token in the URL query after `/api/session`. If you want the public URL itself to be `/d/<90+ character token>`, have your distribution flow generate `/d/<token>` links from the Worker and share those links.

## GitHub Pages/Cloudflare
Keep the static files in GitHub and deploy them through Cloudflare Pages. Attach the Worker to the same hostname (or route `/api/*` and `/d/*` through the Worker). Do not put Telegram bot secrets or `LINK_SECRET` in GitHub.
