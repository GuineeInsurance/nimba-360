# NIMBA 360 mobile app

Cross-platform React Native application built with Expo SDK 58 and TypeScript.

The product name, Expo slug, URL scheme, and store identifiers are configured for `NIMBA 360`.

## Included in the first foundation

- Mobile discovery home screen
- Search by name, category, service, or neighborhood
- Open, rating, and proximity filters
- Business detail pages
- Call, WhatsApp, and directions actions
- Local favorites
- Firebase configuration layer with local-data fallback

With Firebase enabled, the app displays approved Firestore businesses. Demo records are only used when Firebase is disabled. Unverified review records remain private.

## Authentication

Google, Apple (iOS), and phone/SMS sign-in are implemented, with persistent sessions and per-account cloud favorites. See [Firebase authentication setup](docs/auth-setup.md) for the remaining device signing and SMS billing requirements. Use a development build, not Expo Go.

## Firebase setup

1. Use the existing Firebase project `guinee-directory-mvp`.
2. Copy `.env.example` to `.env.local`.
3. The example contains this project’s public client settings. Keep `EXPO_PUBLIC_FIREBASE_ENABLED=true` to use Firestore.
4. Create a Firestore database and a `businesses` collection.
5. Only documents with `status: "approved"` are loaded by the prepared service.

Firebase client configuration is public by design. Access control must be enforced through Firebase Authentication and Firestore Security Rules before production.

## Run

```bash
npx expo start --dev-client
```

Then press `a` for an Android emulator, or scan the QR code with a physical device.

## Validation

```bash
npx tsc --noEmit
npx eslint .
npx expo-doctor
```
