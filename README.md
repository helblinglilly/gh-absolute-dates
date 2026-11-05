# GitHub Absolute Dates

Browser extension (Chrome + Firefox, Manifest V3) that replaces GitHub's relative
timestamps ("1 minute ago") with absolute dates ("10 Oct 2026, 22:38").

## Repository layout

- [Extension](extension/) contains the Chrome and Firefox extension and its build scripts.
- [Website](website/) contains the static landing page. Open `website/public/index.html` locally or serve `website/public/` with a static web host.

## Install

Download the latest packages from the
[Releases page](https://github.com/helblinglilly/gh-absolute-dates/releases/latest).

### Chrome (and Chromium browsers: Edge, Brave, ...)

1. Download `gh-absolute-dates-chrome-vX.Y.Z.zip` and **unzip it** to a folder you will keep
   (Chrome loads the extension from that folder, so don't delete it).
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the unzipped folder.
4. Optional: pin the extension from the puzzle-piece menu to reach its settings.

To update, download the new zip, replace the folder's contents, and click the reload
arrow on the extension's card.

### Firefox

- **Signed `.xpi` (if the release has one):** download `gh-absolute-dates-firefox-vX.Y.Z...xpi`
  and open it in Firefox (or drag it onto a Firefox window), then confirm **Add**. This
  installs permanently.
- **Otherwise (unsigned `.zip`):** Firefox only keeps unsigned add-ons until it restarts.
  1. Download `gh-absolute-dates-firefox-vX.Y.Z.zip` and unzip it.
  2. Open `about:debugging#/runtime/this-firefox`.
  3. Click **Load Temporary Add-on…** and pick `manifest.json` from the unzipped folder.

  For a permanent unsigned install you need Firefox Developer Edition or Nightly with
  `xpinstall.signatures.required` set to `false` in `about:config`.

## Settings

Click the extension's toolbar icon:

- **Format**: a single [date-fns `format`](https://date-fns.org/docs/format) pattern.
  The default is `d MMM yyyy, HH:mm`. See the
  [format reference](https://date-fns.org/docs/format) for all tokens. Note these are
  date-fns tokens: `yyyy` for year and `d` for day (not `YYYY`/`D`). Wrap literal text in
  single quotes, e.g. `d MMM yyyy 'at' HH:mm`.
- **Hide the date for today's timestamps**: date tokens are removed from today's
  timestamps along with their neighbouring separators, so the default becomes `HH:mm`.
- **Hide the year for this year's timestamps**: year tokens are removed for the current
  year, so the default becomes `d MMM, HH:mm`. If both apply (a timestamp from today),
  hiding the date wins.

Both checkboxes are off by default. Changes apply live, without reloading GitHub.

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

## Releasing

Releases are built by GitHub Actions (`.github/workflows/release.yml`). To publish one:

```
git tag v1.2.0
git push origin v1.2.0
```

The workflow builds the extension, stamps the tag's version into the manifest, and attaches
a Chrome zip and a Firefox package to a new GitHub release.

To also attach a **signed Firefox `.xpi`**, provision the `extension-release` environment secrets `AMO_JWT_ISSUER` and
`AMO_JWT_SECRET` (API keys from <https://addons.mozilla.org/developers/addon/api/key/>).
Without them the Firefox package is an unsigned zip. Publishing to the Chrome Web Store or
the public Firefox add-on listing is not automated.

Extension CI builds changes under `extension/`. Website CI runs for changes under
`website/` and uploads the static files as a `website` artifact. Each workflow also
runs when its own configuration changes. Website changes can ship independently of
extension release tags.

Website CI deploys to [gh.helbling.uk](https://gh.helbling.uk) on website changes
pushed to `main`. You can also run Website CI manually from `main`. The
`production` GitHub environment needs `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_API_TOKEN`, provisioned by the portfolio infrastructure project.

The landing page links to GitHub Releases for downloads. Once a signed XPI is hosted
on R2, add its public install URL to the page. For Firefox to fetch automatic updates
from R2, set `browser_specific_settings.gecko.update_url` in the extension manifest
to your public HTTPS update manifest URL before signing.
