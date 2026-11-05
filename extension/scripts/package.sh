#!/usr/bin/env bash
# Builds the extension and zips it for Chrome and Firefox into ./artifacts.
# Usage: scripts/package.sh [version]   (defaults to the version in manifest.json)
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="${1:-$(jq -r .version manifest.json)}"
VERSION="${VERSION#v}"

npm run build

rm -rf stage artifacts
mkdir -p stage/icons artifacts
cp -r dist popup.html content.css stage/
cp icons/icon-128.png stage/icons/
# Chrome does not use Gecko metadata. Keep the Firefox manifest in stage for signing.
jq --arg v "$VERSION" '.version = $v | del(.browser_specific_settings)' manifest.json > stage/manifest.json
(cd stage && zip -qr "../artifacts/gh-absolute-dates-chrome-v${VERSION}.zip" .)

jq --arg v "$VERSION" '.version = $v' manifest.json > stage/manifest.json
(cd stage && zip -qr "../artifacts/gh-absolute-dates-firefox-v${VERSION}.zip" .)

echo "Packaged v${VERSION}:"
ls -1 artifacts
