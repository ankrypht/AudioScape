#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# The APP_VERSION is now passed from the GitHub Actions environment
if [ -z "$APP_VERSION" ]; then
  echo "❌ APP_VERSION environment variable is not set."
  exit 1
fi

echo "App version from Git tag: $APP_VERSION"

# Create a 'builds' directory if it doesn't exist
mkdir -p builds
echo "✅ 'builds' directory is ready."

echo "📦 Starting EAS build for Android..."

# Start the build and capture the build ID
BUILD_ID=$(eas build --platform android --profile preview --non-interactive --json | jq -r '.id')

if [ -z "$BUILD_ID" ]; then
  echo "❌ Failed to start build or get build ID."
  exit 1
fi

echo "✅ Build started successfully with ID: $BUILD_ID"
echo "⏳ Waiting for build to complete... This may take a while."

# Poll for the build status until it's finished
while true; do
  BUILD_INFO_JSON=$(eas build:view --json --build-id "$BUILD_ID")
  STATUS=$(echo "$BUILD_INFO_JSON" | jq -r '.status')

  echo "Current build status: $STATUS"

  if [ "$STATUS" == "finished" ]; then
    echo "🎉 Build finished!"
    ARTIFACT_URL=$(echo "$BUILD_INFO_JSON" | jq -r '.artifacts.buildUrl')
    echo "APK URL: $ARTIFACT_URL"
    break
  elif [ "$STATUS" == "errored" ]; then
    echo "❌ Build failed. Check the build logs on Expo's website."
    exit 1
  fi

  # Wait for 30 seconds before checking again
  sleep 30
done

# Define filename and download the APK into the builds folder
FILENAME="audioscape${APP_VERSION}.apk"
OUTPUT_PATH="builds/${FILENAME}"

echo "📥 Downloading APK to $OUTPUT_PATH..."
# Use -L to follow redirects from the artifact URL
curl -L -o "$OUTPUT_PATH" "$ARTIFACT_URL"

echo "✅ Success! APK downloaded as $OUTPUT_PATH."
