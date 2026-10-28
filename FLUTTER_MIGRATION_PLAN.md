# NIMBA 360 — Flutter migration plan

Status: proposed implementation sequence. No Flutter implementation started.
Requested scope: rebuild the mobile app screen by screen; keep the website and Firebase backend working.

## Approach

- Build a new `flutter-app/` beside `mobile-app/`. Keep the existing Expo app available as a reference and fallback until replacement acceptance.
- Android first, French first. Carry over the NIMBA logo, tagline, colors, taxonomy, and business workflow. iOS follows Android acceptance.
- Continue using Firebase project `guinee-directory-mvp`: existing accounts, approved businesses, favorites, submissions, and web moderation queue.
- Preserve `com.nimba360.app` for the eventual replacement. Inspect existing app registrations and signing configuration before running FlutterFire configuration; do not create duplicate registrations blindly.
- Flutter removes the Expo/EAS development workflow from the replacement app, but does not remove Firebase configuration, signing certificates, Android tooling, SMS verification, or Apple release requirements.
- Do not promise that local Expo drafts or guest favorites migrate automatically. They use a different storage stack. Cloud data remains available to the same Firebase UID; users may need to sign in again.
- Do not copy runtime assumptions or bugs merely for parity. Unknown distances and opening hours must remain unknown rather than displaying invented values.

## Keep the code understandable

Use Flutter widgets with one small controller/view model per feature and repositories for Firebase access. Prefer built-in state tools such as `ChangeNotifier` initially; avoid combining several competing state-management frameworks. Use a single routing solution (proposed: `go_router`) with an app shell for Explorer, Favoris, and Profil.

Proposed organization:

```text
flutter-app/lib/
  app/                  # startup, routing, theme
  shared/               # logo, buttons, cards, form fields, messages
  data/                 # models and Firebase repositories
  features/
    explore/
    search/
    business_details/
    account/
    favorites/
    my_businesses/
    registration/
```

Select compatible stable package versions at setup time and commit the SDK version guidance and dependency lockfile. Prefer FlutterFire for Auth and Firestore. Evaluate maintained GPS, image-picker, image-compression, and local-storage packages when those features are implemented.

## Screen-by-screen delivery order

| Stage | Deliverable | Acceptance checkpoint |
|---|---|---|
| 0 | Foundation: Flutter project, theme, reusable controls, app shell, Firebase repositories | Agreed Android package identity; shared logo/tagline; navigation and data contracts documented; home setup guide ready. |
| 1 | Explorer home | Approved businesses only; categories and business cards; useful loading, empty, retry, and offline states; no silent fallback to fake listings. |
| 2 | Search and filters | Search by available name/category/location data; clear filters; result counts and no-results message; back navigation preserves context. Scope remains current client-side search until a dedicated search service is planned. |
| 3 | Business details | Accurate business information, photo, contact/WhatsApp/map actions; unavailable information handled clearly. No invented reviews or hours. |
| 4 | Welcome/account entry | Distinct “Je suis nouveau” and “J’ai déjà un compte” choices; plain-language explanations; browsing remains available without an account. |
| 5 | Google and phone verification | Google login; phone entry, SMS code, resend cooldown, change-number action, cancellation and failures; returning users told to use their original method. First provider authentication creates the account automatically. |
| 6 | Profile and favorites | Persistent sign-in, sign-out, existing favorites under the same UID, guest favorites kept separate, support/privacy/deletion links. Account switching never displays another account’s data. |
| 7 | My businesses dashboard | Existing submissions load before offering a new form. Pending/reviewing, approved, corrections, and rejected states have clear messages. Approved details offer editing. State survives app restart through Firestore. |
| 8 | Registration — identity | Business name, category, dependent subcategory; exact website taxonomy; accessible field errors. |
| 9 | Registration — location/contact | City, commune, neighborhood, postal code, address, phone, optional email/website/WhatsApp; GPS button requests foreground permission on site, shows accuracy, supports manual or deferred coordinates. No background tracking. |
| 10 | Registration — presentation | Description and optional photo; compression compatible with the existing JPEG submission limit; image preview/remove; recoverable per-account drafts. |
| 11 | Registration — review/send | Full summary, explicit authorization consent, return-to-edit controls, duplicate-send prevention; confirmed submission returns to the dashboard with “En cours de vérification.” |
| 12 | Edit an accepted business | Prefilled form, existing image retained unless changed/removed; owner-only edits return the same submission to pending; existing public listing remains visible until admin reapproval. Ratings, review counts, and publication identity are preserved. |
| 13 | Android acceptance and replacement | Home-device verification across all screens and auth/GPS/network states; real backend workflow checked with controlled records; signing and release build verified before replacing Expo. |

Stages 8–11 should be implemented one step at a time but remain a single connected registration flow. Stage 12 reuses that flow rather than creating a second form implementation.

## Backend contracts to preserve

- `businesses`: public reads only for approved records; no owner direct-publication writes.
- `users/{uid}` and `users/{uid}/favorites/{businessId}`: current ownership rules and existing identifiers.
- `submissions`: signed-in owner creation; owner can resubmit approved/rejected/correction-required records as pending through a restricted update. Publication links and reviewer metadata cannot be altered by owners; verification checks reset.
- Continue using the website admin review process and the production rules maintained under `web-app/`. Do not deploy an older mobile rules copy over production.
- Keep registration choices synchronized with `web-app/dist/registration-data.js`; define a single checked-in source/generation process before shipping the replacement.
- Preserve existing photo handling for parity initially. Moving photos to Cloud Storage is a separate backend change, not a prerequisite for rewriting screens.

## How we work across office and home

1. Implement one numbered deliverable at a time with a focused commit and short handoff note.
2. At the office: write/review source and document status. Do not launch mobile apps, emulators, builds, or mobile tests unless the user changes the existing instruction.
3. At home: install one agreed Flutter SDK version and Android tooling, pull changes, run dependency setup and static checks, then verify the current screen on the configured device.
4. Record issues and approval for each screen. Code-complete and device-verified are separate statuses; do not label an untested screen device-ready.
5. Do not switch the shipping app or delete Expo until end-to-end Android acceptance is complete. Retain a Git reference to the old app for rollback.

The final Android build must use the intended signing identity. An update over an installed app requires compatible package identity and signing; a differently signed development build may require a separate installation strategy. iOS builds/signing require the appropriate Apple toolchain or a suitable macOS build service and account configuration.

## Immediate next deliverable

Stage 0 followed by Stage 1: scaffold Flutter, establish the NIMBA design components and navigation, then implement the Explorer screen. Do not rewrite every screen in one pass. Update `PRODUCT_SPEC.md` to reflect the selected Flutter architecture before implementation begins; retain its product priorities and distinguish migration parity from future roadmap features.

## References

- Flutter architecture guidance: https://docs.flutter.dev/app-architecture/guide
- Flutter recommendations: https://docs.flutter.dev/app-architecture/recommendations
- Firebase Flutter setup: https://firebase.google.com/docs/flutter/setup
- Firebase Flutter authentication: https://firebase.google.com/docs/auth/flutter/start
