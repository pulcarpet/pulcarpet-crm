import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Customer, 
  Order, 
  CarpetProduct, 
  Quote, 
  ArchitecturalProject, 
  FinancialAccountItem, 
  VatTransaction, 
  ParasutInvoice,
  ProformaInvoiceData
} from '../types';

export interface SyncStateCallbacks {
  onCustomersChange?: (data: Customer[]) => void;
  onOrdersChange?: (data: Order[]) => void;
  onProductsChange?: (data: CarpetProduct[]) => void;
  onQuotesChange?: (data: Quote[]) => void;
  onProjectsChange?: (data: ArchitecturalProject[]) => void;
  onAccountsChange?: (data: FinancialAccountItem[]) => void;
  onVatTransactionsChange?: (data: VatTransaction[]) => void;
  onParasutInvoicesChange?: (data: ParasutInvoice[]) => void;
  onProformasChange?: (data: ProformaInvoiceData[]) => void;
}

const APP_STATE_COLLECTION = 'pulcarpet_state';

// Save single dataset directly to Firestore
export async function syncDataToFirestore(key: string, data: any): Promise<boolean> {
  try {
    if (!db) return false;
    const docRef = doc(db, APP_STATE_COLLECTION, key);
    await setDoc(docRef, {
      items: data,
      updatedAt: serverTimestamp(),
      deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 100) : 'Server',
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn(`Firestore sync error for [${key}]:`, err);
    return false;
  }
}

// Push all active datasets into Firestore simultaneously
export async function pushAllToFirestore(payload: {
  orders?: Order[];
  customers?: Customer[];
  products?: CarpetProduct[];
  quotes?: Quote[];
  projects?: ArchitecturalProject[];
  accounts?: FinancialAccountItem[];
  vat_transactions?: VatTransaction[];
  parasut_invoices?: ParasutInvoice[];
  proformas?: ProformaInvoiceData[];
}): Promise<{ success: boolean; message: string }> {
  try {
    if (!db) {
      return { success: false, message: 'Firestore veritabanı bağlantısı kurulamadı.' };
    }

    const promises: Promise<any>[] = [];

    if (payload.orders && payload.orders.length > 0) {
      promises.push(syncDataToFirestore('orders', payload.orders));
    }
    if (payload.customers && payload.customers.length > 0) {
      promises.push(syncDataToFirestore('customers', payload.customers));
    }
    if (payload.products && payload.products.length > 0) {
      promises.push(syncDataToFirestore('products', payload.products));
    }
    if (payload.quotes && payload.quotes.length > 0) {
      promises.push(syncDataToFirestore('quotes', payload.quotes));
    }
    if (payload.projects && payload.projects.length > 0) {
      promises.push(syncDataToFirestore('projects', payload.projects));
    }
    if (payload.accounts && payload.accounts.length > 0) {
      promises.push(syncDataToFirestore('accounts', payload.accounts));
    }
    if (payload.vat_transactions && payload.vat_transactions.length > 0) {
      promises.push(syncDataToFirestore('vat_transactions', payload.vat_transactions));
    }
    if (payload.parasut_invoices && payload.parasut_invoices.length > 0) {
      promises.push(syncDataToFirestore('parasut_invoices', payload.parasut_invoices));
    }
    if (payload.proformas && payload.proformas.length > 0) {
      promises.push(syncDataToFirestore('proformas', payload.proformas));
    }

    await Promise.all(promises);
    return { success: true, message: 'Tüm sipariş, evrak ve müşteri kayıtları buluta başarıyla eşitlendi!' };
  } catch (err: any) {
    console.error('pushAllToFirestore error:', err);
    return { success: false, message: err?.message || 'Bulut eşitleme sırasında hata oluştu.' };
  }
}

// Fetch single dataset from Firestore
export async function fetchFromFirestore<T>(key: string): Promise<T[] | null> {
  try {
    if (!db) return null;
    const docRef = doc(db, APP_STATE_COLLECTION, key);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.items)) {
        return data.items as T[];
      }
    }
    return null;
  } catch (err) {
    console.warn(`Firestore fetch error for [${key}]:`, err);
    return null;
  }
}

// Subscribe to real-time updates for all datasets
export function subscribeToFirestoreSync(callbacks: SyncStateCallbacks): () => void {
  if (!db) {
    console.warn('Firestore is not initialized.');
    return () => {};
  }

  const unsubscribers: Array<() => void> = [];

  const keys: Array<{
    key: string;
    callback?: (data: any) => void;
  }> = [
    { key: 'customers', callback: callbacks.onCustomersChange },
    { key: 'orders', callback: callbacks.onOrdersChange },
    { key: 'products', callback: callbacks.onProductsChange },
    { key: 'quotes', callback: callbacks.onQuotesChange },
    { key: 'projects', callback: callbacks.onProjectsChange },
    { key: 'accounts', callback: callbacks.onAccountsChange },
    { key: 'vat_transactions', callback: callbacks.onVatTransactionsChange },
    { key: 'parasut_invoices', callback: callbacks.onParasutInvoicesChange },
    { key: 'proformas', callback: callbacks.onProformasChange },
  ];

  keys.forEach(({ key, callback }) => {
    if (!callback) return;
    try {
      const docRef = doc(db, APP_STATE_COLLECTION, key);
      const unsub = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data?.items)) {
            callback(data.items);
          }
        }
      }, (error) => {
        console.warn(`Firestore snapshot error for ${key}:`, error);
      });
      unsubscribers.push(unsub);
    } catch (e) {
      console.warn(`Could not attach Firestore listener for ${key}:`, e);
    }
  });

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
