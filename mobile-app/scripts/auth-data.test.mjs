import assert from 'node:assert/strict';
import test from 'node:test';
import { mapBusiness } from '../src/services/map-business.ts';
import { authError } from '../src/services/auth-errors.ts';

test('Firestore schema is mapped to the mobile view without trusting a stored ID', () => {
  const result = mapBusiness({ id: 'actual-document', data: { id: 'forged-id', name: 'Clinique', categoryLabel: 'Santé', commune: 'Ratoma', priceLevel: '$$', services: ['Consultation', null, 42], rating: 4.5 } });
  assert.equal(result.id, 'actual-document');
  assert.equal(result.category, 'Santé');
  assert.equal(result.neighborhood, 'Ratoma');
  assert.equal(result.price, '$$');
  assert.deepEqual(result.services, ['Consultation']);
  assert.equal(result.rating, 4.5);
  assert.ok(Number.isNaN(result.distanceKm), 'unknown distance must not appear as zero km');
});
test('incomplete records do not break text search or numeric display', () => {
  const result = mapBusiness({ id: 'partial', data: { rating: 'five', reviewCount: Infinity, services: {}, verified: 'true' } });
  assert.equal(result.name, '');
  assert.equal(result.rating, 0);
  assert.equal(result.reviewCount, 0);
  assert.equal(result.verified, false);
  assert.deepEqual(result.services, []);
});
test('cancellation is silent while invalid SMS codes and provider conflicts are actionable', () => {
  assert.equal(authError({ code: 'ERR_REQUEST_CANCELED' }), null);
  assert.equal(authError({ code: 'auth/popup-closed-by-user' }), null);
  assert.match(authError({ code: 'auth/invalid-verification-code' }), /incorrect/);
  assert.match(authError({ code: 'auth/account-exists-with-different-credential' }), /méthode habituelle/);
  assert.doesNotMatch(authError({ message: 'private internal diagnostic' }), /private/);
});
