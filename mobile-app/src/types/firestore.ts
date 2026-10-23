import type { Timestamp } from 'firebase/firestore';

export type BusinessStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'closed' | 'duplicate';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type VerificationLevel = 'unverified' | 'contact-verified' | 'registry-verified';

export type BusinessDocument = {
  name: string;
  normalizedName: string;
  aliases: string[];
  categoryId: string;
  categoryLabel: string;
  subcategoryId: string;
  cityId: string;
  city: string;
  communeId: string;
  commune: string;
  neighborhood: string;
  streetAddress: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  latitude: number;
  longitude: number;
  geohash: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  verificationLevel: VerificationLevel;
  isOpen: boolean;
  openingHours: Record<string, string>;
  priceLevel: '' | '$' | '$$' | '$$$';
  services: string[];
  imageUrl: string;
  imageUrls: string[];
  description: string;
  status: BusinessStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt: Timestamp | null;
};

export type BusinessRecordDocument = {
  businessId: string | null;
  name: string;
  category: string;
  subcategory: string;
  city: string;
  district: string;
  streetAddress: string;
  phone: string;
  email: string;
  website: string;
  whatsapp: string;
  latitude: number;
  longitude: number;
  sourceId: string;
  sourceUrl: string;
  sourceType: 'openstreetmap' | 'apip' | 'user' | 'manual';
  importStatus: string;
  reviewStatus: 'review_required' | 'in_progress' | 'approved' | 'rejected' | 'duplicate' | 'closed' | 'not_found' | 'callback';
  reviewerId: string | null;
  reviewedAt: Timestamp | null;
  apipVerification: 'not_checked' | 'found' | 'not_found' | 'not_applicable';
  rccm: string;
  verificationSource: string;
  comments: string;
  duplicateAlert: boolean;
  duplicateReason: string;
  nameCityKey: string;
  phoneKey: string;
  websiteKey: string;
  rawSource: Record<string, unknown>;
  importedAt: Timestamp;
  updatedAt: Timestamp;
};

export type ReviewDocument = {
  businessId: string;
  userId: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CategoryDocument = {
  label: string;
  slug: string;
  icon: string;
  sortOrder: number;
  active: boolean;
};

export type LocationDocument = {
  name: string;
  slug: string;
  type: 'region' | 'prefecture' | 'city' | 'commune' | 'subprefecture';
  parentId: string | null;
  active: boolean;
};
