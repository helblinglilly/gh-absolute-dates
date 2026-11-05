#!/usr/bin/env bash
# Builds the extension and zips it for Chrome and Firefox into ./artifacts.
# Usage: scripts/package.sh [version]   (defaults to the version in manifest.json)
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="${1:-$(jq -r .version manifest.json)}"
VERSION="${VERSION#v}"

npm run build

rm -rf stage artifacts
mkdir -p stage artifacts
cp -r dist popup.html content.css stage/
# Stamp the release version into the packaged manifest only.
jq --arg v "$VERSION" '.version = $v' manifest.json > stage/manifest.json

# Same package for both browsers: Chrome ignores `browser_specific_settings`,
# Firefox ignores nothing we use. Different names keep the release assets clear.
(cd stage && zip -qr "../artifacts/gh-absolute-dates-chrome-v${VERSION}.zip" .)
(cd stage && zip -qr "../artifacts/gh-absolute-dates-firefox-v${VERSION}.zip" .)

echo "Packaged v${VERSION}:"
ls -1 artifacts
