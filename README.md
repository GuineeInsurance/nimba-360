# NIMBA 360

NIMBA 360 est une plateforme de découverte et de vérification d'entreprises en Guinée. Le projet comprend une application mobile multiplateforme, un site public et un portail web destiné aux entreprises et aux administrateurs.

La vision produit, les exigences fonctionnelles, les critères de lancement et la feuille de route sont définis dans [PRODUCT_SPEC.md](PRODUCT_SPEC.md). Ce document doit être mis à jour avant toute modification importante du périmètre.

## Composants

- `flutter-app/` — application mobile Flutter pour Android, avec iOS prévu après validation Android.
- `web-app/dist/` — site marketing, inscription d'entreprises, pages légales et administration.
- `web-app/firestore.rules` — règles d'accès Firebase fondées sur les rôles.
- `data/` — données sources et fichiers de revue avant publication.
- `scripts/` — collecte et préparation des données.
- `outputs/data-review/` — classeur de revue destiné aux opérations.

## État du MVP

- Authentification Firebase par e-mail et mot de passe.
- Soumission de fiches d'entreprise depuis le web.
- File privée de vérification administrateur.
- 670 fiches OpenStreetMap de la zone de Conakry importées pour revue.
- Détection initiale de 89 doublons potentiels.
- Approbation transactionnelle vers la collection publique `businesses`.
- Historique d'audit des décisions de modération.
- Pages de confidentialité, conditions, assistance et suppression de compte.
- Hébergement Firebase : <https://guinee-directory-mvp.web.app>

Les fiches importées ne sont jamais publiées automatiquement. Chaque fiche doit être contrôlée par un administrateur avant d'être visible dans l'application.

## Développement mobile

Prérequis : Flutter 3.32.8, Dart 3.8.1 et l'outillage Android.

```powershell
cd flutter-app
flutter pub get
flutter analyze
flutter test
flutter run -d <device-id>
```

Générer un APK Android ARM64 optimisé :

```powershell
flutter build apk --release --target-platform android-arm64 --split-per-abi
```

L'application utilise l'identifiant Android `com.nimba360.app` et le projet Firebase `guinee-directory-mvp`. La signature de production doit être configurée avant publication sur le Play Store.

## Développement web

Le site est statique et peut être servi depuis `web-app/dist/`. La configuration publique du client Firebase se trouve dans `web-app/dist/firebase-config.json`. Une clé API Firebase destinée au navigateur n'est pas une clé serveur et l'autorisation effective reste imposée par `firestore.rules`.

Déploiement :

```bash
cd web-app
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

## Collections Firebase

- `businessRecords` — sources privées en cours de vérification.
- `submissions` — fiches proposées par les entreprises.
- `businesses` — fiches approuvées et consultables par le public.
- `adminAudit` — journal immuable des décisions administratives.
- `users/{uid}/favorites` — favoris privés d'un utilisateur.
- `deletionRequests` — demandes de suppression de compte.

L'accès administrateur exige le claim Firebase Auth `admin: true`. Aucun secret, mot de passe ou fichier de compte de service ne doit être ajouté au dépôt.

## Données et attribution

La collecte initiale provient d'OpenStreetMap et couvre la zone métropolitaine de Conakry. Elle n'est pas représentative de toute la Guinée. Consultez [DATA_SOURCES.md](DATA_SOURCES.md) pour les sources, licences, limites et règles de vérification.

Les données OpenStreetMap sont attribuées aux contributeurs OpenStreetMap et distribuées selon l'Open Database License (ODbL). La publication de ce dépôt ne constitue pas une validation des fiches importées.

## Identité

- Nom : NIMBA 360
- Couleurs : rouge `#CE1126`, jaune `#FCD116`, vert `#007A5E`, bleu nuit `#10232D`
- Slogan : « Toute la Guinée à portée de main »
