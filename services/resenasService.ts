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

export type CrearResenaParams = {
  profesionalId: string;
  clienteId: string;
  servicioId: string;
  calificacion: number;
  comentario: string;
};

export type ResenaItem = {
  id: string;
  profesionalId: string;
  clienteId: string;
  servicioId: string;
  calificacion: number;
  comentario: string;
  fecha?: any;
};

export type ProfesionalItem = {
  id: string;
  nombre?: string;
  especialidad?: string;
  experiencia?: string;
  correo?: string;
  ubicacion?: string;
  descripcion?: string;
  sobreMi?: string;
  promedioCalificacion?: number;
  totalResenas?: number;
};

export const verificarResenaExistente = async ({
  profesionalId,
  clienteId,
  servicioId,
}: {
  profesionalId: string;
  clienteId: string;
  servicioId: string;
}) => {
  const q = query(
    collection(db, 'resenas'),
    where('profesionalId', '==', profesionalId),
    where('clienteId', '==', clienteId),
    where('servicioId', '==', servicioId)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const actualizarPromedioProfesional = async (profesionalId: string) => {
  const q = query(
    collection(db, 'resenas'),
    where('profesionalId', '==', profesionalId)
  );

  const snapshot = await getDocs(q);

  const totalResenas = snapshot.size;
  let suma = 0;

  snapshot.forEach((item) => {
    const data = item.data();
    suma += Number(data.calificacion || 0);
  });

  const promedioCalificacion =
    totalResenas > 0 ? Number((suma / totalResenas).toFixed(1)) : 0;

  await updateDoc(doc(db, 'profesionales', profesionalId), {
    promedioCalificacion,
    totalResenas,
  });

  return { promedioCalificacion, totalResenas };
};

export const crearResena = async ({
  profesionalId,
  clienteId,
  servicioId,
  calificacion,
  comentario,
}: CrearResenaParams) => {
  const yaExiste = await verificarResenaExistente({
    profesionalId,
    clienteId,
    servicioId,
  });

  if (yaExiste) {
    throw new Error('Ya dejaste una reseña para este servicio.');
  }

  await addDoc(collection(db, 'resenas'), {
    profesionalId,
    clienteId,
    servicioId,
    calificacion,
    comentario: comentario.trim(),
    fecha: serverTimestamp(),
  });

  return await actualizarPromedioProfesional(profesionalId);
};

export const obtenerResenasPorProfesional = async (
  profesionalId: string
): Promise<ResenaItem[]> => {
  const q = query(
    collection(db, 'resenas'),
    where('profesionalId', '==', profesionalId),
    orderBy('fecha', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<ResenaItem, 'id'>),
  }));
};

export const obtenerProfesionalPorId = async (
  profesionalId: string
): Promise<ProfesionalItem | null> => {
  const ref = doc(db, 'profesionales', profesionalId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<ProfesionalItem, 'id'>),
  };
};