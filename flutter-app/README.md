# NIMBA 360 Flutter app

Android-first Flutter application for NIMBA 360. The former Expo/React Native source was removed after the Flutter replacement was accepted.

## Toolchain

- Flutter 3.32.8 / Dart 3.8.1
- Android application ID: `com.nimba360.app`
- Firebase project: `guinee-directory-mvp`
- Android min SDK: 23
- Android NDK: 27.0.12077973

## Local setup

```powershell
flutter pub get
flutter analyze
flutter test
flutter run -d <device-id>
```

The project uses the existing Android Firebase registration in `android/app/google-services.json`. Release signing is intentionally not configured yet; do not ship the debug-signed APK.

## Implemented flows

- Approved-business catalog, honest empty/error states, search, details, phone, WhatsApp, and map actions.
- Local guest favorites, cloud account favorites, and automatic guest merge on sign-in.
- Google and phone/SMS authentication with persistent Firebase sessions.
- Profile, support/privacy/deletion links, and owner submission dashboard.
- Business registration with shared taxonomy, draft recovery, GPS permission, JPEG compression, validation, consent, idempotent identifiers, and Firestore submission.
- Resubmission of approved, rejected, or correction-required records while the public listing stays unchanged pending admin review.

## Acceptance still required

Google sign-in and the main UI have been verified on a physical Android 12 device. Still verify SMS delivery, account switching, Firestore reads with approved records, favorite merge, GPS denial/approval, image selection, submission creation, owner resubmission, offline/retry states, and production release signing.
