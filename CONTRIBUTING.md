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

To publish a new version, bump `version` in `extension/manifest.json` (for example
`1.0.1` → `1.1.0`) and get it onto `main`. The
[release workflow](.github/workflows/release.yml) runs on every push to `main` that
touches `extension/`. If no `v<version>` tag exists yet, it:

1. builds the Chrome and Firefox packages;
2. uploads and publishes the Chrome ZIP to the Chrome Web Store (it then goes through
   Google's review);
3. submits the Firefox package to the **listed** channel on addons.mozilla.org, with
   `extension/amo-metadata.json` and a source archive for review. Mozilla hosts it and
   updates users automatically once approved;
4. creates the `v<version>` tag and a GitHub Release with auto-generated notes and the
   packages attached.

Pushes that don't change the version stop after the check. If one store fails, use
**Re-run failed jobs**. Re-running everything would upload again to the store that
already accepted the version, and that store would reject the duplicate. You can also
start the workflow by hand from the Actions tab.

Required secrets in the GitHub `extension-release` environment:

- `AMO_JWT_ISSUER`, `AMO_JWT_SECRET`:
  [AMO API keys](https://addons.mozilla.org/developers/addon/api/key/).
- `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`,
  `CHROME_PUBLISHER_ID`: Chrome Web Store API credentials, see
  [this guide](https://github.com/fregante/chrome-webstore-upload-keys).

## Website CI and deployment

[Website CI](.github/workflows/website-ci.yml) checks changes under `website/`
and uploads the static files as a `website` artifact. It also runs when its own
workflow changes. Website changes deploy to [gh.helbling.uk](https://gh.helbling.uk)
when pushed to `main`. You can also run Website CI manually from `main`.

The deploy job uses `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` from the
GitHub `production` environment. The portfolio infrastructure project provisions
these secrets.
