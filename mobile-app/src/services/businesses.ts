import { collection, getDocs, limit, query, where } from 'firebase/firestore';

import { businesses as localBusinesses } from '@/data/businesses';
import { db } from '@/lib/firebase';
import { Business } from '@/types/business';

export async function getApprovedBusinesses(): Promise<Business[]> {
  if (!db) return localBusinesses;

  const snapshot = await getDocs(
    query(collection(db, 'businesses'), where('status', '==', 'approved'), limit(50)),
  );

  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as Business);
}
