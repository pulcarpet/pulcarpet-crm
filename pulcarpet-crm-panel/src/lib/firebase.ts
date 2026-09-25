import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';

// Load config from firebase-applet-config.json
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Connect to the specific Firestore database ID configured for this project
const databaseId = (firebaseConfig as any).firestoreDatabaseId;
export const db = databaseId && databaseId !== '(default)'
  ? getFirestore(app, databaseId)
  : getFirestore(app);

// Configure language for SMS verification messages
auth.useDeviceLanguage();

export interface AuditLogEntry {
  id?: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'LOGIN_SUCCESS' | 'LOGIN_2FA_SENT' | 'LOGIN_FAILED' | 'LOGOUT' | 'SESSION_LOCKED' | 'SESSION_UNLOCKED' | 'ORDER_CREATED' | 'ORDER_DELETED' | 'PROFORMA_CREATED' | 'FINANCE_TRANSACTION';
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// Log Security Audit Event to Firestore & Local Storage
export async function logSecurityAudit(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
  const fullEntry: AuditLogEntry = {
    ...entry,
    userAgent: navigator.userAgent.substring(0, 150),
    timestamp: new Date().toISOString()
  };

  // 1. Save in local memory/cache for instant viewing
  try {
    const existing = JSON.parse(localStorage.getItem('pulcarpet_audit_logs') || '[]');
    const updated = [fullEntry, ...existing].slice(0, 200);
    localStorage.setItem('pulcarpet_audit_logs', JSON.stringify(updated));
  } catch (e) {
    console.warn('Audit log cache error:', e);
  }

  // 2. Persist to Firestore if available
  try {
    if (db) {
      await addDoc(collection(db, 'audit_logs'), {
        ...fullEntry,
        createdAt: serverTimestamp()
      });
    }
  } catch (e) {
    console.warn('Could not persist audit log to Firestore:', e);
  }
}

// Fetch recent audit logs
export async function getRecentAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    if (db) {
      const q = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...(d.data() as AuditLogEntry) }));
      }
    }
  } catch (e) {
    console.warn('Fetching from Firestore failed, fallback to local:', e);
  }

  // Fallback to localStorage
  try {
    return JSON.parse(localStorage.getItem('pulcarpet_audit_logs') || '[]');
  } catch (e) {
    return [];
  }
}

export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
