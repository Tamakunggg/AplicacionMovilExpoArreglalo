import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export type AddReviewParams = {
  professionalId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
};

export type ReviewItem = {
  id: string;
  professionalId: string;
  clientId: string;
  clientName: string;
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

export async function addReview({
  professionalId,
  clientId,
  clientName,
  rating,
  comment,
}: AddReviewParams) {
  const cleanComment = comment.trim();
  const cleanClientName = clientName.trim();

  if (!professionalId || !clientId || !cleanClientName) {
    throw new Error('Faltan datos obligatorios para guardar la reseña.');
  }

  if (rating < 1 || rating > 5) {
    throw new Error('La calificación debe estar entre 1 y 5.');
  }

  if (!cleanComment) {
    throw new Error('El comentario no puede estar vacío.');
  }

  await addDoc(collection(db, 'reviews'), {
    professionalId,
    clientId,
    clientName: cleanClientName,
    rating,
    comment: cleanComment,
    createdAt: serverTimestamp(),
  });

  const summary = await getProfessionalReviewsSummary(professionalId);

  await updateDoc(doc(db, 'usuarios', professionalId), {
    rating: Number(summary.average.toFixed(1)),
    reviewsCount: summary.total,
  });

  return {
    rating: Number(summary.average.toFixed(1)),
    reviewsCount: summary.total,
  };
}

export async function getProfessionalReviews(
  professionalId: string
): Promise<ReviewItem[]> {
  if (!professionalId) {
    return [];
  }

  const q = query(
    collection(db, 'reviews'),
    where('professionalId', '==', professionalId)
  );

  const snapshot = await getDocs(q);

  const reviews: ReviewItem[] = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id,
      professionalId: data.professionalId || '',
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      rating: Number(data.rating || 0),
      comment: data.comment || '',
      createdAt: data.createdAt,
    };
  });

  return reviews.sort((a, b) => {
    const aSeconds = a.createdAt?.seconds || 0;
    const bSeconds = b.createdAt?.seconds || 0;
    return bSeconds - aSeconds;
  });
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