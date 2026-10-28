# Business registration

Open **Profil → Mes entreprises**. Existing submissions appear with their review status; use **Inscrire mon entreprise** only when adding a new business. Authentication uses the existing Google, Apple (iOS), or phone login panel. The four steps match the website: identity, location/contact, presentation, and review/consent.

The 19 categories, their subcategories, and 35 city choices in `src/data/registration.json` are copied from `web-app/dist/registration-data.js`. Update both files together when changing the reference taxonomy. Commune, neighborhood, postal code, address, contacts, description, and the optional photo use the website submission schema.

GPS is requested only after tapping **Utiliser ma position GPS**. The representative must be at the business. The app requests foreground access only, reads one location, shows estimated accuracy, and lets the user edit or clear it. A 20-second UI timeout avoids blocking the form. Denial, disabled location services, and GPS failures leave manual entry available; both coordinates may be left empty for admin verification. Locations outside the existing Guinea review bounds are not accepted. The same admin queue still requires verified coordinates before publication.

Text and coordinates are saved locally in a draft scoped to the signed-in account. Photos and consent are not persisted between screen sessions. One photo up to 5 MB is resized to at most 900 px and compressed to JPEG (at most 300,000 data-URI characters), matching website rules. An authenticated submission is private and pending; it is not directly published. A stable submission ID supports retries after an interrupted response without creating duplicates.

## Continue at home

No mobile tests, lint/typecheck commands, builds, emulators, or app launches were run for this change, as requested. Runtime behavior still needs verification on the configured home computer/device.

1. Pull `main` and run `npm ci` in `mobile-app`.
2. Rebuild the native development client using your existing Android/EAS workflow. This change adds `expo-location`, `expo-image-picker`, and `expo-image-manipulator`, plus native permission configuration. Restarting Metro alone does not add these native modules to an old client.
3. On device, check each registration step, dependent subcategories, draft restore, GPS allow/deny/disabled/timeout, manual negative longitude, optional photo, login, and final consent/submission.
4. Confirm a submitted record appears in the website admin queue with all fields, coordinates, and photo before approving it. Test duplicate taps and retrying an interrupted submission.

Owner edits now use a restricted update of the existing submission: only approved, rejected, or correction-required records can return to pending. Ownership, publication links, and admin metadata stay unchanged; verification checkboxes reset. The website Firestore rules must be deployed for editing to work. Website and mobile rule files still have other differences, so deploy production rules from `web-app` as usual.

Expo SDK 58 references: https://docs.expo.dev/versions/v58.0.0/sdk/location/ , https://docs.expo.dev/versions/v58.0.0/sdk/imagepicker/ , https://docs.expo.dev/versions/v58.0.0/sdk/imagemanipulator/ .

## Review status and edits

Both the website and mobile app subscribe to the signed-in user’s submissions. Reopening the business area shows saved status and information instead of restarting registration. Accepted records offer an edit button; edits are prefilled, submitted under the same record ID, and reviewed again. The existing public business stays visible while edits are pending. Admin reapproval updates the same public record and preserves existing ratings, review counts, services, and creation time.

Both account interfaces distinguish first-time and returning visitors, then offer provider-based authentication. The website uses Google or SMS only; the mobile app also retains its existing Apple option on iOS. Firebase providers automatically create a new account on first successful authentication or sign in to an existing matching account. The UI explains this and asks returning users to use their original provider/number.

At home, verify status persistence after relaunch, owner-only edits, pending edit locking, correction/resubmission, and reapproval without duplicate businesses or lost ratings. Mobile runtime testing remains deferred.
