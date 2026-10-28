# Business registration

Open **Profil → Inscrire mon entreprise**. Authentication uses the existing Google, Apple (iOS), or phone login panel. The four steps match the website: identity, location/contact, presentation, and review/consent.

The 19 categories, their subcategories, and 35 city choices in `src/data/registration.json` are copied from `web-app/dist/registration-data.js`. Update both files together when changing the reference taxonomy. Commune, neighborhood, postal code, address, contacts, description, and the optional photo use the website submission schema.

GPS is requested only after tapping **Utiliser ma position GPS**. The representative must be at the business. The app requests foreground access only, reads one location, shows estimated accuracy, and lets the user edit or clear it. A 20-second UI timeout avoids blocking the form. Denial, disabled location services, and GPS failures leave manual entry available; both coordinates may be left empty for admin verification. Locations outside the existing Guinea review bounds are not accepted. The same admin queue still requires verified coordinates before publication.

Text and coordinates are saved locally in a draft scoped to the signed-in account. Photos and consent are not persisted between screen sessions. One photo up to 5 MB is resized to at most 900 px and compressed to JPEG (at most 300,000 data-URI characters), matching website rules. An authenticated submission is private and pending; it is not directly published. A stable submission ID supports retries after an interrupted response without creating duplicates.

## Continue at home

No mobile tests, lint/typecheck commands, builds, emulators, or app launches were run for this change, as requested. Runtime behavior still needs verification on the configured home computer/device.

1. Pull `main` and run `npm ci` in `mobile-app`.
2. Rebuild the native development client using your existing Android/EAS workflow. This change adds `expo-location`, `expo-image-picker`, and `expo-image-manipulator`, plus native permission configuration. Restarting Metro alone does not add these native modules to an old client.
3. On device, check each registration step, dependent subcategories, draft restore, GPS allow/deny/disabled/timeout, manual negative longitude, optional photo, login, and final consent/submission.
4. Confirm a submitted record appears in the website admin queue with all fields, coordinates, and photo before approving it. Test duplicate taps and retrying an interrupted submission.

The deployed website Firestore rules already accept this schema. The mobile rules' submission block has been brought into sync; no production Firebase changes are needed for this feature. Website and mobile rule files still have other differences, so deploy production rules from `web-app` as usual.

Expo SDK 58 references: https://docs.expo.dev/versions/v58.0.0/sdk/location/ , https://docs.expo.dev/versions/v58.0.0/sdk/imagepicker/ , https://docs.expo.dev/versions/v58.0.0/sdk/imagemanipulator/ .
