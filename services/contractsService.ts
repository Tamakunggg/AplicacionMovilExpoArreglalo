import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';

export type ContractStatus =
  | 'pendiente'
  | 'aceptado'
  | 'en_proceso'
  | 'terminado'
  | 'pagado'
  | 'cancelado';

export type PaymentStatus = 'pendiente' | 'pagado';

export type ContractItem = {
  id: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  serviceTitle: string;
  serviceDescription: string;
  agreedPrice: number;
  conditions: string;
  address?: string;
  scheduledDate?: string;
  status: ContractStatus;
  paymentStatus: PaymentStatus;
  reviewEnabled: boolean;
  evidence: string[];
  createdAt?: any;
  updatedAt?: any;
};

export type CreateContractParams = {
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  serviceTitle: string;
  serviceDescription: string;
  agreedPrice: number;
  conditions: string;
  address?: string;
  scheduledDate?: string;
};

function normalizeText(value?: string) {
  return String(value || '').trim();
}

function mapContract(docId: string, data: any): ContractItem {
  return {
    id: docId,
    clientId: data?.clientId || '',
    clientName: data?.clientName || '',
    professionalId: data?.professionalId || '',
    professionalName: data?.professionalName || '',
    serviceTitle: data?.serviceTitle || '',
    serviceDescription: data?.serviceDescription || '',
    agreedPrice: Number(data?.agreedPrice || 0),
    conditions: data?.conditions || '',
    address: data?.address || '',
    scheduledDate: data?.scheduledDate || '',
    status: (data?.status || 'pendiente') as ContractStatus,
    paymentStatus: (data?.paymentStatus || 'pendiente') as PaymentStatus,
    reviewEnabled: Boolean(data?.reviewEnabled),
    evidence: Array.isArray(data?.evidence) ? data.evidence : [],
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
  };
}

export async function createContract(params: CreateContractParams) {
  const clientId = normalizeText(params.clientId);
  const clientName = normalizeText(params.clientName);
  const professionalId = normalizeText(params.professionalId);
  const professionalName = normalizeText(params.professionalName);
  const serviceTitle = normalizeText(params.serviceTitle);
  const serviceDescription = normalizeText(params.serviceDescription);
  const conditions = normalizeText(params.conditions);
  const address = normalizeText(params.address);
  const scheduledDate = normalizeText(params.scheduledDate);
  const agreedPrice = Number(params.agreedPrice);

  if (!clientId || !professionalId) {
    throw new Error('Faltan ids del cliente o profesionista.');
  }

  if (!clientName || !professionalName) {
    throw new Error('Faltan nombres del cliente o profesionista.');
  }

  if (!serviceTitle || !serviceDescription) {
    throw new Error('Debes indicar el servicio y la descripción.');
  }

  if (isNaN(agreedPrice) || agreedPrice <= 0) {
    throw new Error('El precio pactado debe ser mayor a 0.');
  }

  const docRef = await addDoc(collection(db, 'contratos'), {
    clientId,
    clientName,
    professionalId,
    professionalName,
    serviceTitle,
    serviceDescription,
    agreedPrice,
    conditions,
    address,
    scheduledDate,
    status: 'pendiente',
    paymentStatus: 'pendiente',
    reviewEnabled: false,
    evidence: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getContractById(
  contractId: string
): Promise<ContractItem | null> {
  const cleanId = normalizeText(contractId);

  if (!cleanId) return null;

  const contractRef = doc(db, 'contratos', cleanId);
  const snap = await getDoc(contractRef);

  if (!snap.exists()) return null;

  return mapContract(snap.id, snap.data());
}

export async function getContractsByClient(
  clientId: string
): Promise<ContractItem[]> {
  const cleanClientId = normalizeText(clientId);

  if (!cleanClientId) return [];

  const q = query(
    collection(db, 'contratos'),
    where('clientId', '==', cleanClientId)
  );

  const snapshot = await getDocs(q);

  const items = snapshot.docs.map((docItem) =>
    mapContract(docItem.id, docItem.data())
  );

  items.sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });

  return items;
}

export async function getContractsByProfessional(
  professionalId: string
): Promise<ContractItem[]> {
  const cleanProfessionalId = normalizeText(professionalId);

  if (!cleanProfessionalId) return [];

  const q = query(
    collection(db, 'contratos'),
    where('professionalId', '==', cleanProfessionalId)
  );

  const snapshot = await getDocs(q);

  const items = snapshot.docs.map((docItem) =>
    mapContract(docItem.id, docItem.data())
  );

  items.sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });

  return items;
}

export async function updateContractStatus(
  contractId: string,
  status: ContractStatus
) {
  const cleanId = normalizeText(contractId);

  if (!cleanId) {
    throw new Error('Falta el id del contrato.');
  }

  await updateDoc(doc(db, 'contratos', cleanId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function finishContract(contractId: string) {
  const cleanId = normalizeText(contractId);

  if (!cleanId) {
    throw new Error('Falta el id del contrato.');
  }

  const contract = await getContractById(cleanId);

  if (!contract) {
    throw new Error('No se encontró el contrato.');
  }

  await updateDoc(doc(db, 'contratos', cleanId), {
    status: 'terminado',
    updatedAt: serverTimestamp(),
  });
}

export async function markContractAsPaid(contractId: string) {
  const cleanId = normalizeText(contractId);

  if (!cleanId) {
    throw new Error('Falta el id del contrato.');
  }

  const contract = await getContractById(cleanId);

  if (!contract) {
    throw new Error('No se encontró el contrato.');
  }

  await updateDoc(doc(db, 'contratos', cleanId), {
    status: 'pagado',
    paymentStatus: 'pagado',
    reviewEnabled: true,
    updatedAt: serverTimestamp(),
  });
}

export async function cancelContract(contractId: string) {
  const cleanId = normalizeText(contractId);

  if (!cleanId) {
    throw new Error('Falta el id del contrato.');
  }

  const contract = await getContractById(cleanId);

  if (!contract) {
    throw new Error('No se encontró el contrato.');
  }

  await updateDoc(doc(db, 'contratos', cleanId), {
    status: 'cancelado',
    updatedAt: serverTimestamp(),
  });
}

export async function uploadContractEvidence(contractId: string, uri: string) {
  const cleanId = normalizeText(contractId);
  const cleanUri = normalizeText(uri);

  if (!cleanId || !cleanUri) {
    throw new Error('Faltan datos para subir evidencia.');
  }

  const contract = await getContractById(cleanId);

  if (!contract) {
    throw new Error('No se encontró el contrato.');
  }

  const response = await fetch(cleanUri);
  const blob = await response.blob();

  const filename = `contract-evidence/${cleanId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);

  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);

  const currentEvidence = Array.isArray(contract.evidence) ? contract.evidence : [];

  await updateDoc(doc(db, 'contratos', cleanId), {
    evidence: [...currentEvidence, url],
    updatedAt: serverTimestamp(),
  });

  return url;
}