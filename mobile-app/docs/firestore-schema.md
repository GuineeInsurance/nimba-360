# Firestore schema — NIMBA 360 business directory

The public directory and the internal review workflow are intentionally separated. Public business documents never contain reviewer notes, duplicate signals, registry research, or internal source-management fields.

## Collections

### `businesses/{businessId}`

Public business profiles. Mobile clients may read only documents whose `status` is `approved`. Administrators publish and update these documents after verification.

Core groups of fields:

- Identity: `name`, `normalizedName`, `aliases`, `categoryId`, `categoryLabel`, `subcategoryId`
- Address: `cityId`, `city`, `communeId`, `commune`, `neighborhood`, `streetAddress`, `address`
- Contact: `phone`, `whatsapp`, `email`, `website`
- Map: `latitude`, `longitude`, `geohash`
- Discovery: `services`, `description`, `imageUrl`, `imageUrls`, `priceLevel`, `openingHours`, `isOpen`
- Trust: `verified`, `verificationLevel`, `status`
- Aggregates: `rating`, `reviewCount`
- Audit: `createdAt`, `updatedAt`, `publishedAt`

`rating` and `reviewCount` are server-managed aggregates. Clients must not calculate or write them directly.

### `businessRecords/{recordId}`

Private ingestion and moderation records imported from the review tracker. Only administrators can access this collection.

It retains the source business fields, `sourceId`, `sourceUrl`, `sourceType`, `importStatus`, review ownership and dates, APIP/RCCM research, reviewer comments, duplicate keys, the raw source snapshot, and the published `businessId` when approved.

Tracker status mapping:

| Review tracker | Firestore `reviewStatus` |
|---|---|
| À vérifier | `review_required` |
| En cours | `in_progress` |
| Vérifié - approuvé | `approved` |
| Rejeté | `rejected` |
| Doublon | `duplicate` |
| Fermé | `closed` |
| Introuvable | `not_found` |
| À rappeler | `callback` |

### `categories/{categoryId}`

Canonical categories used by search filters and submission forms. Documents contain `label`, `slug`, `icon`, `sortOrder`, and `active`.

### `locations/{locationId}`

A nationwide hierarchy for regions, prefectures, cities, communes, and subprefectures. Each document contains `name`, `slug`, `type`, `parentId`, and `active`.

### `businesses/{businessId}/reviews/{reviewId}`

Authenticated users can submit a rating from 1–5 and text up to 2,000 characters. New reviews start as `pending`; only approved reviews are public.

### `users/{uid}`

Private user profile with a `favorites/{businessId}` subcollection. Authorization roles are stored as Firebase Authentication custom claims, not editable Firestore fields.

### `submissions/{submissionId}`

Business suggestions from authenticated users. New submissions always start as `pending`. The submitter and administrators can read them; only administrators can change moderation status.

## Search strategy

Firestore supports structured filtering, not full-text search. The MVP uses `normalizedName`, `categoryId`, `cityId`, and rating indexes. When typo-tolerant search becomes necessary, add a dedicated search service while keeping Firestore as the source of truth.

## Publication workflow

1. Import a spreadsheet row into `businessRecords`.
2. Review sources, contact details, APIP/RCCM evidence, and duplicate signals.
3. If approved, create or update the public `businesses` document.
4. Link the private record through `businessId` and mark it `approved`.
5. Rejected, duplicate, closed, and unlocated records remain private.

Run `npm run data:import:dry-run` to validate the current source file and inspect duplicate counts without contacting Firebase. The importer writes only to `businessRecords` and requires the explicit `--commit` flag plus Google Application Default Credentials before it can modify Firestore.

## Security boundary

The rules in `firestore.rules` deny access by default. Public users can read approved directory content. Signed-in users control only their own profile, favorites, reviews, and submissions. Administrative writes require the `admin: true` custom claim.

The Firestore database has not been created yet because its geographic location is permanent. Choose the production location before deployment; for Guinea, compare a nearby European regional location with the European multi-region option based on latency, durability, and cost.
