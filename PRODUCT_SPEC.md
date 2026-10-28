# NIMBA 360 Product Specification and Delivery Roadmap

| Document | Value |
|---|---|
| Status | Draft for product approval |
| Version | 0.1 |
| Last updated | 27 October 2026 |
| Product | NIMBA 360 |
| Initial market | Guinea, beginning with Conakry |
| Primary language | French |
| Platforms | Android first; responsive web; iOS later |
| Technical foundation | Expo / React Native, Firebase Authentication, Firestore, Firebase Hosting |

This document is the product and delivery source of truth for NIMBA 360. Feature work should not begin until the relevant requirement, priority, acceptance criteria, and dependencies are represented here. Changes to scope should update this document before implementation.

## 1. Executive summary

NIMBA 360 is a trusted local business directory designed for Guinea. It helps consumers discover reliable businesses, understand what they offer, verify how to reach them, and contact them directly by phone, WhatsApp, or maps. It also gives businesses a controlled way to submit and maintain their information, while an internal team verifies every public listing.

The product is not intended to be a generic social network or an unmoderated map. Its differentiation is useful local discovery backed by human verification, explicit provenance, and clear correction workflows.

The present codebase is a strong interface and data-pipeline foundation, but it is not yet a launch-ready consumer product. Authentication, profiles, favorites, a private review queue, and an administrative approval workflow exist. However, no business has been published to the live `businesses` collection, consumer reviews are not connected, account deletion is not processed automatically, category and location collections are not populated, image handling is incomplete, and no trusted server-side functions exist.

The recommended delivery order is:

1. Approve this specification and resolve the blocking product decisions.
2. Establish secure server-side operations and production observability.
3. Verify and publish a small, high-quality Conakry launch catalog.
4. complete the Android consumer discovery experience.
5. Add business submissions, corrections, ownership, and review workflows.
6. Harden, measure, and release before expanding nationally.

## 2. Product vision

### 2.1 Vision statement

Make trustworthy information about businesses and services in Guinea easy to find, verify, and act on.

### 2.2 Consumer promise

“Find a reliable local business and contact it with confidence.”

### 2.3 Business promise

“Make your business discoverable with accurate information you can submit and maintain.”

### 2.4 Operational promise

“Nothing becomes public without a traceable verification decision.”

### 2.5 Initial launch objective

Launch a useful Android directory for Conakry with enough verified businesses to produce meaningful search results in the most common categories, while establishing workflows that can later scale across Guinea.

## 3. Goals and non-goals

### 3.1 Product goals

- Provide fast discovery by business name, category, service, and neighborhood.
- Publish only information that has passed a defined human review process.
- Make phone, WhatsApp, and directions the shortest possible path from discovery to action.
- Preserve consumer favorites across devices when signed in.
- Let consumers report incorrect information and eventually contribute moderated reviews.
- Let authorized business representatives submit, claim, and update listings.
- Give administrators a safe, auditable moderation workflow.
- Build a data model and operating process that support national expansion.

### 3.2 Business goals

- Demonstrate repeated consumer usage and contact intent in Conakry.
- Build a defensible database of verified local business information.
- Establish a scalable onboarding channel for business owners.
- Create a foundation for future premium business tools without weakening consumer trust.

### 3.3 Non-goals for the first public release

- In-app payments, ordering, booking, delivery, or escrow.
- Consumer-to-consumer messaging or a general social feed.
- Paid ranking that is indistinguishable from organic ranking.
- Automatic publication of scraped or imported records.
- Nationwide launch before Conakry quality and operations are proven.
- Real-time turn-by-turn navigation.
- A full CRM or accounting suite for businesses.

## 4. Users and jobs to be done

### 4.1 Consumer

Examples include residents, visitors, and members of the Guinean diaspora helping someone locally.

Core jobs:

- Find a business for a specific need.
- Determine whether the business appears legitimate and relevant.
- Confirm its location, hours, and contact details.
- Call, message, or navigate without copying information manually.
- Save a useful business for later.
- Report inaccurate information.
- Share a business with another person.

### 4.2 Business representative

Examples include an owner, manager, or authorized employee.

Core jobs:

- Submit a new business for inclusion.
- Prove authority to represent it.
- Correct contact, service, location, and opening-hour information.
- Add authorized images.
- Understand review status and requested corrections.
- Respond to or report inappropriate reviews in a later phase.

### 4.3 Data reviewer / moderator

Core jobs:

- Inspect imported records and business submissions.
- Compare sources, find duplicates, and verify identity and location.
- Correct normalized fields before publication.
- Approve, reject, close, or mark a record as duplicate.
- Record evidence and reviewer notes.
- See a complete, immutable history of decisions.

### 4.4 Administrator

Core jobs:

- Manage moderator access and Firebase custom claims.
- Maintain categories, geographic references, and policy settings.
- Process account deletion and safety requests.
- Monitor errors, abuse, and operational throughput.
- Restore or correct data without bypassing audit controls.

## 5. Product principles

1. **Trust before volume.** A smaller accurate directory is more valuable than thousands of uncertain listings.
2. **Action over browsing.** Search, call, WhatsApp, and directions are primary outcomes.
3. **Local context first.** Guinea-specific phone formats, geography, languages, connectivity, and business practices guide design decisions.
4. **Clear provenance.** Imported, owner-submitted, moderator-verified, and consumer-contributed information must remain distinguishable internally.
5. **Progressive authentication.** Browsing stays available to guests. Authentication is requested only for personal or write actions.
6. **Human moderation for public trust signals.** Listings and reviews do not become public solely because a client wrote a document.
7. **Low-bandwidth resilience.** Core information remains usable on slow or intermittent connections.
8. **No misleading UI.** Demo reviews, ratings, open states, distances, or verified badges must never appear as live facts.

## 6. Current product baseline

### 6.1 Live infrastructure

- Firebase project: `guinee-directory-mvp`.
- Firestore: `(default)` database in `europe-west1` with deletion protection enabled.
- Registered apps: Android, iOS, and two web applications.
- Live data: 670 private `businessRecords`, all in `review_required`; one user profile; no public businesses or favorites at the time of inspection.
- Cloud Functions API: disabled; no server-side function source exists in the repository.
- Hosting: public website, business submission portal, admin portal, legal pages, support, and deletion-request page.

### 6.2 Implemented consumer capabilities

- Android development build and responsive React Native interface.
- Home, Explore/Search, Favorites, Profile, and Business Detail screens.
- Google sign-in on Android; Apple and phone flows implemented in code.
- Firestore user profile creation.
- Per-account cloud favorite synchronization.
- Approved-business reads from Firestore.
- Phone, WhatsApp, and Google Maps actions.
- Client-side filtering by category, open state, rating, and distance fields.

### 6.3 Implemented business and admin capabilities

- Web account creation and email/password authentication.
- Multi-step business submission interface.
- Private admin queue for imported records and submissions.
- Duplicate indicators, evidence fields, verification checkboxes, status changes, publication writes, and audit entries.
- Firestore rules separating public data, personal data, and administrative data.

### 6.4 Known incomplete or misleading areas

- No public `businesses` records exist, so the live consumer catalog is empty.
- The business detail screen shows a hardcoded example review.
- Share action has no implementation.
- “Open now” and proximity depend on fields that are not yet supported by reliable location/hour logic.
- Rating aggregates are described as server-managed, but no server process manages them.
- Deletion requests are stored but not executed.
- Mobile has no submission, correction, review, or reporting workflow.
- Category and location references are planned but not populated or consumed.
- Business photo selection exists in the web interface, but upload/storage is not complete.
- There is no analytics, crash reporting, operational alerting, or moderation SLA reporting.

## 7. Product surfaces and information architecture

### 7.1 Android consumer application

Primary navigation:

- **Explorer**: home/discovery entry point.
- **Favoris**: saved businesses.
- **Profil**: authentication, account information, support, and legal actions.

Secondary routes:

- Search results with active keyboard focus.
- Business details.
- Reviews list and review composer.
- Report/correction form.
- Business submission entry point.
- Location selector.
- Account deletion status.

The search experience is a route, not a permanent bottom-navigation destination.

### 7.2 Public website

- Product explanation and download messaging.
- Business onboarding entry point.
- Privacy, terms, support, and deletion information.
- Future deep links to public business profiles where useful.

### 7.3 Business portal

- Account access.
- New submission.
- Submission status and requested corrections.
- Claimed business management in a later release.
- Image and document management.

### 7.4 Admin portal

- Verification queue.
- Potential duplicates.
- Published, rejected, closed, and callback views.
- Imported sources and business submissions.
- Review moderation.
- Deletion and correction requests.
- Taxonomy/location administration.
- Audit history and operational metrics.

## 8. Functional requirements

Priority definitions:

- **P0**: required before the first public Android release.
- **P1**: required shortly after launch or for a complete marketable product.
- **P2**: valuable expansion after core usage and operations are proven.

### 8.1 Directory and discovery

#### DIR-001 — Approved catalog only (P0)

Consumers may read only businesses with `status == approved`. Internal source, reviewer, duplicate, and registry fields must never be copied into public documents.

Acceptance criteria:

- A guest can load approved businesses without signing in.
- A pending, rejected, closed, or duplicate record cannot be retrieved by a consumer query.
- Empty and unavailable states are distinct and localized.
- Removing approval makes a business disappear from subsequent consumer reads.

#### DIR-002 — Location selection (P0)

The app must let the user choose a supported city/area rather than permanently presenting Conakry as a fixed value.

Acceptance criteria:

- The last selected location persists locally.
- Users can browse without granting device location.
- Device location is requested only after a clear action and explanation.
- Location-denied and location-unavailable states remain usable.

#### DIR-003 — Search (P0)

Users can search by normalized business name, category, service, neighborhood, and useful aliases.

Acceptance criteria:

- The search field receives keyboard focus when opened intentionally.
- Results update without shifting bottom navigation into the keyboard area.
- Accents and letter case do not block reasonable matches.
- A clear empty state suggests broader terms or categories.
- Search never exposes unapproved records.

For the initial Conakry catalog, client-side search is acceptable if the approved dataset remains small. A dedicated search index becomes mandatory when download size, latency, typo tolerance, or ranking quality exceeds agreed thresholds.

#### DIR-004 — Filtering and sorting (P0/P1)

- P0: category and supported location filters.
- P0: verified status must be accurate, not inferred.
- P1: “Open now” after structured hours and timezone logic exist.
- P1: “Nearby” after permission-aware distance calculation exists.
- P1: rating sort after real moderated reviews exist.

Unavailable filters must be hidden rather than shown with invented values.

#### DIR-005 — Business details (P0)

Business details show only available, verified fields: name, category, location, contact methods, description, services, images, verification indicator, and last-confirmed context where appropriate.

Acceptance criteria:

- Missing phone, WhatsApp, image, hours, or address fields produce no dead control.
- Phone and WhatsApp values are normalized before opening external apps.
- Directions use validated coordinates when present and a safe address fallback otherwise.
- No static or demo review appears when the backend has no review.

#### DIR-006 — Share (P1)

The native share sheet provides a stable business link plus a readable fallback containing the business name and key contact/location information.

### 8.2 Authentication and account lifecycle

#### AUTH-001 — Guest browsing (P0)

Home, search, and approved business details work without authentication. Guest favorites may remain local until the user signs in.

#### AUTH-002 — Sign-in methods (P0/P1)

- P0 Android: Google and phone/SMS after production verification.
- P0 web business portal: email/password with password reset.
- P1 iOS: Sign in with Apple and Google.

Acceptance criteria:

- Cancellation is not presented as an error.
- Provider errors use actionable, localized messages.
- Sessions persist across restart.
- Switching accounts never exposes the prior account’s favorites or private records.

#### AUTH-003 — User profile (P0)

Create `users/{uid}` on first authenticated use and safely fill missing provider display information later. Provider-controlled email and identifiers cannot be edited through Firestore writes.

#### AUTH-004 — Account deletion (P0)

Users can request deletion from the app and web. A trusted server process must re-authenticate or verify recency where required, delete or anonymize owned data according to policy, delete the Firebase Authentication user, record a non-identifying completion audit, and communicate completion or failure.

Creating a `deletionRequests` document alone does not satisfy this requirement.

#### AUTH-005 — Roles and claims (P0)

Administrative access uses Firebase custom claims issued only through a trusted operator process. The product must define how admins are added, removed, reviewed, and recovered.

### 8.3 Favorites

#### FAV-001 — Guest favorites (P0)

Guests can save and remove favorites locally.

#### FAV-002 — Cloud favorites (P0)

Authenticated favorites synchronize through `users/{uid}/favorites/{businessId}`.

Acceptance criteria:

- Writes are optimistic but visibly recover after failure.
- Duplicate favorite documents are impossible.
- On first sign-in, the user is offered or automatically given a documented merge strategy for guest favorites.
- A deleted/unpublished business does not break the favorites screen.

### 8.4 Reviews and ratings

#### REV-001 — Review reading (P1)

Only approved reviews are public. A signed-in author can see the status of their own pending or rejected review where policy permits.

#### REV-002 — Review submission (P1)

Authenticated consumers can submit one active review per business, with a 1–5 rating and bounded text. Editing creates a re-moderation event.

Acceptance criteria:

- New or edited reviews start as `pending`.
- Clients cannot set an approved status.
- Rate limits and abuse checks apply.
- Users can report reviews.
- The UI states that publication is moderated.

#### REV-003 — Trusted aggregates (P1)

A server-side transaction or function recalculates `rating` and `reviewCount` from approved reviews whenever moderation changes their public state.

Acceptance criteria:

- Client writes cannot modify aggregates.
- Aggregate values reconcile with approved reviews.
- Deleting, rejecting, or restoring a review updates aggregates idempotently.

#### REV-004 — Moderation (P1)

Admins can approve, reject, hide, and inspect reported reviews. Every decision creates an immutable audit event.

### 8.5 Business submissions, claims, and corrections

#### BUS-001 — Business submission (P0 web, P1 mobile)

An authenticated representative submits identity, category, location, contacts, description, services, authorization consent, and optional images. New submissions remain private and `pending`.

#### BUS-002 — Submission status (P1)

Submitters can view `pending`, `in_progress`, `correction_required`, `approved`, `rejected`, or `withdrawn` status and respond to correction requests without editing moderator-only fields.

#### BUS-003 — Claim an existing business (P1)

A representative can request control of an existing listing. Claim approval requires evidence and never automatically transfers ownership.

#### BUS-004 — Suggest a correction (P0/P1)

- P0: consumers can report incorrect contact/location or a permanently closed business.
- P1: verified representatives can submit structured updates.

All corrections enter moderation. Public data is not edited directly by consumers or business users.

#### BUS-005 — Images (P1)

Images upload to Firebase Storage using ownership-scoped paths, file-type and size restrictions, malware/abuse considerations, and moderator approval. Orphaned uploads are removed automatically.

### 8.6 Moderation and publishing

#### MOD-001 — Unified queue (P0)

Imported records and business submissions appear in a unified operational queue while preserving their source type.

#### MOD-002 — Verification checklist (P0)

Approval requires confirmed identity/activity and coherent location. Contact, duplicate, registry, and image checks are recorded separately.

#### MOD-003 — Duplicate management (P0)

Reviewers can compare likely duplicates and link, merge, or reject them without losing source provenance.

#### MOD-004 — Atomic publication (P0)

Approval atomically creates or updates `businesses/{businessId}`, links the private source record, records reviewer identity and time, and creates an immutable audit event.

#### MOD-005 — Corrections and rollback (P1)

Published changes retain before/after history. Administrators can unpublish or restore a prior valid state without deleting the source record.

#### MOD-006 — Operational states (P0)

The canonical internal record states are:

`review_required → in_progress → approved | rejected | duplicate | closed | not_found | callback`

Business submissions additionally support `pending`, `correction_required`, and `withdrawn`. State transitions must be validated server-side or by restrictive rules, not only by UI controls.

### 8.7 Categories and geography

#### TAX-001 — Canonical categories (P0)

Populate `categories` with stable IDs, French labels, optional aliases, icons, order, and active state. Business records reference IDs, not mutable display labels alone.

#### GEO-001 — Canonical locations (P0)

Populate the Guinea hierarchy from region through supported local levels. Keep source attribution and a review status because imported administrative labels require local confirmation.

#### GEO-002 — Geographic expansion (P2)

Expansion beyond Conakry occurs only when the moderation capacity, minimum useful catalog, and local reference quality for the next location meet a defined launch gate.

### 8.8 Support and notifications

#### SUP-001 — Support (P0)

Privacy, terms, support, and deletion routes are reachable in the app and web. Support requests receive a trackable reference and published response expectation.

#### NOT-001 — Transactional notifications (P1)

Notify users or business representatives about submission status, correction requests, claim decisions, review decisions, and deletion completion. Users control optional marketing notifications separately.

## 9. End-to-end workflows

### 9.1 Consumer discovery

1. User opens the app as a guest or signed-in consumer.
2. App loads supported location and approved catalog state.
3. User browses categories or opens search.
4. User filters results and opens a business.
5. User reviews verified information.
6. User calls, messages, opens directions, shares, or saves the business.
7. The app records privacy-safe product analytics for the action.

### 9.2 Imported record publication

1. Importer writes only to `businessRecords` with provenance and `review_required`.
2. Reviewer starts work, moving the record to `in_progress`.
3. Reviewer validates identity, activity, location, contact, duplicate risk, and evidence.
4. Reviewer corrects normalized public fields.
5. Approval transaction writes the public business, updates the source record, and creates an audit entry.
6. Consumer clients receive the approved listing.

### 9.3 Business submission

1. Representative creates or signs into a business account.
2. Representative completes required identity, location, contact, and consent fields.
3. Images upload to a private pending path.
4. Submission is created as `pending`.
5. Moderator verifies authority and business data.
6. Moderator requests corrections, rejects, links to an existing business, or approves.
7. Representative is notified of the result.

### 9.4 Review lifecycle

1. Signed-in consumer submits rating and text.
2. Review is stored as `pending` and is visible only to its author and admins.
3. Moderator approves or rejects it.
4. Trusted backend recalculates public aggregates.
5. Approved review becomes readable on the business profile.

### 9.5 Account deletion

1. Signed-in user requests deletion and confirms the consequences.
2. Backend validates authentication recency and records the request.
3. Personal profile, favorites, pending submissions/reviews, and owned uploads are deleted or anonymized according to policy.
4. Published contributions follow the documented retention/anonymization policy.
5. Firebase Authentication account is deleted.
6. User receives confirmation; failures enter an admin queue without exposing secrets.

## 10. Data and backend architecture

### 10.1 Recommended architecture

Use Firebase as the backend platform, with direct client access only for operations that can be safely authorized by Firestore/Storage rules. Use trusted Cloud Functions or an equivalent server environment for privileged, aggregate, lifecycle, notification, and abuse-sensitive operations.

### 10.2 Core collections

- `businessRecords/{recordId}`: private imported source and moderation data.
- `submissions/{submissionId}`: private business-representative submissions.
- `businesses/{businessId}`: approved public business profiles.
- `businesses/{businessId}/reviews/{reviewId}`: moderated consumer reviews.
- `users/{uid}`: private consumer profile.
- `users/{uid}/favorites/{businessId}`: private saved-business references.
- `categories/{categoryId}`: public taxonomy.
- `locations/{locationId}`: public geographic hierarchy.
- `correctionRequests/{requestId}`: consumer or representative corrections.
- `businessClaims/{claimId}`: ownership/representation requests.
- `deletionRequests/{uid}`: account deletion workflow.
- `adminAudit/{auditId}`: immutable moderation and privileged-operation history.
- `reports/{reportId}`: abuse, review, listing, or policy reports.

### 10.3 Required trusted backend operations

- Issue and revoke admin/moderator custom claims through a controlled operator workflow.
- Publish or unpublish businesses atomically if client-side admin writes are replaced.
- Recalculate rating aggregates from approved reviews.
- Execute account deletion and data cleanup.
- Process image variants and remove orphaned files.
- Send transactional notifications.
- Apply rate limits and abuse controls to reviews, submissions, claims, corrections, and reports.
- Run scheduled integrity checks for missing references and aggregate drift.

### 10.4 Data integrity rules

- Public documents contain no private reviewer notes or source snapshots.
- Document IDs are treated as references, never trusted from a stored `id` field.
- Timestamps for lifecycle events are server generated.
- Public ratings are derived, never client supplied.
- Coordinates must fall within Guinea bounds, with tighter checks where practical.
- Phone numbers use normalized international form while preserving an optional display form.
- URLs allow only expected safe protocols.
- Deleting source evidence must not silently delete a published record.

## 11. Security, privacy, and trust

### 11.1 Access model

- Guests: read approved public directory, categories, locations, and approved reviews.
- Consumers: guest access plus own profile, favorites, reviews, corrections, reports, and deletion request.
- Business representatives: consumer access plus own submissions and claims.
- Moderators: scoped moderation access.
- Administrators: role management and privileged operations.

### 11.2 Required safeguards

- Default-deny Firestore and Storage rules.
- App Check for supported production clients after rollout testing.
- Least-privilege Firebase claims; no admin role stored as an editable profile field.
- No service-account keys or private credentials in the repository or client bundle.
- Audit logging for every privileged mutation.
- Rate limiting and abuse monitoring.
- Periodic rules tests using the Firebase Emulator Suite.
- Documented retention periods for pending submissions, rejected reviews, audit records, and deletion requests.
- Consent and licensing records for business images.

### 11.3 Verification language

“Verified” must have a documented meaning. For the initial release it should mean that NIMBA 360 confirmed the business identity/activity and location, with verification evidence recorded internally. It must not imply service quality, legal endorsement, insurance, or a guarantee.

## 12. Non-functional requirements

### 12.1 Performance

- Warm application start to usable home target: under 2 seconds on a representative mid-range Android device, excluding unavoidable network delay.
- Search input response: under 100 ms for locally loaded data.
- Cached directory content should appear before a slow refresh where safe.
- Images use appropriately sized variants and lazy loading.
- Release performance is measured on physical Android hardware, not inferred from debug builds.

### 12.2 Reliability

- User writes are idempotent where retries are possible.
- Network failures never erase locally entered form data without warning.
- Backend jobs expose retry status and dead-letter/error handling.
- The app distinguishes offline, empty, unauthorized, and server-error states.

### 12.3 Accessibility

- Touch targets are approximately 44–48 device-independent pixels.
- Text supports reasonable system scaling without clipping.
- Controls have accessible names and states.
- Color is not the sole status indicator.
- Keyboard focus and screen-reader order are tested on critical flows.

### 12.4 Localization

- Consumer UI launches in French.
- Product strings are extracted so English and relevant Guinean languages can be evaluated later.
- Dates, phone numbers, and numeric formats follow the selected locale.
- Database IDs remain language neutral.

### 12.5 Connectivity and offline behavior

- Previously loaded approved listings and favorites remain readable where technically and legally appropriate.
- Destructive or public write actions require confirmed server completion.
- Forms preserve drafts locally until submitted or intentionally discarded.

### 12.6 Compatibility

- Android is the release-leading platform.
- Define the minimum supported Android version from actual target-device research before store release.
- iOS reaches parity only after Android P0 behavior is stable.
- Web business/admin flows support current major desktop and mobile browsers.

## 13. Analytics and operational measurement

Analytics must avoid collecting sensitive free text, exact location without consent, phone numbers, emails, or private moderation content.

### 13.1 Core product events

- App opened and usable.
- Location selected or location permission result.
- Search submitted, category selected, filter selected, and zero-result search.
- Business viewed.
- Call, WhatsApp, directions, share, and favorite actions.
- Authentication started, succeeded, cancelled, or failed by provider/error class.
- Review, submission, claim, correction, report, and deletion-request milestones.

### 13.2 Launch metrics

- Number of approved, active businesses by category and location.
- Search success rate: searches followed by a business view.
- Contact intent rate: business views followed by call/WhatsApp/directions.
- Zero-result rate and most common unmet queries.
- Favorite rate and returning-user rate.
- Listing accuracy report rate.
- Verification throughput, median review age, and rework rate.
- Crash-free sessions and backend error rate.

Exact targets require a baseline and product-owner approval. The roadmap should not invent growth targets before measurement is available.

## 14. Delivery roadmap

Timelines are deliberately expressed as gated phases rather than promises. Duration depends heavily on moderation staffing, Firebase billing, policy decisions, and catalog quality.

### Phase 0 — Product decisions and specification baseline

Objective: agree on what is being built before further feature work.

Deliverables:

- Approve this specification or record revisions.
- Assign product, engineering, data-review, privacy, and support owners.
- Resolve the blocking decisions in Section 18.
- Define the meaning of “verified.”
- Define launch categories and minimum catalog targets.
- Define moderation and support service levels.

Exit gate:

- Product owner marks version 1.0 approved.
- Every P0 feature has an owner and acceptance criteria.
- No unresolved decision blocks security, data retention, or initial launch scope.

### Phase 1 — Backend, security, and operational foundation

Objective: create the trusted services required for consumer writes and production operations.

Deliverables:

- Enable and configure the selected trusted server runtime.
- Implement role-management procedure.
- Add emulator-backed Firestore and Storage rule tests.
- Implement account deletion processor.
- Add error reporting, crash reporting, structured logs, and alerts.
- Establish analytics consent/configuration.
- Add CI checks for lint, types, tests, and deployable configuration.
- Define backup/export and recovery procedures.

Exit gate:

- Privileged workflows cannot be performed by ordinary clients.
- Deletion works end to end in a non-production environment.
- Rules tests cover every role and collection.
- Critical failures are observable and actionable.

### Phase 2 — Verified Conakry catalog

Objective: make the product useful with real, trustworthy data.

Deliverables:

- Populate canonical categories and initial location references.
- Finalize moderation state transitions and duplicate handling.
- Review a prioritized set of the 670 records.
- Publish approved businesses with required contact/location quality.
- Remove all demo ratings, reviews, open states, and distances from live mode.
- Add corrections and unpublishing workflow.

Exit gate:

- The agreed minimum number of businesses is approved across launch categories.
- Every public listing passes required validation.
- No internal fields are readable through consumer clients.
- Catalog sampling meets the agreed accuracy threshold.

### Phase 3 — Android consumer MVP completion

Objective: deliver a coherent, honest, fast consumer experience.

Deliverables:

- Location selection and permission-aware nearby behavior.
- Accurate search, category filtering, business detail, favorite merge, contact actions, and sharing.
- Remove the hardcoded review and unsupported controls.
- Complete Google and phone production authentication.
- In-app correction/report flow.
- Production empty, offline, loading, and error states.
- Accessibility and physical-device performance pass.

Exit gate:

- All P0 consumer acceptance criteria pass on target Android devices.
- Release build meets performance and crash-free thresholds.
- Privacy, support, terms, and deletion flows are functional.
- Closed beta feedback contains no unresolved critical issue.

### Phase 4 — Business onboarding and maintenance

Objective: let legitimate businesses contribute without weakening data quality.

Deliverables:

- Complete web submission persistence for all represented fields.
- Private image upload and moderation.
- Submission status and correction-request loop.
- Claim-existing-business workflow.
- Representative update requests and notification delivery.
- Mobile submission entry point if confirmed as P1.

Exit gate:

- Submitters can track status without contacting an administrator manually.
- No submission can directly overwrite a public business.
- Images and claims meet authorization and moderation requirements.

### Phase 5 — Reviews and trust signals

Objective: add genuine consumer feedback with controlled abuse risk.

Deliverables:

- Review composer, author history/status, public review list, and reports.
- Admin review moderation queue.
- Trusted rating aggregation.
- Abuse limits and audit trail.
- Clear review policy and enforcement guidance.

Exit gate:

- Aggregate reconciliation tests pass.
- Unapproved reviews are inaccessible publicly.
- Moderators can handle reports and reversals safely.
- No demo review content remains.

### Phase 6 — Public launch hardening

Objective: release and operate the product safely.

Deliverables:

- Store listing, privacy disclosures, screenshots, support contact, and release notes.
- Production signing, App Check rollout, monitoring, alerting, and rollback plan.
- Load, security, accessibility, low-connectivity, and upgrade testing.
- Support and moderation runbooks.
- Launch dashboard for catalog, search, contact intent, accuracy, and stability.

Exit gate:

- Product, engineering, operations, and privacy owners sign the launch checklist.
- Rollback and incident contacts are confirmed.
- No unresolved P0 defect remains.

### Phase 7 — National expansion and optimization

Objective: expand carefully based on evidence.

Candidate work:

- Additional cities and regions.
- Typo-tolerant hosted search.
- Additional languages.
- Business performance insights.
- Clearly labeled premium business tools.
- iOS parity and store launch.
- Structured opening hours, holiday schedules, and enhanced maps.

Each expansion area requires its own catalog and moderation readiness gate.

## 15. Testing strategy

### 15.1 Automated

- Type checking and linting.
- Unit tests for normalization, mapping, status transitions, and validation.
- Firestore and Storage rules tests for guest, owner, representative, moderator, and admin roles.
- Backend idempotency and aggregate tests.
- Integration tests against Firebase emulators.
- Critical UI-flow tests for search, favorites, authentication, submission, review, and deletion.

### 15.2 Manual device matrix

- Representative low/mid-range Android device.
- Modern Android device.
- Small and large screen sizes.
- Gesture and three-button system navigation.
- Slow, intermittent, and offline networks.
- Fresh install, upgrade, signed-out, signed-in, and account-switch states.
- Font scaling and screen-reader checks.

### 15.3 Data quality validation

- Random sampling of approved listings.
- Duplicate review.
- Invalid phone and coordinate detection.
- Broken contact/link monitoring.
- Stale listing review based on last verification date and user reports.

## 16. Release criteria for the first public Android version

The release is ready only when all conditions below are true:

- A useful, approved Conakry catalog meets the agreed category and volume threshold.
- Search and business details contain no demo or fabricated trust signals.
- Google and selected fallback authentication work in release builds.
- Guest and cloud favorites behave predictably.
- Contact, directions, and correction/report actions work.
- Account deletion is processed, not merely requested.
- Firestore/Storage rules have automated authorization coverage.
- Crash reporting, backend monitoring, and support processes are active.
- Legal pages accurately describe real data use and retention.
- Physical-device performance and accessibility checks pass.
- Product and operations owners accept the moderation workload.

## 17. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Insufficient verified catalog | App feels empty | Launch only after category/location minimums are met; prioritize high-intent records |
| Incorrect imported data | Loss of trust or harm | Never auto-publish; require evidence and audit decisions |
| Moderation backlog | Stale submissions and reviews | Define staffing, queue priorities, SLAs, and backlog metrics |
| Fake reviews or claims | Reputation damage | Authentication, rate limits, evidence, moderation, reporting, audit history |
| Direct-client privilege escalation | Data compromise | Default-deny rules, custom claims, emulator tests, trusted backend for sensitive operations |
| Incomplete deletion | Privacy and store-compliance risk | Server-managed deletion workflow with retries and completion audit |
| Poor connectivity | Abandonment | Cache safe reads, preserve drafts, optimize payloads/images, honest offline states |
| Firebase cost growth | Unplanned operating expense | Query/index review, budgets, alerts, pagination, image limits, aggregation design |
| Category/location inconsistency | Weak search and analytics | Canonical IDs and managed references before catalog growth |
| “Verified” misunderstood | Legal and trust risk | Publish a precise definition and avoid implying service quality or government endorsement |

## 18. Open product decisions

These decisions require explicit product-owner approval:

1. What exact checks qualify a business for the “Vérifié” badge?
2. How many approved businesses, categories, and communes constitute a useful Conakry launch catalog?
3. Which categories are in the first launch, and are any sensitive categories excluded or subject to stronger verification?
4. Is phone/SMS authentication required for launch, or is Google sufficient as the consumer fallback?
5. Should guest favorites merge automatically on sign-in or require confirmation?
6. Can consumers submit reviews at launch, or should reviews wait until moderation staffing is ready?
7. What happens to public reviews and business submissions when a user deletes their account: delete, anonymize, or retain under a documented basis?
8. What proof is required to claim an existing business?
9. Who can issue and revoke moderator/admin claims, and how is that action audited?
10. What are the support and moderation response targets?
11. Which analytics and crash-reporting vendors are approved, and what consent is required?
12. What is the minimum supported Android version and target hardware profile?
13. Are business submissions free indefinitely, and what future premium features are acceptable?
14. Which Guinean administrative source is authoritative for production location labels?

## 19. Definition of done for any feature

A feature is done only when:

- Its requirement and priority exist in this specification or an approved amendment.
- User-visible behavior and edge cases have acceptance criteria.
- Loading, empty, offline, error, unauthorized, and retry states are handled where relevant.
- Security rules and trusted backend authorization are implemented and tested.
- Analytics and operational logging are included where approved.
- Accessibility and localization are reviewed.
- Automated and physical-device tests pass.
- Documentation and runbooks are updated.
- Demo or placeholder behavior cannot be mistaken for production data.
- The change is reviewed, deployed through the approved environment process, and has a rollback path.

## 20. Immediate next step

Hold a product-spec review focused on Sections 3, 8, 14, 16, and 18. Record decisions directly in this document, promote it to version 1.0, and then convert Phase 1 and Phase 2 into an implementation backlog. Until that review is complete, work should be limited to critical fixes, documentation, and reversible investigation.
