# Firebase authentication — NIMBA 360

Project: `guinee-directory-mvp`. Package / bundle ID: `com.nimba360.app`.

## Configured on 2026-10-27

- Android Firebase app: `1:114891564661:android:acf60931ad157ee3afba3c`.
- iOS Firebase app: `1:114891564661:ios:cbd403745ebcf2f7afba3c`.
- Google, Apple, and Phone providers enabled. Existing email/password provider preserved.
- SMS region allowlist: Guinea (`GN`, +224). Other countries remain blocked.
- Client configuration is in `google-services.json`, `GoogleService-Info.plist`, and `.env.example`. These are public app identifiers, not service-account credentials.
- Native authentication and Firestore use the same native Firebase app/session. Web uses the Firebase JavaScript SDK.
- Sessions persist through the Firebase SDK. Signed-in favorites live at `users/{uid}/favorites/{businessId}`. Guest favorites persist on the current device and remain separate from account favorites.
- Public business screens query approved Firestore records. An empty server result stays empty; demo data is only used when Firebase is explicitly disabled.
- Deployed rules were inspected: public reads are restricted to approved businesses; profile and favorite access is scoped to the signed-in UID. No rules deployment was needed. The deployed rules also contain the web admin audit collection; do not overwrite them with an older mobile-only rules file.

## Continue on either computer

1. Pull the repository, enter `mobile-app`, and run `npm ci`.
2. Copy `.env.example` to `.env.local` if no local configuration exists.
3. Create an Expo account at https://expo.dev/signup, then run `npx eas-cli@latest login` and `npx eas-cli@latest init` from `mobile-app`. Create/link one NIMBA 360 EAS project and use the same project from both computers. Commit the project ID that EAS adds to `app.json`.
4. In the EAS project dashboard, open Project settings > Environment variables. Add the `EXPO_PUBLIC_*` values from `.env.example` as plain-text variables for the `development` environment (and for `preview`/`production` before those builds). The ignored `.env.local` file is not a substitute for EAS cloud environment configuration.
5. Build a development client using `npx eas-cli@latest build --profile development --platform android` (or `ios`). Sign in to your Expo account and associate the intended EAS project when prompted.
6. Install the development build and run `npx expo start --dev-client`.

React Native Firebase and native Google sign-in do not run in Expo Go. Native module/config changes require rebuilding the client.

## Required before device acceptance

### Android

Register the SHA-1 and SHA-256 fingerprints for the actual development/release signing certificates in Firebase project settings. Include Google Play App Signing fingerprints before store release. Do not substitute a certificate from the other computer or generate an unrelated key merely to populate the setting. Download the updated `google-services.json` and rebuild after adding fingerprints.

### Apple

Use an Apple Developer account to enable Sign in with Apple for `com.nimba360.app` and provision the app with that entitlement. Expo is configured with `usesAppleSignIn` and the Apple authentication plugin. Native Apple login uses a fresh hashed nonce and exchanges the Apple token with Firebase. Apple web/Android login is not exposed; it needs a separate Services ID and OAuth code-flow configuration.

For reliable iOS phone verification, configure APNs credentials in Firebase and push/background notification capabilities in the signed app. The Firebase Auth plugin configures the reCAPTCHA fallback URL scheme. Test both normal and fallback verification on a real device.

### SMS billing

The user enabled pay-as-you-go billing, and the Google Cloud Billing API confirmed `billingEnabled: true` with a billing account linked on 2026-10-27. The billing prerequisite for real verification SMS is now satisfied; native app verification/signing and device tests are still required. No real SMS was sent during setup. Prefer fictional test numbers configured privately in Firebase while developing; do not commit verification codes or disable app verification in production.

### Device acceptance checklist

- Google sign-in on Android/iOS; cancellation; sign-out; restart with session restored.
- Apple sign-in on iOS, including Hide My Email and a repeat login.
- Phone sign-in: valid and invalid number, incorrect/expired code, resend cooldown, automatic Android verification, iOS reCAPTCHA fallback.
- Favorites sync between two devices signed into the same account; switching accounts never displays the prior account's favorites; guests retain local favorites.
- Permission/network failures show an error rather than claiming successful sync.
- Approve a real business via the existing admin workflow, then confirm home/search/detail/favorite screens display that record. No approved businesses were present at inspection time.

## Local validation

```sh
npx tsc --noEmit
npx eslint .
node --test scripts/auth-data.test.mjs
npx expo export --platform all --output-dir dist-auth-check
```

Bundle export verifies JavaScript compilation, not native signing or successful provider login.

References: [Expo Firebase](https://docs.expo.dev/guides/using-firebase/), [native phone authentication](https://rnfirebase.io/auth/phone-auth), [Firebase SMS limits](https://firebase.google.com/docs/auth/limits), [Apple setup](https://firebase.google.com/docs/auth/ios/apple).
