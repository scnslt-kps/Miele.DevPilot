#!/bin/sh
set -eu

APP_NAME="Miele.DevPilot"
ARCHIVE_NAME="Miele.DevPilot-server.tar.gz"
PACKAGE_ROOT="release/package-root"
TARGET_DIR="$PACKAGE_ROOT/$APP_NAME"

rm -rf "$PACKAGE_ROOT"
mkdir -p "$TARGET_DIR"

cp -R \
  package.json \
  package-lock.json \
  prisma.config.ts \
  server.mjs \
  index.html \
  app.js \
  styles.css \
  assets \
  prisma \
  src \
  vendor \
  .env.example \
  README.md \
  requirements-review-prompt.md \
  deploy \
  "$TARGET_DIR/"

mkdir -p release
tar -czf "release/$ARCHIVE_NAME" -C "$PACKAGE_ROOT" "$APP_NAME"
rm -rf "$PACKAGE_ROOT"

echo "Created release/$ARCHIVE_NAME"
