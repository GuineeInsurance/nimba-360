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

The businesses shown in the app are design/demo records. They are not the unverified OSM review dataset.

## Firebase setup

1. Create a Firebase project and register a Web app.
2. Copy `.env.example` to `.env.local`.
3. Fill in the six `EXPO_PUBLIC_FIREBASE_*` values from the Firebase configuration object.
4. Create a Firestore database and a `businesses` collection.
5. Only documents with `status: "approved"` are loaded by the prepared service.

Firebase client configuration is public by design. Access control must be enforced through Firebase Authentication and Firestore Security Rules before production.

## Run

```bash
npm start
```

Then press `a` for an Android emulator, or scan the QR code with a physical device.

## Validation

```bash
npx tsc --noEmit
npx eslint .
npx expo-doctor
```
