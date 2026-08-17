import { OrderFulfillmentReport, OrderFulfillmentItem } from '../types';

// PulCarpet Standart Sipariş Çıkış Şablonu (Sistem Altyapısı)
export const INITIAL_FULFILLMENT_ITEMS: OrderFulfillmentItem[] = [
  {
    id: 'PUL-ITEM-001',
    sequenceNumber: 1,
    skuName: 'PULCARPET VINTAGE 101 ANTRASİT 160x230',
    collectionName: 'VINTAGE',
    patternCode: '101',
    color: 'ANTRASİT',
    dimensions: '160x230',
    widthCm: 160,
    lengthCm: 230,
    barcode: '8690001001015',
    orderQuantity: 10,
    orderSqm: 36.8,
    scannedQuantity: 0,
    scannedSqm: 0,
    remainingQuantity: 10,
    remainingSqm: 36.8,
    excessQuantity: 0,
    excessSqm: 0,
    differencePercent: -100,
    status: 'Bekliyor'
  },
  {
    id: 'PUL-ITEM-002',
    sequenceNumber: 2,
    skuName: 'PULCARPET MODERN 204 BEJ 200x290',
    collectionName: 'MODERN',
    patternCode: '204',
    color: 'BEJ',
    dimensions: '200x290',
    widthCm: 200,
    lengthCm: 290,
    barcode: '8690001002043',
    orderQuantity: 8,
    orderSqm: 46.4,
    scannedQuantity: 0,
    scannedSqm: 0,
    remainingQuantity: 8,
    remainingSqm: 46.4,
    excessQuantity: 0,
    excessSqm: 0,
    differencePercent: -100,
    status: 'Bekliyor'
  },
  {
    id: 'PUL-ITEM-003',
    sequenceNumber: 3,
    skuName: 'PULCARPET BOHEM 305 KREM 120x180',
    collectionName: 'BOHEM',
    patternCode: '305',
    color: 'KREM',
    dimensions: '120x180',
    widthCm: 120,
    lengthCm: 180,
    barcode: '8690001003057',
    orderQuantity: 12,
    orderSqm: 25.92,
    scannedQuantity: 0,
    scannedSqm: 0,
    remainingQuantity: 12,
    remainingSqm: 25.92,
    excessQuantity: 0,
    excessSqm: 0,
    differencePercent: -100,
    status: 'Bekliyor'
  },
  {
    id: 'PUL-ITEM-004',
    sequenceNumber: 4,
    skuName: 'PULCARPET RUNNER 402 GRİ 80x300',
    collectionName: 'RUNNER / YOLLUK',
    patternCode: '402',
    color: 'GRİ',
    dimensions: '80x300',
    widthCm: 80,
    lengthCm: 300,
    barcode: '8690001004023',
    orderQuantity: 15,
    orderSqm: 36.0,
    scannedQuantity: 0,
    scannedSqm: 0,
    remainingQuantity: 15,
    remainingSqm: 36.0,
    excessQuantity: 0,
    excessSqm: 0,
    differencePercent: -100,
    status: 'Bekliyor'
  }
];

export const INITIAL_FULFILLMENT_REPORT: OrderFulfillmentReport = {
  id: 'RPT-PUL-2026-001',
  reportNo: 'SEVK-2026-001',
  reportDate: '15.08.2026 - 12:00',
  orderNumber: 'SIP-2026-001',
  orderDate: '15.08.2026',
  customerBrand: 'PulCarpet Müşteri Sevkiyatı',
  edgeFinishType: 'Overlok & Saçak',
  notes: 'Hatasız barkod okutma sistemi ile sevkiyat kontrolü yapılmaktadır.',
  orderStatus: 'Hazırlanıyor',
  tolerancePercent: '±%5',
  productGroup: 'PulCarpet Halı Koleksiyonu',
  department: 'Depo / Sevkiyat & Lojistik',
  items: INITIAL_FULFILLMENT_ITEMS,
  totalSkuCount: 4,
  totalOrderQuantity: 45,
  totalOrderSqm: 145.12,
  totalScannedQuantity: 0,
  totalScannedSqm: 0,
  completionPercent: 0,
  remainingSqm: 145.12,
  missingCount: -45,
  excessCount: 0,
  scanLogs: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Zero-Latency Audio Feedback (Yeşil Başarı Bip & Kırmızı Hata Dııt)
export const playScanAudio = (isSuccess: boolean) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (isSuccess) {
      // Yeşil / Başarılı Temiz Bip (1200Hz -> 1800Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else {
      // Kırmızı / Hata Çift Ton (250Hz Dııt Dııt)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(250, ctx.currentTime);
      gain1.gain.setValueAtTime(0.4, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.25);

      // İkinci Hata Tonu
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sawtooth';
          osc2.frequency.setValueAtTime(200, ctx.currentTime);
          gain2.gain.setValueAtTime(0.4, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.25);
        } catch (e) {
          // ignore
        }
      }, 120);
    }
  } catch (e) {
    console.error('Audio feedback error', e);
  }
};
