---
description: Build an Android App Bundle (AAB) using EAS Build
---

1. Ensure you are logged in to your Expo account.
   Run: `npx eas-cli login`

2. Configure the project for EAS Build (if not already done).
   Run: `npx eas-cli build:configure`
   - Select `Android` (or `All`) when prompted.
   - This will create an `eas.json` file in the root directory.

3. Run the build command for Android.
   Run: `npx eas-cli build --platform android`
   - Follow the prompts to generate a new Keystore (if you don't have one).
   - Wait for the build to complete. It will provide a link to download the `.aab` file.

4. (Optional) To build an APK for testing on a device (instead of AAB for store):
   - Modify `eas.json` to include a `preview` profile with `buildType: "apk"`.
   - Run: `npx eas-cli build --profile preview --platform android`
