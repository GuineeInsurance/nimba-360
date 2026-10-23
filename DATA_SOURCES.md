# Données de démarrage — NIMBA 360

Mise à jour : 15 octobre 2026.

## 1. Découpage administratif

Fichiers :

- `data/guinea-administrative-divisions.json` — hiérarchie complète
- `data/guinea-regions.json` — régions et coordonnées
- `data/guinea-prefectures.json` — préfectures et coordonnées
- `data/guinea-sub-prefectures.json` — sous-préfectures/communes et coordonnées

- 8 régions
- 34 entrées au niveau préfecture, dont Conakry
- 340 sous-préfectures/communes de référence
- Coordonnées WGS84 pour les 382 entrées des trois niveaux
- Source : [Open Admin Data — Guinea Administrative Divisions](https://github.com/open-admin-data/guinea-administrative-divisions)
- Licence : CC BY 4.0

Ce référentiel est utile pour remplacer progressivement les champs de commune en
texte libre par des listes dépendantes. Les libellés doivent être revus avec une
source administrative guinéenne avant une mise en production nationale.

## 2. Lieux et activités de Conakry

Fichiers complets :

- `data/conakry-businesses-review.json`
- `data/conakry-businesses-review.csv`

Fichiers prioritaires (au moins un téléphone, site web, adresse ou quartier) :

- `data/conakry-businesses-priority-review.json`
- `data/conakry-businesses-priority-review.csv`

Le jeu complet contient 3 388 lieux nommés. La file prioritaire contient 670
lieux. Parmi le jeu complet, 544 ont un téléphone, 159 un site web et 173 une
adresse ou un quartier renseigné.

- Source : OpenStreetMap via l'API Overpass
- Attribution obligatoire : © les contributeurs OpenStreetMap
- Licence : Open Database License (ODbL)
- Informations de licence : https://www.openstreetmap.org/copyright

Chaque fiche porte le statut `review_required`. Ces données collaboratives ne
doivent pas être publiées automatiquement : l'existence de l'activité, sa
catégorie, sa localisation et ses coordonnées doivent être confirmées.

## 3. Procédure de validation recommandée

1. Commencer par le fichier `conakry-businesses-priority-review.csv`.
2. Ouvrir le lien `sourceUrl` et vérifier le point cartographique.
3. Confirmer le nom, l'activité, le numéro et l'adresse auprès du site officiel
   ou directement auprès de l'entreprise.
4. Corriger la catégorie et la sous-catégorie NIMBA 360 si nécessaire.
5. Obtenir une photo autorisée ; ne pas reprendre automatiquement les images de
   services tiers.
6. Passer la fiche à `approved` uniquement après validation humaine.

## 4. Reproduire la collecte

Exécuter :

```powershell
python scripts\pull_osm_conakry.py
```

Le script conserve aussi `data/osm-conakry-pois-raw.json` comme cache et comme
trace de la réponse source. Si le service Overpass est momentanément indisponible,
les fichiers normalisés sont reconstruits à partir de ce cache.
