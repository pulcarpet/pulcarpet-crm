import * as XLSX from 'xlsx';
import { ScannedBarcodeItem } from '../types';

/**
 * Calculates m² area from common carpet dimension strings
 * e.g. "200x300 cm", "160x230", "80*150", "300 x 400"
 */
export function calculateM2FromDimensions(dimStr: string): number {
  if (!dimStr) return 6;
  const match = dimStr.match(/(\d+[\.,]?\d*)\s*[xX*×]\s*(\d+[\.,]?\d*)/);
  if (match) {
    let w = parseFloat(match[1].replace(',', '.'));
    let h = parseFloat(match[2].replace(',', '.'));
    if (w > 0 && h > 0) {
      const wM = w > 20 ? w / 100 : w;
      const hM = h > 20 ? h / 100 : h;
      return Math.round(wM * hM * 100) / 100;
    }
  }
  return 6;
}

/**
 * Exports scanned barcodes list to a professional .xlsx Excel file with 2 detailed worksheets:
 * 1. "Okutulan Barkodlar" (Item by item detailed scanned inventory with totals)
 * 2. "Desen ve Ölçü İcmali" (Grouped by pattern code & dimensions with aggregate m² and counts)
 */
export function exportScannedBarcodesToExcel(
  items: ScannedBarcodeItem[],
  customFileName?: string
): boolean {
  if (!items || items.length === 0) {
    return false;
  }

  try {
    // 1. Detailed Items Sheet Data
    const detailsData = items.map((item, idx) => ({
      'Sıra No': idx + 1,
      'Barkod No (EAN-13)': item.barcode || '-',
      'Desen Kodu': item.patternCode || '-',
      'Koleksiyon Adı': item.collectionName || '-',
      'Ürün Adı': item.productName || '-',
      'Ölçü / Ebat': item.dimensions || '-',
      'Adet (Parça)': item.quantity || 1,
      'Birim m²': item.unitM2 || 0,
      'Toplam m²': Math.round((item.totalM2 || (item.quantity * item.unitM2)) * 100) / 100,
      'Birim Fiyat': item.unitPrice ? `${item.unitPrice.toLocaleString('tr-TR')} ${item.currency || 'TL'}` : '-',
      'Toplam Tutar': item.totalPrice ? `${item.totalPrice.toLocaleString('tr-TR')} ${item.currency || 'TL'}` : '-',
      'Okutma Tarihi': item.scannedAt || '-',
      'İşlem Türü': item.actionType === 'giris' ? 'Giriş (+)' : item.actionType === 'cikis' ? 'Çıkış (-)' : 'Sayım / Stok',
      'Açıklama / Not': item.notes || '',
      'Operatör': item.operator || 'Kadir Korkmaz',
    }));

    // Add Genel Toplam Row
    const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    const totalM2 = Math.round(items.reduce((sum, it) => sum + (Number(it.totalM2) || (it.quantity * it.unitM2) || 0), 0) * 100) / 100;
    const totalPrice = Math.round(items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0) * 100) / 100;

    detailsData.push({
      'Sıra No': 'GENEL TOPLAM' as any,
      'Barkod No (EAN-13)': `${items.length} Farklı Barkod Kalemi`,
      'Desen Kodu': '-',
      'Koleksiyon Adı': '-',
      'Ürün Adı': '-',
      'Ölçü / Ebat': '-',
      'Adet (Parça)': totalQuantity,
      'Birim m²': '-',
      'Toplam m²': totalM2,
      'Birim Fiyat': '-',
      'Toplam Tutar': totalPrice > 0 ? `${totalPrice.toLocaleString('tr-TR')} TL` : '-',
      'Okutma Tarihi': '-',
      'İşlem Türü': '-',
      'Açıklama / Not': `Genel Toplam: ${items.length} Kalem, ${totalQuantity} Adet, ${totalM2} m²`,
      'Operatör': '-',
    } as any);

    // 2. Summary Grouping by Pattern Code & Dimensions (Desen & Ölçü İcmali)
    const patternGroups: Record<string, {
      patternCode: string;
      collectionName: string;
      dimensions: string;
      unitM2: number;
      totalQty: number;
      totalM2: number;
      barcodes: Set<string>;
    }> = {};

    items.forEach((it) => {
      const pCode = (it.patternCode || it.productCode || 'DSN-GENEL').trim();
      const dims = (it.dimensions || '200x300 cm').trim();
      const key = `${pCode}__${dims}`;

      if (!patternGroups[key]) {
        patternGroups[key] = {
          patternCode: pCode,
          collectionName: it.collectionName || 'Halı Koleksiyonu',
          dimensions: dims,
          unitM2: it.unitM2 || calculateM2FromDimensions(dims),
          totalQty: 0,
          totalM2: 0,
          barcodes: new Set<string>(),
        };
      }

      patternGroups[key].totalQty += (Number(it.quantity) || 1);
      patternGroups[key].totalM2 += (Number(it.totalM2) || (it.quantity * it.unitM2) || 0);
      if (it.barcode) patternGroups[key].barcodes.add(it.barcode);
    });

    const summaryData = Object.values(patternGroups).map((grp, idx) => ({
      'Sıra': idx + 1,
      'Desen Kodu': grp.patternCode,
      'Koleksiyon Adı': grp.collectionName,
      'Ölçü / Ebat': grp.dimensions,
      'Birim m²': grp.unitM2,
      'Toplam Adet': grp.totalQty,
      'Toplam m²': Math.round(grp.totalM2 * 100) / 100,
      'İlişkili Barkodlar': Array.from(grp.barcodes).join(', ') || '-',
    }));

    summaryData.push({
      'Sıra': 'TOPLAM' as any,
      'Desen Kodu': `${Object.keys(patternGroups).length} Farklı Desen`,
      'Koleksiyon Adı': '-',
      'Ölçü / Ebat': '-',
      'Birim m²': '-',
      'Toplam Adet': totalQuantity,
      'Toplam m²': totalM2,
      'İlişkili Barkodlar': '-',
    } as any);

    // Build Workbook with SheetJS
    const wb = XLSX.utils.book_new();

    // Add Sheet 1: Okutulan Barkodlar
    const wsDetails = XLSX.utils.json_to_sheet(detailsData);
    wsDetails['!cols'] = [
      { wch: 14 }, // Sıra No
      { wch: 22 }, // Barkod No
      { wch: 18 }, // Desen Kodu
      { wch: 24 }, // Koleksiyon Adı
      { wch: 30 }, // Ürün Adı
      { wch: 16 }, // Ölçü
      { wch: 14 }, // Adet
      { wch: 12 }, // Birim m²
      { wch: 14 }, // Toplam m²
      { wch: 16 }, // Birim Fiyat
      { wch: 18 }, // Toplam Tutar
      { wch: 20 }, // Okutma Tarihi
      { wch: 16 }, // İşlem Türü
      { wch: 30 }, // Açıklama
      { wch: 18 }, // Operatör
    ];
    XLSX.utils.book_append_sheet(wb, wsDetails, 'Okutulan Barkodlar');

    // Add Sheet 2: Desen ve Ölçü İcmali
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { wch: 10 }, // Sıra
      { wch: 20 }, // Desen Kodu
      { wch: 26 }, // Koleksiyon
      { wch: 18 }, // Ölçü
      { wch: 12 }, // Birim m²
      { wch: 16 }, // Toplam Adet
      { wch: 16 }, // Toplam m²
      { wch: 35 }, // Barkodlar
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Desen & Ölçü İcmali');

    // Construct filename
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    const filename = customFileName || `PulCarpet_Okutulan_Barkodlar_Listesi_${dateStr}_${timeStr}.xlsx`;

    XLSX.writeFile(wb, filename);
    return true;
  } catch (err) {
    console.error('Excel export error:', err);
    return false;
  }
}

/**
 * Exports scanned barcodes list to a UTF-8 BOM CSV file for direct Excel / ERP opening
 */
export function exportScannedBarcodesToCSV(
  items: ScannedBarcodeItem[],
  customFileName?: string
): boolean {
  if (!items || items.length === 0) return false;

  try {
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Turkish characters
    csvContent += 'Sira;Barkod_No;Desen_Kodu;Koleksiyon;Urun_Adi;Olcu;Adet;Birim_M2;Toplam_M2;Birim_Fiyat;Toplam_Tutar;Okutma_Tarihi;Islem_Turu;Notlar;Operator\n';

    items.forEach((item, idx) => {
      const row = [
        idx + 1,
        `"${item.barcode || ''}"`,
        `"${item.patternCode || ''}"`,
        `"${(item.collectionName || '').replace(/"/g, '""')}"`,
        `"${(item.productName || '').replace(/"/g, '""')}"`,
        `"${item.dimensions || ''}"`,
        item.quantity || 1,
        item.unitM2 || 0,
        Math.round((item.totalM2 || (item.quantity * item.unitM2)) * 100) / 100,
        item.unitPrice || 0,
        item.totalPrice || 0,
        `"${item.scannedAt || ''}"`,
        `"${item.actionType || 'sayim'}"`,
        `"${(item.notes || '').replace(/"/g, '""')}"`,
        `"${item.operator || 'Kadir Korkmaz'}"`,
      ].join(';');

      csvContent += row + '\n';
    });

    const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    const totalM2 = Math.round(items.reduce((sum, it) => sum + (Number(it.totalM2) || (it.quantity * it.unitM2) || 0), 0) * 100) / 100;
    const totalPrice = Math.round(items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0) * 100) / 100;

    csvContent += `TOPLAM;"${items.length} Kalem";"-";"-";"-";"-";${totalQuantity};"-";${totalM2};"-";${totalPrice};"-";"-";"-";"-"\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', customFileName || `PulCarpet_Okutulan_Barkodlar_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('CSV export error:', err);
    return false;
  }
}
