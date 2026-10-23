#!/usr/bin/env python3
"""Pull named public POIs in the Conakry metro area from OpenStreetMap.

The output is intentionally a review queue, not an automatically published
directory. OpenStreetMap records can be incomplete or stale and must be
verified before Guinée 360 publishes them.
"""

from __future__ import annotations

import csv
import json
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
RAW_PATH = DATA_DIR / "osm-conakry-pois-raw.json"
JSON_PATH = DATA_DIR / "conakry-businesses-review.json"
CSV_PATH = DATA_DIR / "conakry-businesses-review.csv"
PRIORITY_JSON_PATH = DATA_DIR / "conakry-businesses-priority-review.json"
PRIORITY_CSV_PATH = DATA_DIR / "conakry-businesses-priority-review.csv"

# Metro-area bounding box. This includes the city and nearby Dubreka/Coyah
# fringe, so locality fields are retained and every record requires review.
BBOX = "9.43,-13.86,9.78,-13.48"
OVERPASS_URL = "https://overpass.kumi.systems/api/interpreter"

QUERY = f"""
[out:json][timeout:180];
(
  nwr["name"]["amenity"]({BBOX});
  nwr["name"]["shop"]({BBOX});
  nwr["name"]["tourism"]({BBOX});
  nwr["name"]["office"]({BBOX});
  nwr["name"]["craft"]({BBOX});
  nwr["name"]["leisure"]({BBOX});
  nwr["name"]["healthcare"]({BBOX});
);
out center tags;
"""


def first(tags: dict[str, str], *keys: str) -> str:
    return next((str(tags[key]).strip() for key in keys if tags.get(key)), "")


def classify(tags: dict[str, str]) -> tuple[str, str]:
    amenity = tags.get("amenity", "")
    shop = tags.get("shop", "")
    tourism = tags.get("tourism", "")
    office = tags.get("office", "")
    craft = tags.get("craft", "")
    leisure = tags.get("leisure", "")
    healthcare = tags.get("healthcare", "")

    if amenity in {"bar", "pub"}:
        return "Divertissement / Entertainment", "Bars et lounges"
    if amenity in {"restaurant", "fast_food", "cafe", "ice_cream"}:
        return "Restaurants", {
            "restaurant": "Restaurants", "fast_food": "Fast-food",
            "cafe": "Cafés", "ice_cream": "Cafés",
        }[amenity]
    if amenity in {"hospital", "clinic", "pharmacy", "doctors", "dentist"} or healthcare:
        value = healthcare or amenity
        return "Santé", {
            "hospital": "Hôpitaux", "clinic": "Cliniques", "pharmacy": "Pharmacies",
            "doctor": "Cliniques", "doctors": "Cliniques", "dentist": "Cliniques",
            "laboratory": "Laboratoires",
        }.get(value, "Cliniques")
    if tourism in {"hotel", "hostel", "guest_house", "motel", "apartment"}:
        return "Hôtels", {
            "hotel": "Hôtels", "hostel": "Auberges", "guest_house": "Auberges",
            "motel": "Hôtels", "apartment": "Résidences meublées",
        }[tourism]
    if tourism in {"attraction", "museum", "viewpoint", "information"}:
        return "Tourisme", "Sites touristiques"
    if amenity in {"school", "college", "university", "kindergarten", "driving_school"}:
        return "Éducation", {
            "school": "Écoles", "kindergarten": "Écoles", "college": "Universités",
            "university": "Universités", "driving_school": "Auto-écoles",
        }[amenity]
    if amenity in {"bank", "microfinance", "bureau_de_change", "money_transfer"}:
        return "Banques et finances", {
            "bank": "Banques", "microfinance": "Microfinance",
            "bureau_de_change": "Bureaux de change", "money_transfer": "Bureaux de change",
        }[amenity]
    if leisure in {"fitness_centre", "sports_centre", "stadium", "pitch", "swimming_pool"}:
        return "Sports", {
            "fitness_centre": "Fitness", "sports_centre": "Infrastructures sportives",
            "stadium": "Infrastructures sportives", "pitch": "Infrastructures sportives",
            "swimming_pool": "Natation",
        }[leisure]
    if amenity in {"cinema", "theatre", "nightclub", "arts_centre"} or leisure:
        return "Divertissement / Entertainment", {
            "cinema": "Cinémas", "theatre": "Théâtres", "nightclub": "Discothèques et clubs",
            "arts_centre": "Centres de loisirs",
        }.get(amenity or leisure, "Centres de loisirs")
    if amenity in {"townhall", "courthouse", "police", "fire_station", "post_office"} or office == "government":
        return "Administration publique", {
            "townhall": "Mairies et communes", "courthouse": "Justice",
            "police": "Sécurité publique", "fire_station": "Sécurité publique",
            "post_office": "Emploi et services sociaux",
        }.get(amenity, "Ministères")
    if shop:
        if shop in {"car", "car_parts", "tyres", "car_repair"}:
            return "Automobile", {
                "car": "Concessionnaires automobiles", "car_parts": "Pièces détachées",
                "tyres": "Pièces détachées", "car_repair": "Garages",
            }[shop]
        if shop in {"computer", "mobile_phone"}:
            return "Technologie", {
                "computer": "Informatique", "mobile_phone": "Téléphonie",
            }[shop]
        if shop == "electronics":
            return "Commerces", "Électronique"
        if shop in {"supermarket", "convenience", "mall", "department_store", "clothes", "boutique"}:
            return "Commerces", {
                "supermarket": "Supermarchés", "convenience": "Boutiques",
                "mall": "Centres commerciaux", "department_store": "Galeries commerciales",
                "clothes": "Habillement", "boutique": "Boutiques",
            }[shop]
        if shop in {"bakery", "pastry"}:
            return "Restaurants", "Boulangeries"
        return "Commerces", "Boutiques"
    if craft:
        return "Ouvriers", {
            "carpenter": "Menuisiers", "electrician": "Électriciens du bâtiment",
            "plumber": "Plombiers", "welder": "Soudeurs", "painter": "Peintres en bâtiment",
            "tiler": "Carreleurs", "bricklayer": "Maçons",
        }.get(craft, "Manœuvres")
    if office:
        if office == "ngo":
            return "Associations", "ONG"
        return "Services professionnels", {
            "lawyer": "Avocats", "notary": "Notaires", "accountant": "Comptables",
            "consulting": "Consultants",
        }.get(office, "Consultants")
    return "Autres", "Autres services"


def normalize(element: dict) -> dict:
    tags = element.get("tags", {})
    center = element.get("center", {})
    lat = element.get("lat", center.get("lat"))
    lon = element.get("lon", center.get("lon"))
    category, subcategory = classify(tags)
    locality = first(tags, "addr:city", "addr:town", "addr:municipality", "is_in:city")
    district = first(tags, "addr:suburb", "addr:district", "addr:city_district", "addr:quarter")
    phone = first(tags, "contact:phone", "phone", "mobile", "contact:mobile")
    website = first(tags, "contact:website", "website", "url")
    email = first(tags, "contact:email", "email")
    whatsapp = first(tags, "contact:whatsapp", "whatsapp")
    street = " ".join(filter(None, [first(tags, "addr:housenumber"), first(tags, "addr:street")])).strip()
    if not street:
        street = first(tags, "addr:full", "addr:place")
    source_id = f"{element.get('type')}/{element.get('id')}"
    return {
        "sourceId": source_id,
        "sourceUrl": f"https://www.openstreetmap.org/{source_id}",
        "name": first(tags, "name:fr", "name"),
        "category": category,
        "subcategory": subcategory,
        "city": locality or "Conakry (à vérifier)",
        "district": district,
        "streetAddress": street,
        "phone": phone,
        "email": email,
        "website": website,
        "whatsapp": whatsapp,
        "latitude": lat,
        "longitude": lon,
        "osmTags": {key: tags[key] for key in sorted(tags) if key not in {"name"}},
        "status": "review_required",
    }


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    request_url = OVERPASS_URL + "?" + urllib.parse.urlencode({"data": QUERY})
    request = urllib.request.Request(
        request_url,
        headers={"User-Agent": "Guinee360-MVP-data-import/1.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=240) as response:
            payload = json.load(response)
    except (urllib.error.HTTPError, urllib.error.URLError) as error:
        code = getattr(error, "code", "network error")
        details = error.read().decode("utf-8", errors="replace") if hasattr(error, "read") else str(error)
        if RAW_PATH.exists():
            print(f"Overpass returned {code}; using the cached raw response.")
            payload = json.loads(RAW_PATH.read_text(encoding="utf-8"))
        else:
            raise RuntimeError(
                f"Overpass returned {code}: {details[:2000]}"
            ) from error
    RAW_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    records = [normalize(item) for item in payload.get("elements", [])]
    records = [item for item in records if item["name"]]
    records.sort(key=lambda item: (item["category"], item["name"].casefold()))

    result = {
        "attribution": "© OpenStreetMap contributors, Open Database License (ODbL)",
        "source": "https://www.openstreetmap.org/copyright",
        "retrievalScope": "Named public POIs in the Conakry metro bounding box",
        "publicationRule": "Verify every record before publishing; imported records are review_required.",
        "count": len(records),
        "records": records,
    }
    JSON_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    fields = [key for key in records[0] if key != "osmTags"] if records else []
    with CSV_PATH.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows({key: row.get(key, "") for key in fields} for row in records)

    priority_records = [
        row for row in records
        if row["phone"] or row["website"] or row["streetAddress"] or row["district"]
    ]
    priority_result = {
        **{key: value for key, value in result.items() if key not in {"count", "records"}},
        "selectionRule": "Has a phone, website, street address, or district in OpenStreetMap.",
        "count": len(priority_records),
        "records": priority_records,
    }
    PRIORITY_JSON_PATH.write_text(
        json.dumps(priority_result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    with PRIORITY_CSV_PATH.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows({key: row.get(key, "") for key in fields} for row in priority_records)

    print(json.dumps({
        "records": len(records),
        "with_phone": sum(bool(r["phone"]) for r in records),
        "with_website": sum(bool(r["website"]) for r in records),
        "with_address": sum(bool(r["streetAddress"] or r["district"]) for r in records),
        "priority_review": len(priority_records),
        "json": str(JSON_PATH),
        "csv": str(CSV_PATH),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
