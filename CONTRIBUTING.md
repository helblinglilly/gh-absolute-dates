# Contributing to GitHub Absolute Dates

## Repository layout

- [Extension](extension/) contains the Chrome and Firefox extension and its build scripts.
- [Website](website/) contains the static landing page. Open `website/public/index.html` locally or serve `website/public/` with a static web host.

## How it works

GitHub renders `<relative-time datetime="…">` elements with the text inside an open
shadow root. The content script formats the `datetime` attribute with date-fns using the
pattern from the toolbar popup, writes it into the shadow root, and watches for re-renders
and new elements. Settings are stored in `storage.sync` and applied live.

## Development

```
cd extension
npm ci
npm run build      # typecheck + bundle into dist/
npm run watch      # rebuild on change
```

Source is in `src/` (`content.ts`, `popup.ts`, `format.ts`, `settings.ts`).

Load it for testing:

- **Chrome:** `chrome://extensions` → Developer mode → *Load unpacked* → select `extension/`.
- **Firefox:** `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on* → select
  `manifest.json`, or run `npx web-ext run`.

Build the same packages the release produces with `npm run package` (output in `artifacts/`).

## Extension CI and releases

[Extension CI](.github/workflows/extension-ci.yml) installs dependencies, type-checks,
and builds when a pull request or a push to `main` changes `extension/` or the
workflow itself.

To publish a GitHub Release, tag the commit you want to release with a new version
and push the tag:

```sh
git tag v1.0.2
git push origin v1.0.2
```

The [release workflow](.github/workflows/release.yml) uses the tag as the packaged
manifest version and attaches Chrome and Firefox ZIPs to the GitHub Release.
If both `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` are set in the GitHub
`extension-release` environment, the workflow also requests Mozilla signing and
attaches the signed XPI. Otherwise, the Firefox ZIP is the only Firefox asset.

- **Chrome:** Upload the Chrome ZIP to the existing Chrome Web Store listing and
  submit the update for review.
- **Firefox:** Copy the signed XPI into `website/public/downloads/` and update the
  **Install for Firefox** link in `website/public/index.html`. Push those website
  changes to `main` to deploy the download. The currently served Firefox 1.0.1
  has no `update_url`, so users on that build need to install the newer XPI manually.
  To enable automatic updates from the website for a future build, set
  `browser_specific_settings.gecko.update_url` to the public HTTPS URL of a Firefox
  update manifest before signing.

## Website CI and deployment

[Website CI](.github/workflows/website-ci.yml) checks changes under `website/`
and uploads the static files as a `website` artifact. It also runs when its own
workflow changes. Website changes deploy to [gh.helbling.uk](https://gh.helbling.uk)
when pushed to `main`. You can also run Website CI manually from `main`.

The deploy job uses `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` from the
GitHub `production` environment. The portfolio infrastructure project provisions
these secrets.
