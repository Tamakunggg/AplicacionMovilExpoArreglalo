import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getContractById } from './contractsService';

export type CreateReviewParams = {
  contractId: string;
  professionalId: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  rating: number;
  comment: string;
};

export type ReviewItem = {
  id: string;
  contractId?: string;
  professionalId: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  rating: number;
  comment: string;
  createdAt?: any;
};

export type ReviewSummary = {
  average: number;
  total: number;
  counts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};

export type ProfessionalItem = {
  id: string;
  name?: string;
  specialty?: string;
  yearsExp?: string;
  email?: string;
  location?: string;
  bio?: string;
  averageRating?: number;
  reviewsCount?: number;
};

export async function reviewExists({
  professionalId,
  clientId,
  serviceId,
}: {
  professionalId: string;
  clientId: string;
  serviceId: string;
}) {
  if (!professionalId || !clientId || !serviceId) {
    return false;
  }

  const q = query(
    collection(db, 'reviews'),
    where('professionalId', '==', professionalId),
    where('clientId', '==', clientId),
    where('serviceId', '==', serviceId)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function getProfessionalReviews(
  professionalId: string
): Promise<ReviewItem[]> {
  if (!professionalId) return [];

  try {
    const q = query(
      collection(db, 'reviews'),
      where('professionalId', '==', professionalId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((item) => {
      const data = item.data();

      return {
        id: item.id,
        contractId: data.contractId || '',
        professionalId: data.professionalId || '',
        clientId: data.clientId || '',
        clientName: data.clientName || '',
        serviceId: data.serviceId || '',
        rating: Number(data.rating || 0),
        comment: data.comment || '',
        createdAt: data.createdAt,
      };
    });
  } catch (error) {
    const q = query(
      collection(db, 'reviews'),
      where('professionalId', '==', professionalId)
    );

    const snapshot = await getDocs(q);

    const reviews: ReviewItem[] = snapshot.docs.map((item) => {
      const data = item.data();

      return {
        id: item.id,
        contractId: data.contractId || '',
        professionalId: data.professionalId || '',
        clientId: data.clientId || '',
        clientName: data.clientName || '',
        serviceId: data.serviceId || '',
        rating: Number(data.rating || 0),
        comment: data.comment || '',
        createdAt: data.createdAt,
      };
    });

    reviews.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    return reviews;
  }
}

export async function getProfessionalReviewsSummary(
  professionalId: string
): Promise<ReviewSummary> {
  const reviews = await getProfessionalReviews(professionalId);

  const counts: ReviewSummary['counts'] = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let totalScore = 0;

  reviews.forEach((review) => {
    const rating = Number(review.rating || 0) as 1 | 2 | 3 | 4 | 5;

    if (rating >= 1 && rating <= 5) {
      counts[rating] += 1;
      totalScore += rating;
    }
  });

  const total = reviews.length;
  const average = total > 0 ? totalScore / total : 0;

  return {
    average,
    total,
    counts,
  };
}

export async function updateProfessionalRating(professionalId: string) {
  const summary = await getProfessionalReviewsSummary(professionalId);

  const rating = Number(summary.average.toFixed(1));
  const reviewsCount = summary.total;

  await updateDoc(doc(db, 'usuarios', professionalId), {
    rating,
    reviewsCount,
  });

  return {
    rating,
    reviewsCount,
    average: summary.average,
    total: summary.total,
    counts: summary.counts,
  };
}

export async function createReview({
  contractId,
  professionalId,
  clientId,
  clientName,
  serviceId,
  rating,
  comment,
}: CreateReviewParams) {
  const cleanClientName = clientName.trim();
  const cleanComment = comment.trim();

  if (!contractId) {
    throw new Error('La reseña debe estar ligada a un contrato.');
  }

  if (!professionalId || !clientId || !serviceId || !cleanClientName) {
    throw new Error('Faltan datos obligatorios para guardar la reseña.');
  }

  if (rating < 1 || rating > 5) {
    throw new Error('La calificación debe estar entre 1 y 5.');
  }

  if (!cleanComment) {
    throw new Error('El comentario no puede estar vacío.');
  }

  const contract = await getContractById(contractId);

  if (!contract) {
    throw new Error('No se encontró el contrato asociado.');
  }

  if (contract.clientId !== clientId) {
    throw new Error('Este contrato no pertenece al cliente actual.');
  }

  if (contract.professionalId !== professionalId) {
    throw new Error('Este contrato no corresponde al profesionista.');
  }

  if (!contract.reviewEnabled || contract.paymentStatus !== 'pagado') {
    throw new Error('Solo puedes dejar reseña cuando el servicio ya fue pagado.');
  }

  const alreadyReviewed = await reviewExists({
    professionalId,
    clientId,
    serviceId,
  });

  if (alreadyReviewed) {
    throw new Error('Ya dejaste una reseña para este servicio.');
  }

  await addDoc(collection(db, 'reviews'), {
    contractId,
    professionalId,
    clientId,
    clientName: cleanClientName,
    serviceId,
    rating,
    comment: cleanComment,
    createdAt: serverTimestamp(),
  });

  return await updateProfessionalRating(professionalId);
}

export async function getProfessionalById(
  professionalId: string
): Promise<ProfessionalItem | null> {
  if (!professionalId) return null;

  const ref = doc(db, 'usuarios', professionalId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();

  return {
    id: snap.id,
    name: data.name || '',
    specialty: data.specialty || '',
    yearsExp: data.yearsExp || '',
    email: data.email || '',
    location: data.location || '',
    bio: data.bio || '',
    averageRating: Number(data.rating || 0),
    reviewsCount: Number(data.reviewsCount || 0),
  };
}