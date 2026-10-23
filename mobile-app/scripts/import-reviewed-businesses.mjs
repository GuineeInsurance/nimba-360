import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultInput = path.resolve(projectRoot, '..', 'data', 'conakry-businesses-priority-review.json');
const args = process.argv.slice(2);
const commit = args.includes('--commit');
const inputArg = args.indexOf('--input');
const projectArg = args.indexOf('--project');
const inputPath = inputArg >= 0 ? path.resolve(args[inputArg + 1]) : defaultInput;
const projectId = projectArg >= 0 ? args[projectArg + 1] : 'guinee-directory-mvp';

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizePhone(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('00224')) digits = digits.slice(2);
  if (digits.length === 9) digits = `224${digits}`;
  return digits;
}

function normalizeWebsite(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';
  try {
    const parsed = new URL(raw.includes('://') ? raw : `https://${raw}`);
    return `${parsed.hostname.replace(/^www\./, '')}${parsed.pathname.replace(/\/$/, '')}`;
  } catch {
    return raw.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  }
}

function documentId(sourceId) {
  return createHash('sha256').update(`openstreetmap:${sourceId}`).digest('hex').slice(0, 24);
}

function countValues(records, selector) {
  const counts = new Map();
  for (const record of records) {
    const key = selector(record);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

const dataset = JSON.parse(await readFile(inputPath, 'utf8'));
if (!Array.isArray(dataset.records)) throw new Error('Input JSON must contain a records array.');

const records = dataset.records.filter((record) => {
  return record && typeof record.sourceId === 'string' && typeof record.name === 'string';
});

if (records.length !== dataset.records.length) {
  throw new Error(`${dataset.records.length - records.length} records are missing sourceId or name.`);
}

const nameCityCounts = countValues(records, (record) => {
  const name = normalizeText(record.name);
  const city = normalizeText(record.city);
  return name && city ? `${name}|${city}` : '';
});
const phoneCounts = countValues(records, (record) => normalizePhone(record.phone));
const websiteCounts = countValues(records, (record) => normalizeWebsite(record.website));

const prepared = records.map((record) => {
  const nameCityKey = `${normalizeText(record.name)}|${normalizeText(record.city)}`;
  const phoneKey = normalizePhone(record.phone);
  const websiteKey = normalizeWebsite(record.website);
  const duplicateReasons = [];
  if ((nameCityCounts.get(nameCityKey) ?? 0) > 1) duplicateReasons.push('name_city');
  if (phoneKey && (phoneCounts.get(phoneKey) ?? 0) > 1) duplicateReasons.push('phone');
  if (websiteKey && (websiteCounts.get(websiteKey) ?? 0) > 1) duplicateReasons.push('website');

  return {
    id: documentId(record.sourceId),
    data: {
      businessId: null,
      name: String(record.name ?? '').trim(),
      category: String(record.category ?? '').trim(),
      subcategory: String(record.subcategory ?? '').trim(),
      city: String(record.city ?? '').trim(),
      district: String(record.district ?? '').trim(),
      streetAddress: String(record.streetAddress ?? '').trim(),
      phone: String(record.phone ?? '').trim(),
      email: String(record.email ?? '').trim(),
      website: String(record.website ?? '').trim(),
      whatsapp: String(record.whatsapp ?? '').trim(),
      latitude: Number(record.latitude),
      longitude: Number(record.longitude),
      sourceId: record.sourceId,
      sourceUrl: String(record.sourceUrl ?? ''),
      sourceType: 'openstreetmap',
      importStatus: String(record.status ?? 'review_required'),
      reviewStatus: 'review_required',
      reviewerId: null,
      reviewedAt: null,
      apipVerification: 'not_checked',
      rccm: '',
      verificationSource: '',
      comments: '',
      duplicateAlert: duplicateReasons.length > 0,
      duplicateReason: duplicateReasons.join(','),
      nameCityKey,
      phoneKey,
      websiteKey,
      rawSource: record,
    },
  };
});

const duplicateCount = prepared.filter((record) => record.data.duplicateAlert).length;
console.log(`Validated ${prepared.length} records from ${inputPath}`);
console.log(`Detected ${duplicateCount} records with one or more duplicate signals.`);

if (!commit) {
  console.log('Dry run complete. No Firebase data was changed.');
  console.log('Use --commit after Firebase CLI or Application Default Credentials are configured.');
  process.exit(0);
}

async function firebaseCliAccessToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const firebaseConfig = JSON.parse(await readFile(configPath, 'utf8'));
  const accessToken = firebaseConfig?.tokens?.access_token;
  if (!accessToken) throw new Error('Firebase CLI access token not found. Run firebase login first.');
  return accessToken;
}

function firestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return { nullValue: null };
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (typeof value === 'object') {
    return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, firestoreValue(item)])) } };
  }
  return { stringValue: String(value) };
}

if (process.env.FIREBASE_USE_CLI_CREDENTIALS === '1') {
  const accessToken = await firebaseCliAccessToken();
  const now = new Date().toISOString();
  const databasePath = `projects/${projectId}/databases/(default)/documents`;
  const chunkSize = 400;
  let written = 0;
  for (let offset = 0; offset < prepared.length; offset += chunkSize) {
    const chunk = prepared.slice(offset, offset + chunkSize);
    const writes = chunk.map((record) => ({
      update: {
        name: `${databasePath}/businessRecords/${record.id}`,
        fields: {
          ...Object.fromEntries(Object.entries(record.data).map(([key, value]) => [key, firestoreValue(value)])),
          importedAt: { timestampValue: now },
          updatedAt: { timestampValue: now },
        },
      },
    }));
    const response = await fetch(`https://firestore.googleapis.com/v1/${databasePath}:commit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ writes }),
    });
    if (!response.ok) throw new Error(`Firestore commit failed (${response.status}): ${await response.text()}`);
    written += chunk.length;
    console.log(`Imported ${written}/${prepared.length} records…`);
  }
  console.log(`Imported ${written} private moderation records into ${projectId}.`);
} else {
  const { applicationDefault, initializeApp } = await import('firebase-admin/app');
  const { FieldValue, getFirestore } = await import('firebase-admin/firestore');
  initializeApp({ credential: applicationDefault(), projectId });
  const database = getFirestore();
  const writer = database.bulkWriter();
  let written = 0;
  writer.onWriteResult(() => { written += 1; });
  writer.onWriteError((error) => {
    console.error(`Write failed for ${error.documentRef.path}: ${error.message}`);
    return error.failedAttempts < 3;
  });
  for (const record of prepared) {
    writer.set(database.collection('businessRecords').doc(record.id), {
      ...record.data,
      importedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await writer.close();
  console.log(`Imported ${written} private moderation records into ${projectId}.`);
}
