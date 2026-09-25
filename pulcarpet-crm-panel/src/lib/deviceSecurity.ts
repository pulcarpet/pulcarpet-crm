import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db, logSecurityAudit } from './firebase';

export type DeviceSlotId = 'mobile_phone' | 'home_pc' | 'office_pc';

export interface AuthorizedDeviceSlot {
  slotId: DeviceSlotId;
  slotName: string;
  deviceToken?: string;
  deviceType?: 'mobile' | 'desktop';
  browserInfo?: string;
  osInfo?: string;
  pairedAt?: string;
  lastActiveAt?: string;
  pairedBy?: string;
  isCurrentDevice?: boolean;
}

export const DEFAULT_DEVICE_SLOTS: Record<DeviceSlotId, { name: string; defaultType: 'mobile' | 'desktop' }> = {
  mobile_phone: {
    name: 'Cep Telefonum',
    defaultType: 'mobile'
  },
  home_pc: {
    name: 'Evdeki PC',
    defaultType: 'desktop'
  },
  office_pc: {
    name: 'Ofisteki PC',
    defaultType: 'desktop'
  }
};

// Retrieve or generate unique persistent device token
export function getOrCreateDeviceToken(): string {
  if (typeof window === 'undefined') return 'SSR-DEVICE';
  let token = localStorage.getItem('pulcarpet_device_token');
  if (!token) {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    token = `DEV-${Date.now().toString(36).toUpperCase()}-${randomHex}`;
    localStorage.setItem('pulcarpet_device_token', token);
  }
  return token;
}

// Detect operating system & browser
export function getCurrentDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      token: 'SSR-DEVICE',
      isMobile: false,
      os: 'Unknown OS',
      browser: 'Unknown Browser',
      description: 'Sunucu Ortamı'
    };
  }

  const ua = navigator.userAgent;
  const token = getOrCreateDeviceToken();

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  // OS detection
  let os = 'Bilinmeyen İşletim Sistemi';
  if (/Windows/i.test(ua)) os = 'Windows PC';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'Apple iOS';
  else if (/Android/i.test(ua)) os = 'Android Mobil';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // Browser detection
  let browser = 'Modern Web Tarayıcısı';
  if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Google Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';

  const screenRes = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '';
  const description = `${os} • ${browser} (${screenRes})`;

  return {
    token,
    isMobile,
    os,
    browser,
    description
  };
}

// Fetch all 3 authorized device slots from Firestore (with local fallback)
export async function getAuthorizedDeviceSlots(): Promise<AuthorizedDeviceSlot[]> {
  const currentToken = getOrCreateDeviceToken();

  const baseSlots: Record<DeviceSlotId, AuthorizedDeviceSlot> = {
    mobile_phone: {
      slotId: 'mobile_phone',
      slotName: '📱 Cep Telefonum',
      deviceType: 'mobile'
    },
    home_pc: {
      slotId: 'home_pc',
      slotName: '🏠 Evdeki PC',
      deviceType: 'desktop'
    },
    office_pc: {
      slotId: 'office_pc',
      slotName: '🏢 Ofisteki PC',
      deviceType: 'desktop'
    }
  };

  try {
    if (db) {
      const snap = await getDocs(collection(db, 'authorized_devices'));
      snap.forEach(docSnap => {
        const data = docSnap.data() as any;
        const slotKey = docSnap.id as DeviceSlotId;
        if (baseSlots[slotKey]) {
          baseSlots[slotKey] = {
            ...baseSlots[slotKey],
            ...data,
            slotId: slotKey,
            isCurrentDevice: data.deviceToken === currentToken
          };
        }
      });
      // Save snapshot to local cache
      localStorage.setItem('pulcarpet_authorized_devices_cache', JSON.stringify(baseSlots));
    }
  } catch (err) {
    console.warn('Firestore device read failed, fallback to local storage:', err);
    try {
      const cached = JSON.parse(localStorage.getItem('pulcarpet_authorized_devices_cache') || '{}');
      Object.keys(cached).forEach((key) => {
        const slotKey = key as DeviceSlotId;
        if (baseSlots[slotKey]) {
          baseSlots[slotKey] = {
            ...baseSlots[slotKey],
            ...cached[slotKey],
            isCurrentDevice: cached[slotKey].deviceToken === currentToken
          };
        }
      });
    } catch (e) {
      // Ignore cache parse error
    }
  }

  return Object.values(baseSlots);
}

// Check if current device is paired to any of the 3 authorized slots
export async function checkDeviceAuthorization(): Promise<{
  isAuthorized: boolean;
  pairedSlot?: AuthorizedDeviceSlot;
  hasAnyPairedDevice: boolean;
  allSlots: AuthorizedDeviceSlot[];
}> {
  const currentToken = getOrCreateDeviceToken();
  const allSlots = await getAuthorizedDeviceSlots();

  const pairedSlot = allSlots.find(s => s.deviceToken && s.deviceToken === currentToken);
  const hasAnyPairedDevice = allSlots.some(s => Boolean(s.deviceToken));

  return {
    isAuthorized: Boolean(pairedSlot),
    pairedSlot,
    hasAnyPairedDevice,
    allSlots
  };
}

// Pair current physical hardware to one of the 3 slots
export async function pairCurrentDeviceToSlot(
  slotId: DeviceSlotId, 
  pairedBy: string = 'KadirKorkmaz'
): Promise<AuthorizedDeviceSlot> {
  const currentInfo = getCurrentDeviceInfo();
  const slotConfig = DEFAULT_DEVICE_SLOTS[slotId];

  const slotData: AuthorizedDeviceSlot = {
    slotId,
    slotName: slotId === 'mobile_phone' ? '📱 Cep Telefonum' : slotId === 'home_pc' ? '🏠 Evdeki PC' : '🏢 Ofisteki PC',
    deviceToken: currentInfo.token,
    deviceType: currentInfo.isMobile ? 'mobile' : 'desktop',
    browserInfo: currentInfo.browser,
    osInfo: currentInfo.os,
    pairedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    pairedBy,
    isCurrentDevice: true
  };

  // 1. Update Firestore
  try {
    if (db) {
      await setDoc(doc(db, 'authorized_devices', slotId), slotData, { merge: true });
    }
  } catch (err) {
    console.error('Failed to save paired device to Firestore:', err);
  }

  // 2. Update local storage cache
  try {
    const cached = JSON.parse(localStorage.getItem('pulcarpet_authorized_devices_cache') || '{}');
    cached[slotId] = slotData;
    localStorage.setItem('pulcarpet_authorized_devices_cache', JSON.stringify(cached));
  } catch (e) {
    console.warn('Local storage cache write failed:', e);
  }

  // 3. Security Audit Log
  await logSecurityAudit({
    userId: pairedBy,
    userName: pairedBy,
    userRole: 'Genel Yönetici (Admin)',
    action: 'LOGIN_SUCCESS',
    details: `Yeni Donanım Eşleştirildi: [${slotData.slotName}] ${currentInfo.description}`,
    status: 'SUCCESS'
  });

  return slotData;
}

// Revoke a paired device slot
export async function unpairDeviceSlot(slotId: DeviceSlotId, revokingUser: string = 'KadirKorkmaz'): Promise<void> {
  try {
    if (db) {
      await deleteDoc(doc(db, 'authorized_devices', slotId));
    }
  } catch (err) {
    console.warn('Firestore device revoke failed:', err);
  }

  try {
    const cached = JSON.parse(localStorage.getItem('pulcarpet_authorized_devices_cache') || '{}');
    delete cached[slotId];
    localStorage.setItem('pulcarpet_authorized_devices_cache', JSON.stringify(cached));
  } catch (e) {
    // Ignore
  }

  await logSecurityAudit({
    userId: revokingUser,
    userName: revokingUser,
    userRole: 'Genel Yönetici (Admin)',
    action: 'LOGOUT',
    details: `Cihaz Eşleştirmesi Kaldırıldı / Sıfırlandı: [${slotId}]`,
    status: 'WARNING'
  });
}

// Update last active time for the paired device
export async function markDeviceActive(slotId: DeviceSlotId): Promise<void> {
  const now = new Date().toISOString();
  try {
    if (db) {
      await setDoc(doc(db, 'authorized_devices', slotId), { lastActiveAt: now }, { merge: true });
    }
  } catch (err) {
    // Silent fail for heartbeat
  }
}
