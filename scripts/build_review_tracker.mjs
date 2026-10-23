import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = path.join(projectDir, "data", "conakry-businesses-priority-review.csv");
const outputDir = path.join(projectDir, "outputs", "data-review");
const outputPath = path.join(outputDir, "Guinee_360_Data_Review.xlsx");
const previewPath = path.join(outputDir, "Guinee_360_Data_Review_preview.png");
const guidePreviewPath = path.join(outputDir, "Guinee_360_Data_Review_guide_preview.png");

const csvText = await fs.readFile(inputPath, "utf8");
const imported = await Workbook.fromCSV(csvText, { sheetName: "Import" });
const sourceValues = imported.worksheets.getItem("Import").getUsedRange().values;
const sourceHeaders = sourceValues[0].map((value) => String(value ?? "").replace(/^\uFEFF/, ""));
const sourceRows = sourceValues.slice(1).filter((row) => row.some((value) => value !== null && value !== ""));
const sourceIndex = Object.fromEntries(sourceHeaders.map((name, index) => [name, index]));

function value(row, key) {
  const index = sourceIndex[key];
  return index === undefined ? "" : String(row[index] ?? "").trim();
}

function normalizeText(input) {
  return String(input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizePhone(input) {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.startsWith("00224")) digits = digits.slice(2);
  if (digits.length === 9) digits = `224${digits}`;
  return digits;
}

function normalizeWebsite(input) {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return "";
  try {
    const parsed = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  }
}

const workbook = Workbook.create();
const review = workbook.worksheets.add("Revue");
const guide = workbook.worksheets.add("Références");
review.showGridLines = false;
guide.showGridLines = false;
review.tabColor = "#10232D";
guide.tabColor = "#6B7280";

const font = "Arial";
const navy = "#10232D";
const red = "#CE1126";
const yellow = "#FCD116";
const green = "#007A5E";
const lightGray = "#F3F4F6";
const borderGray = "#D1D5DB";

review.getRange("A2:H2").format.borders = { bottom: { style: "thin", color: navy } };
review.getRange("A2").values = [["Guinée 360 — revue des données"]];
review.getRange("A2").format.font = { name: font, size: 15, bold: true, color: navy };
review.getRange("A3").values = [["File prioritaire OpenStreetMap. Chaque fiche doit être vérifiée avant publication."]];
review.getRange("A3").format.font = { name: font, size: 10, italic: true, color: "#4B5563" };

review.getRange("A4:H4").values = [[
  "Total", null, "À vérifier", null, "Approuvés", null, "Doublons possibles", null,
]];
review.getRange("B4").formulas = [[`=COUNTA($W$9:$W$${sourceRows.length + 8})`]];
review.getRange("D4").formulas = [[`=COUNTIFS($A$9:$A$${sourceRows.length + 8},"À vérifier")`]];
review.getRange("F4").formulas = [[`=COUNTIFS($A$9:$A$${sourceRows.length + 8},"Vérifié - approuvé")`]];
review.getRange("H4").formulas = [[`=COUNTIFS($H$9:$H$${sourceRows.length + 8},"Doublon possible")`]];
for (const rangeAddress of ["A4:B4", "C4:D4", "E4:F4", "G4:H4"]) {
  const range = review.getRange(rangeAddress);
  range.format.fill = lightGray;
  range.format.borders = { preset: "outside", style: "thin", color: borderGray };
  range.format.font = { name: font, size: 10, bold: true, color: navy };
  range.format.rowHeight = 24;
}
review.getRange("B4,D4,F4,H4").format.font = { name: font, size: 12, bold: true, color: navy };

review.getRange("A6").values = [["Source initiale : © contributeurs OpenStreetMap (ODbL). Validation légale : APIP/SYNERGUI."]];
review.getRange("A6").format.font = { name: font, size: 9, italic: true, color: "#4B5563" };

const headers = [
  "Statut de revue", "Responsable", "Date de revue", "Vérification APIP", "N° RCCM",
  "Source de vérification", "Commentaires", "Alerte doublon", "Motif doublon", "Nom",
  "Catégorie", "Sous-catégorie", "Ville", "Quartier", "Adresse", "Téléphone", "E-mail",
  "Site web", "WhatsApp", "Latitude", "Longitude", "Source OSM", "ID source", "Statut import",
  "Clé nom + ville", "Clé téléphone", "Clé site",
];
review.getRange("A8:AA8").values = [headers];

const outputRows = sourceRows.map((row) => {
  const name = value(row, "name");
  const city = value(row, "city");
  const phone = value(row, "phone");
  const website = value(row, "website");
  return [
    "À vérifier", "", null, "Non vérifié", "", "", "", "", "", name,
    value(row, "category"), value(row, "subcategory"), city, value(row, "district"),
    value(row, "streetAddress"), phone, value(row, "email"), website, value(row, "whatsapp"),
    Number(value(row, "latitude")) || null, Number(value(row, "longitude")) || null,
    value(row, "sourceUrl"), value(row, "sourceId"), value(row, "status"),
    `${normalizeText(name)}|${normalizeText(city)}`, normalizePhone(phone), normalizeWebsite(website),
  ];
});

const firstDataRow = 9;
const lastDataRow = firstDataRow + outputRows.length - 1;
review.getRange(`A${firstDataRow}:AA${lastDataRow}`).values = outputRows;
review.getRange(`H${firstDataRow}`).formulas = [[`=IF(I${firstDataRow}<>"","Doublon possible","")`]];
review.getRange(`H${firstDataRow}:H${lastDataRow}`).fillDown();
review.getRange(`I${firstDataRow}`).formulas = [[
  `=IF(COUNTIFS($Y$${firstDataRow}:$Y$${lastDataRow},Y${firstDataRow})>1,"Nom + ville",IF(AND(Z${firstDataRow}<>"",COUNTIFS($Z$${firstDataRow}:$Z$${lastDataRow},Z${firstDataRow})>1),"Téléphone",IF(AND(AA${firstDataRow}<>"",COUNTIFS($AA$${firstDataRow}:$AA$${lastDataRow},AA${firstDataRow})>1),"Site web","")))`,
]];
review.getRange(`I${firstDataRow}:I${lastDataRow}`).fillDown();

review.getRange(`A${firstDataRow}:A${lastDataRow}`).dataValidation = {
  rule: { type: "list", values: [
    "À vérifier", "En cours", "Vérifié - approuvé", "Rejeté", "Doublon", "Fermé", "Introuvable", "À rappeler",
  ] },
};
review.getRange(`D${firstDataRow}:D${lastDataRow}`).dataValidation = {
  rule: { type: "list", values: ["Non vérifié", "Trouvé", "Non trouvé", "Non applicable"] },
};

const table = review.tables.add(`A8:AA${lastDataRow}`, true, "Guinee360ReviewTable");
table.style = "TableStyleMedium2";
table.showBandedRows = true;
table.showFilterButton = true;

review.getRange(`A8:AA${lastDataRow}`).format.font = { name: font, size: 10, color: "#111827" };
review.getRange("A8:AA8").format = {
  fill: navy,
  font: { name: font, size: 10, bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "inside", style: "thin", color: "#FFFFFF" },
};
review.getRange("A8:AA8").format.rowHeight = 34;
review.getRange(`A${firstDataRow}:G${lastDataRow}`).format.fill = "#FFFBEA";
review.getRange(`C${firstDataRow}:C${lastDataRow}`).setNumberFormat("yyyy-mm-dd");
review.getRange(`T${firstDataRow}:U${lastDataRow}`).setNumberFormat("0.000000");
review.getRange(`G${firstDataRow}:G${lastDataRow}`).format.wrapText = true;
review.getRange(`A${firstDataRow}:AA${lastDataRow}`).format.verticalAlignment = "center";
review.getRange(`T${firstDataRow}:U${lastDataRow}`).format.horizontalAlignment = "right";

const widths = {
  A: 19, B: 16, C: 13, D: 17, E: 19, F: 26, G: 32, H: 17, I: 15, J: 34,
  K: 24, L: 24, M: 20, N: 18, O: 30, P: 18, Q: 28, R: 32, S: 18, T: 13,
  U: 13, V: 38, W: 20, X: 16, Y: 32, Z: 18, AA: 30,
};
for (const [column, width] of Object.entries(widths)) {
  review.getRange(`${column}:${column}`).format.columnWidth = width;
}
review.freezePanes.freezeRows(8);
review.freezePanes.freezeColumns(2);

review.getRange(`A${firstDataRow}:A${lastDataRow}`).conditionalFormats.add("containsText", {
  text: "Vérifié - approuvé", format: { fill: "#DCFCE7", font: { color: green, bold: true } },
});
review.getRange(`A${firstDataRow}:A${lastDataRow}`).conditionalFormats.add("containsText", {
  text: "Rejeté", format: { fill: "#FEE2E2", font: { color: red, bold: true } },
});
review.getRange(`A${firstDataRow}:A${lastDataRow}`).conditionalFormats.add("containsText", {
  text: "À vérifier", format: { fill: "#FEF3C7", font: { color: "#92400E", bold: true } },
});
review.getRange(`H${firstDataRow}:H${lastDataRow}`).conditionalFormats.add("containsText", {
  text: "Doublon possible", format: { fill: "#FEE2E2", font: { color: red, bold: true } },
});

guide.getRange("A2:F2").format.borders = { bottom: { style: "thin", color: navy } };
guide.getRange("A2").values = [["Guide de vérification"]];
guide.getRange("A2").format.font = { name: font, size: 15, bold: true, color: navy };
guide.getRange("A4:C4").values = [["Statut de revue", "Utilisation", "Publication"]];
guide.getRange("A5:C12").values = [
  ["À vérifier", "Aucune vérification terminée", "Non"],
  ["En cours", "Recherche ou contact en cours", "Non"],
  ["Vérifié - approuvé", "Nom, activité, coordonnées et localisation confirmés", "Oui"],
  ["Rejeté", "Information incorrecte ou hors périmètre", "Non"],
  ["Doublon", "Même activité qu'une autre fiche", "Non"],
  ["Fermé", "Activité confirmée comme fermée", "Non"],
  ["Introuvable", "Impossible de confirmer l'existence", "Non"],
  ["À rappeler", "Contact nécessaire pour terminer la vérification", "Non"],
];
guide.getRange("A4:C12").format.font = { name: font, size: 10, color: "#111827" };
guide.getRange("A4:C4").format = {
  fill: navy, font: { name: font, size: 10, bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center", verticalAlignment: "center",
};
guide.getRange("A14").values = [["Utilisation d'APIP/SYNERGUI"]];
guide.getRange("A14").format.font = { name: font, size: 12, bold: true, color: navy };
guide.getRange("A15:C17").values = [
  ["Trouvé", "Une annonce légale correspondante a été trouvée", "Saisir le N° RCCM et le lien ou document utilisé"],
  ["Non trouvé", "Aucune correspondance après recherche raisonnable", "Ne prouve pas que l'activité est inexistante"],
  ["Non applicable", "Service public, lieu ou activité sans enregistrement d'entreprise attendu", "Utiliser une autre source officielle"],
];
guide.getRange("A19:D19").values = [["Source", "Utilisation", "Adresse", "Licence / limite"]];
guide.getRange("A20:D22").values = [
  ["OpenStreetMap", "Découverte initiale des lieux et coordonnées", "https://www.openstreetmap.org/copyright", "ODbL; données collaboratives à vérifier"],
  ["APIP/SYNERGUI", "Vérification de l'existence légale et du RCCM", "https://synergui.apipguinee.com/annonces-legales", "Registre officiel; ne confirme pas les horaires ou la localisation actuelle"],
  ["Open Admin Data", "Référentiel régions, préfectures et sous-préfectures", "https://github.com/open-admin-data/guinea-administrative-divisions", "CC BY 4.0; libellés à confirmer avant production"],
];
guide.getRange("A19:D19").format = {
  fill: navy, font: { name: font, size: 10, bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center", verticalAlignment: "center",
};
guide.getRange("A14:D18").format.font = { name: font, size: 10, color: "#111827" };
guide.getRange("A20:D22").format.font = { name: font, size: 10, color: "#111827" };
guide.getRange("A4:C12").format.borders = { preset: "inside", style: "thin", color: borderGray };
guide.getRange("A15:C17").format.borders = { preset: "inside", style: "thin", color: borderGray };
guide.getRange("A19:D22").format.borders = { preset: "inside", style: "thin", color: borderGray };
guide.getRange("A:A").format.columnWidth = 25;
guide.getRange("B:B").format.columnWidth = 44;
guide.getRange("C:C").format.columnWidth = 52;
guide.getRange("D:D").format.columnWidth = 48;
guide.getRange("A4:D22").format.verticalAlignment = "center";
guide.getRange("A4:D22").format.wrapText = true;

workbook.recalculate();
await fs.mkdir(outputDir, { recursive: true });

const summaryInspect = await workbook.inspect({
  kind: "table",
  range: "Revue!A2:I14",
  include: "values,formulas",
  tableMaxRows: 14,
  tableMaxCols: 9,
  maxChars: 8000,
});
console.log(summaryInspect.ndjson);

const errorInspect = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errorInspect.ndjson);

const preview = await workbook.render({ sheetName: "Revue", range: "A1:N22", scale: 1, format: "png" });
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));
const guidePreview = await workbook.render({ sheetName: "Références", range: "A1:D22", scale: 1.25, format: "png" });
await fs.writeFile(guidePreviewPath, new Uint8Array(await guidePreview.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(JSON.stringify({ outputPath, previewPath, guidePreviewPath, rows: outputRows.length, firstDataRow, lastDataRow }, null, 2));
