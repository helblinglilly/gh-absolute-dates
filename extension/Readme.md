# GitHub Absolute Dates – extension source

Build instructions (also used by addons.mozilla.org source review):

Requirements: Node.js 20 and npm, `jq`, `zip`, on Linux or macOS.

```sh
npm ci
scripts/package.sh            # or: npm run build  (bundles src/ into dist/)
```

`npm run build` type-checks with `tsc` and bundles `src/content.ts` and `src/popup.ts`
with esbuild (no minification) into `dist/`. `scripts/package.sh` additionally zips the
extension for Chrome and Firefox into `artifacts/`; the Firefox package's files are in
`stage/`.
