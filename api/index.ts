import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import AdmZip from 'adm-zip';

const app = express();

// Enable CORS for Vercel Serverless Function
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PulCarpet CRM Backend (Vercel Serverless)', time: new Date().toISOString() });
});

// ZIP Download Route
app.get('/api/download-zip', (req, res) => {
  try {
    const zip = new AdmZip();
    const rootDir = process.cwd();

    const addFilesRecursively = (dirPath: string, zipPath: string = '') => {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === '.next' || item === 'dist' || item === '.cache') {
          continue;
        }
        const fullPath = path.join(dirPath, item);
        const relativeZipPath = zipPath ? path.join(zipPath, item) : item;
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          addFilesRecursively(fullPath, relativeZipPath);
        } else {
          zip.addLocalFile(fullPath, zipPath);
        }
      }
    };

    addFilesRecursively(rootDir);
    const buffer = zip.toBuffer();

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=pulcarpet-crm-app.zip');
    res.setHeader('Content-Length', buffer.length.toString());
    res.status(200).send(buffer);
  } catch (err: any) {
    console.error('ZIP error:', err);
    res.status(500).json({ error: 'ZIP dosyası oluşturulurken hata oluştu: ' + err.message });
  }
});

// Helper function to safely parse fetch responses and handle HTML error pages
async function safeFetchJson(response: Response) {
  const text = await response.text();
  if (!text || text.trim().length === 0) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    const cleaned = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    const shortText = cleaned.length > 200 ? cleaned.slice(0, 200) + '...' : cleaned;
    throw new Error(`[HTTP ${response.status} ${response.statusText}] ${shortText || 'Paraşüt sunucusu HTML/Metin yanıtı döndürdü'}`);
  }
}

// Paraşüt Config Status Endpoint
app.get('/api/parasut/config', (_req, res) => {
  const clientId = process.env.PARASUT_CLIENT_ID || '';
  const clientSecret = process.env.PARASUT_CLIENT_SECRET || '';
  const username = process.env.PARASUT_USERNAME || '';
  const password = process.env.PARASUT_PASSWORD || '';
  const companyId = process.env.PARASUT_COMPANY_ID || '';

  res.json({
    clientId,
    clientSecret,
    username,
    password,
    companyId,
    autoPolling: true,
    syncIntervalMinutes: 15,
    hasEnvCredentials: Boolean(clientId && clientSecret && username && password)
  });
});

// Paraşüt Config POST Endpoint
app.post('/api/parasut/config', (req, res) => {
  try {
    const { clientId, clientSecret, username, password, companyId, autoPolling, syncIntervalMinutes } = req.body || {};
    const updated = {
      clientId: clientId !== undefined ? String(clientId).trim() : '',
      clientSecret: clientSecret !== undefined ? String(clientSecret).trim() : '',
      username: username !== undefined ? String(username).trim() : '',
      password: password !== undefined ? String(password).trim() : '',
      companyId: companyId !== undefined ? String(companyId).trim() : '',
      autoPolling: autoPolling !== undefined ? Boolean(autoPolling) : true,
      syncIntervalMinutes: syncIntervalMinutes ? Number(syncIntervalMinutes) : 15,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Paraşüt entegrasyon bilgileri sunucu oturumuna kaydedildi.',
      config: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Paraşüt API v4 Sync Endpoint
app.post('/api/parasut/sync-invoices', async (req, res) => {
  try {
    const { clientId, clientSecret, username, password, companyId } = req.body || {};
    
    const effectiveClientId = clientId || process.env.PARASUT_CLIENT_ID;
    const effectiveClientSecret = clientSecret || process.env.PARASUT_CLIENT_SECRET;
    const effectiveUsername = username || process.env.PARASUT_USERNAME;
    const effectivePassword = password || process.env.PARASUT_PASSWORD;

    const rawCompanyId = String(companyId || process.env.PARASUT_COMPANY_ID || '').trim();
    const extractedMatch = rawCompanyId.match(/(\d{3,12})/);
    let effectiveCompanyId = extractedMatch ? extractedMatch[1] : rawCompanyId;
    const baseUrl = process.env.PARASUT_BASE_URL || 'https://api.parasut.com/v4';

    if (!effectiveClientId || !effectiveClientSecret || !effectiveUsername || !effectivePassword) {
      const missing = [];
      if (!effectiveClientId) missing.push('Client ID');
      if (!effectiveClientSecret) missing.push('Client Secret');
      if (!effectiveUsername) missing.push('Kullanıcı Adı');
      if (!effectivePassword) missing.push('Şifre');

      return res.status(400).json({
        success: false,
        error: `Eksik Bilgiler: ${missing.join(', ')}. Lütfen Paraşüt Entegrasyon Ayarları bölümünden eksik bilgileri doldurunuz.`
      });
    }

    const commonHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PulCarpetCRM/1.0',
      'Accept': 'application/json',
    };

    // OAuth2 Token Exchange
    const oauthPayload = {
      grant_type: 'password',
      client_id: effectiveClientId,
      client_secret: effectiveClientSecret,
      username: effectiveUsername,
      password: effectivePassword,
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
    };

    let tokenRes = await fetch('https://api.parasut.com/oauth/token', {
      method: 'POST',
      headers: { 
        ...commonHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(oauthPayload),
    });

    if (!tokenRes.ok) {
      const formParams = new URLSearchParams();
      for (const [k, v] of Object.entries(oauthPayload)) {
        formParams.append(k, String(v));
      }
      tokenRes = await fetch('https://api.parasut.com/oauth/token', {
        method: 'POST',
        headers: { 
          ...commonHeaders,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formParams.toString(),
      });
    }

    let tokenData: any = {};
    try {
      tokenData = await safeFetchJson(tokenRes);
    } catch (tokenParseErr: any) {
      return res.status(400).json({
        success: false,
        error: `Paraşüt OAuth Bağlantı Hatası: ${tokenParseErr.message}`
      });
    }

    if (!tokenRes.ok || tokenData.error) {
      const errMsg = tokenData.error_description || tokenData.error || tokenData.message || `HTTP ${tokenRes.status}: ${tokenRes.statusText}`;
      return res.status(400).json({
        success: false,
        error: `Paraşüt Kimlik Doğrulama (OAuth) Başarısız: ${errMsg}. Lütfen Client ID, Client Secret, E-posta ve Şifrenizi kontrol ediniz.`
      });
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Paraşüt OAuth sunucusundan erişim jetonu (access_token) alınamadı.'
      });
    }

    const apiHeaders = {
      ...commonHeaders,
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.api+json',
    };

    if (!effectiveCompanyId) {
      try {
        const meRes = await fetch(`${baseUrl}/me`, { headers: apiHeaders });
        if (meRes.ok) {
          const meData = await safeFetchJson(meRes);
          const compId = meData.data?.relationships?.companies?.data?.[0]?.id || meData.data?.attributes?.company_id;
          if (compId) {
            effectiveCompanyId = String(compId);
          }
        }
      } catch (meErr) {
        console.warn('Auto fetch company ID from /me failed:', meErr);
      }
    }

    if (!effectiveCompanyId) {
      return res.status(400).json({
        success: false,
        error: 'Firma ID belirlenemedi. Lütfen Paraşüt Entegrasyon Ayarları bölümünde Firma ID (veya şirket profil linkinizi) giriniz.'
      });
    }

    const extractInvoiceAmounts = (attr: any, currency: string = 'TRY') => {
      const isForeign = currency !== 'TRY';

      let exchangeRate = Number(attr.exchange_rate ?? attr.currency_rate ?? attr.rate ?? attr.kur ?? 0);
      if (!exchangeRate || exchangeRate <= 0) {
        const noteStr = String(attr.description || '') + ' ' + String(attr.note || '');
        const rateMatch = noteStr.match(/KUR\s*:\s*([\d.,]+)/i) || noteStr.match(/RATE\s*:\s*([\d.,]+)/i);
        if (rateMatch) {
          const parsedRate = parseFloat(rateMatch[1].replace('.', '').replace(',', '.'));
          if (parsedRate > 0) exchangeRate = parsedRate;
        }
      }

      let net = 0;
      let vat = 0;
      let gross = 0;

      if (isForeign) {
        net = Number(
          attr.foreign_net_total ??
          attr.foreign_currency_net_total ??
          attr.net_total_in_foreign_currency ??
          attr.foreign_amount ??
          attr.currency_net_total ??
          attr.net_total_currency ??
          0
        );

        gross = Number(
          attr.foreign_gross_total ??
          attr.foreign_currency_gross_total ??
          attr.gross_total_in_foreign_currency ??
          attr.currency_gross_total ??
          attr.gross_total_currency ??
          0
        );

        vat = Number(
          attr.foreign_total_vat ??
          attr.foreign_vat_total ??
          attr.vat_total_currency ??
          0
        );

        if (net === 0) {
          const stdNet = Number(attr.net_total ?? attr.net_amount ?? attr.sub_total ?? attr.subtotal ?? 0);
          const stdGross = Number(attr.gross_total ?? attr.total_amount ?? attr.total ?? attr.amount ?? attr.grand_total ?? 0);

          const trlNet = Number(attr.net_total_in_trl ?? attr.net_total_in_try ?? 0);
          const trlGross = Number(attr.gross_total_in_trl ?? attr.gross_total_in_try ?? 0);

          if (trlNet > 0 && stdNet > 0 && Math.abs(stdNet - trlNet) > 0.01) {
            net = stdNet;
            gross = (stdGross > 0 && Math.abs(stdGross - trlGross) > 0.01) ? stdGross : stdNet;
          } else if (exchangeRate > 1 && (stdNet > 1000 || stdGross > 1000)) {
            net = stdNet / exchangeRate;
            gross = (stdGross > 0 ? stdGross : stdNet) / exchangeRate;
          } else {
            net = stdNet;
            gross = stdGross;
          }
        }
      } else {
        net = Number(attr.net_total ?? attr.net_amount ?? attr.sub_total ?? attr.subtotal ?? 0);
        gross = Number(attr.gross_total ?? attr.total_amount ?? attr.total ?? attr.amount ?? attr.grand_total ?? 0);
        vat = Number(
          attr.total_vat ??
          attr.vat_total ??
          attr.total_kdv ??
          attr.kdv_total ??
          attr.vat_amount ??
          attr.vat ??
          attr.total_vat_amount ??
          attr.tax_total ??
          attr.total_tax ??
          attr.kdv_tutari ??
          0
        );
      }

      if (vat === 0) {
        vat = Number(
          attr.total_vat ??
          attr.vat_total ??
          attr.total_kdv ??
          attr.kdv_total ??
          attr.vat_amount ??
          attr.vat ??
          attr.tax_total ??
          0
        );
        if (isForeign && exchangeRate > 1 && vat > 100) {
          vat = vat / exchangeRate;
        }
      }

      const details = attr.details || attr.line_items || attr.items || attr.item_details;
      if (vat === 0 && Array.isArray(details) && details.length > 0) {
        for (const d of details) {
          if (d) {
            let dVat = Number(d.total_vat ?? d.vat_amount ?? d.vat_total ?? d.vat ?? 0);
            if (isForeign && exchangeRate > 1 && dVat > 100) dVat /= exchangeRate;
            if (dVat > 0) {
              vat += dVat;
            } else {
              const dRate = Number(d.vat_rate ?? d.kdv_orani ?? 0);
              let dNet = Number(d.net_total ?? d.amount ?? (Number(d.unit_price || 0) * Number(d.quantity || 1)));
              if (isForeign && exchangeRate > 1 && dNet > 1000) dNet /= exchangeRate;
              if (dRate > 0 && dNet > 0) {
                vat += dNet * (dRate / 100);
              }
            }
          }
        }
      }

      const generalVatRate = Number(attr.vat_rate ?? attr.kdv_orani ?? attr.vat_percentage ?? 0);

      if (gross > 0 && vat > 0) {
        if (gross >= vat) {
          // If net is missing or net was populated with gross total (KDV dahil), or net + vat != gross:
          // Calculate KDV Matrahı (net) as gross - vat
          if (net === 0 || Math.abs((net + vat) - gross) > 0.05 || Math.abs(net - gross) < 0.05) {
            net = gross - vat;
          }
        } else {
          gross = net + vat;
        }
      } else if (net > 0 && vat > 0 && gross === 0) {
        gross = net + vat;
      } else if (gross > 0 && net > 0 && vat === 0) {
        if (gross > net) {
          vat = gross - net;
        } else if (gross === net) {
          if (generalVatRate > 0) {
            net = gross / (1 + generalVatRate / 100);
            vat = gross - net;
          }
        }
      } else if (net > 0 && generalVatRate > 0 && vat === 0) {
        vat = net * (generalVatRate / 100);
        gross = net + vat;
      } else if (gross > 0 && generalVatRate > 0 && vat === 0 && net === 0) {
        net = gross / (1 + generalVatRate / 100);
        vat = gross - net;
      } else if (net > 0 && gross === 0) {
        gross = net + vat;
      } else if (gross > 0 && net === 0) {
        net = gross - vat;
      }

      return {
        netAmount: Math.round(net * 100) / 100,
        vatAmount: Math.round(vat * 100) / 100,
        totalAmount: Math.round(gross * 100) / 100,
      };
    };

    const getObjectTitle = (obj: any) => {
      if (!obj) return '';
      if (typeof obj === 'string') return obj;
      return obj.name || obj.company_title || obj.title || obj.short_name || obj.unvan || obj.recipient_name || obj.recipient_title || '';
    };

    const getObjectVkn = (obj: any) => {
      if (!obj) return '';
      if (typeof obj === 'string') return '';
      return obj.vkn_tckn || obj.vkn || obj.tckn || obj.tax_number || obj.tax_office || '';
    };

    const fetchAllPages = async (urlPath: string, maxPages: number = 200) => {
      let allData: any[] = [];
      let allIncluded: any[] = [];
      const pageSize = 25;

      for (let page = 1; page <= maxPages; page++) {
        const sep = urlPath.includes('?') ? '&' : '?';
        const fullUrl = `${baseUrl}/${effectiveCompanyId}/${urlPath}${sep}page[size]=${pageSize}&page[number]=${page}`;

        await new Promise((r) => setTimeout(r, 120));

        let retries = 0;
        let success = false;

        while (retries < 4 && !success) {
          try {
            const res = await fetch(fullUrl, { headers: apiHeaders });
            if (!res.ok) {
              if (res.status === 429) {
                await new Promise((r) => setTimeout(r, (retries + 1) * 1500));
                retries++;
                continue;
              }
              if (res.status === 403) break;
              if (page === 1 && urlPath.includes('include=')) {
                const cleanPath = urlPath.replace(/include=[^&]+&?/, '').replace(/&$/, '');
                const retrySep = cleanPath.includes('?') ? '&' : '?';
                const retryUrl = `${baseUrl}/${effectiveCompanyId}/${cleanPath}${retrySep}page[size]=25&page[number]=1`;
                const retryRes = await fetch(retryUrl, { headers: apiHeaders });
                if (retryRes.ok) {
                  const data = await safeFetchJson(retryRes).catch(() => null);
                  if (data && Array.isArray(data.data)) {
                    allData.push(...data.data);
                    if (Array.isArray(data.included)) allIncluded.push(...data.included);
                    urlPath = cleanPath;
                    success = true;
                    break;
                  }
                }
              }
              retries++;
              await new Promise((r) => setTimeout(r, 1000));
              continue;
            }

            const json = await safeFetchJson(res).catch(() => null);
            if (!json || !Array.isArray(json.data) || json.data.length === 0) {
              success = true;
              break;
            }

            allData.push(...json.data);
            if (Array.isArray(json.included)) allIncluded.push(...json.included);

            const totalPages = json.meta?.page?.page_count || json.meta?.page_count || json.meta?.total_pages || json.meta?.page?.total_pages || 0;
            if (json.data.length < pageSize || (totalPages > 0 && page >= totalPages)) {
              success = true;
              break;
            }

            success = true;
          } catch (err) {
            retries++;
            await new Promise((r) => setTimeout(r, 1000));
          }
        }

        if (!success) break;
      }

      return { data: allData, included: allIncluded };
    };

    const contactsResult = await fetchAllPages('contacts', 100);
    const salesResult = await fetchAllPages('sales_invoices?sort=-issue_date&include=contact,category,details', 200);
    const purchaseResult = await fetchAllPages('purchase_bills?sort=-issue_date&include=contact,category,details', 200);
    const eInvoicesResult = await fetchAllPages('e_invoices?sort=-issue_date&include=contact', 100);
    const eArchivesResult = await fetchAllPages('e_archives?sort=-created_at&include=contact', 100);

    const includedMap = new Map<string, any>();
    const addIncluded = (incArr: any[]) => {
      if (Array.isArray(incArr)) {
        for (const inc of incArr) {
          if (inc && inc.id) {
            const attrObj = inc.attributes || inc;
            attrObj.id = inc.id;
            const typeKey = String(inc.type || 'contacts').toLowerCase();
            const idKey = String(inc.id);
            includedMap.set(`${typeKey}_${idKey}`, attrObj);
            includedMap.set(`${inc.type}_${inc.id}`, attrObj);
            includedMap.set(`contacts_${idKey}`, attrObj);
            includedMap.set(`contact_${idKey}`, attrObj);
            includedMap.set(`customers_${idKey}`, attrObj);
            includedMap.set(`customer_${idKey}`, attrObj);
            includedMap.set(`suppliers_${idKey}`, attrObj);
            includedMap.set(`supplier_${idKey}`, attrObj);
            includedMap.set(idKey, attrObj);
          }
        }
      }
    };
    addIncluded(contactsResult.data);
    addIncluded(contactsResult.included);
    addIncluded(salesResult.included);
    addIncluded(purchaseResult.included);
    addIncluded(eInvoicesResult.included);
    addIncluded(eArchivesResult.included);

    const isOurCompany = (str?: string) => {
      if (!str) return false;
      const l = str.trim().toLowerCase();
      if (l.length < 2) return false;
      if (l.includes('pulur')) return true;
      if (l.includes('pulcarpet') || l.includes('pul carpet') || l.includes('pulcarp')) return true;
      if (l.includes('pul hali') || l.includes('pul halı') || l.includes('pul tekstil')) return true;
      return false;
    };

    const isInvalidPartyName = (str?: string) => {
      if (!str || typeof str !== 'string') return true;
      const s = str.trim();
      if (s.length < 2) return true;
      if (isOurCompany(s)) return true;

      const l = s.toLowerCase();

      // Customs / Ministry / GTB proxy
      if (
        l.includes('gümrük ve ticaret') ||
        l.includes('gtb') ||
        l.includes('ticaret bakanlı') ||
        l.includes('gümrük müdürlü') ||
        l.includes('serbest bölge müdürlü') ||
        s === '2222222222' ||
        s === '1111111111'
      ) return true;

      // Address lines / postal codes / locations (e.g. "0 0 SEYHAN ADANA TURKIYE")
      if (
        /^0\s+0\s+/i.test(s) ||
        /^(mah|cad|sok|no:|tel:|vkn:|vergi|pk:)/i.test(s) ||
        /seyhan\s+adana\s+turk/i.test(l) ||
        /adana\s+turk/i.test(l) ||
        l === 'turkiye' || l === 'türkiye' || l === 'turkey' ||
        l.includes('posta kodu')
      ) return true;

      // Note / Rate / Shipping details (e.g. "KUR : 47,26 / TOPLAM KAP ADEDİ...")
      if (
        /^kur\s*:/i.test(s) ||
        l.includes('toplam kap') ||
        l.includes('kaptir') ||
        l.includes('beyanname') ||
        l.includes('fob ') ||
        l.includes('cif ') ||
        l.includes('odeme sekli') ||
        l.includes('ödeme şekli')
      ) return true;

      // Generic invoice titles
      const genericTitles = [
        'satış faturası', 'satis faturasi', 'e-fatura', 'e-arşiv', 'e-arsiv',
        'ihracat faturası', 'ihracat faturasi', 'fatura', 'e-fatura / e-arşiv',
        'gider faturası', 'alış faturası', 'alis faturasi'
      ];
      if (genericTitles.includes(l)) return true;

      return false;
    };

    const mapInvoice = (item: any, type: 'sales' | 'purchase') => {
      const attr = item.attributes || {};
      const rel = item.relationships || {};

      let partyName = '';
      let taxNumber = '';

      let rawCurrency = 
        attr.currency || 
        attr.currency_code || 
        attr.currency_id || 
        attr.currency_unit || 
        attr.currency_symbol ||
        attr.doviz_cinsi ||
        attr.doviz_kodu ||
        attr.net_total_currency || 
        attr.gross_total_currency ||
        rel.currency?.data?.id || 
        '';
      rawCurrency = String(rawCurrency).toUpperCase().trim();
      if (rawCurrency === '2' || rawCurrency === 'USD' || rawCurrency === 'US DOLLAR' || rawCurrency === 'DOLLAR' || rawCurrency === '$') {
        rawCurrency = 'USD';
      } else if (rawCurrency === '3' || rawCurrency === 'EUR' || rawCurrency === 'EURO' || rawCurrency === '€') {
        rawCurrency = 'EUR';
      } else if (rawCurrency === '4' || rawCurrency === 'GBP' || rawCurrency === 'STERLING' || rawCurrency === '£') {
        rawCurrency = 'GBP';
      } else if (rawCurrency === '1' || rawCurrency === 'TRL' || rawCurrency === 'TURKISH LIRA' || rawCurrency === 'TL' || rawCurrency === 'TRY') {
        rawCurrency = 'TRY';
      }

      const noteOrDesc = String(attr.description || '') + ' ' + String(attr.note || '') + ' ' + String(attr.title || '');
      if (!rawCurrency || rawCurrency === 'TRY') {
        if (/(\$|USD|US\s*DOLLAR|Dolar)/i.test(noteOrDesc)) {
          rawCurrency = 'USD';
        } else if (/(€|EUR|EURO)/i.test(noteOrDesc)) {
          rawCurrency = 'EUR';
        } else if (/(£|GBP|STERLING|Pound)/i.test(noteOrDesc)) {
          rawCurrency = 'GBP';
        }
      }
      if (!rawCurrency) rawCurrency = 'TRY';

      const isExportInvoice = 
        (rawCurrency !== 'TRY') ||
        attr.is_export === true ||
        attr.scenario === 'ihracat' ||
        attr.invoice_type === 'export' ||
        (attr.category && String(attr.category).toLowerCase().includes('ihracat'));

      if (type === 'sales') {
        const relKeys = ['contact', 'customer', 'buyer', 'consignee', 'recipient', 'addressee', 'client', 'partner'];
        for (const relKey of relKeys) {
          const relData = rel[relKey]?.data;
          const relArr = Array.isArray(relData) ? relData : (relData ? [relData] : []);
          for (const rItem of relArr) {
            if (rItem && rItem.id) {
              const cid = String(rItem.id);
              const cType = String(rItem.type || 'contacts').toLowerCase();
              const found = includedMap.get(`${cType}_${cid}`) || 
                             includedMap.get(`contacts_${cid}`) || 
                             includedMap.get(`contact_${cid}`) || 
                             includedMap.get(`customers_${cid}`) || 
                             includedMap.get(`customer_${cid}`) || 
                             includedMap.get(`clients_${cid}`) || 
                             includedMap.get(`client_${cid}`) || 
                             includedMap.get(`buyers_${cid}`) || 
                             includedMap.get(`buyer_${cid}`) || 
                             includedMap.get(`recipients_${cid}`) ||
                             includedMap.get(cid);
              if (found) {
                const candName = 
                  found.name || 
                  found.company_title || 
                  found.official_title || 
                  found.title || 
                  found.short_name || 
                  found.unvan || 
                  found.full_name || 
                  (found.first_name ? `${found.first_name} ${found.last_name || ''}`.trim() : '');
                if (!isInvalidPartyName(candName)) {
                  partyName = candName.trim();
                  taxNumber = found.tax_number || found.vkn_tckn || found.tax_office || found.vkn || taxNumber;
                  break;
                }
              }
            }
          }
          if (partyName && !isInvalidPartyName(partyName)) break;
        }

        if (!partyName || isInvalidPartyName(partyName)) {
          const candidates = [
            attr.buyer_title,
            attr.buyer_name,
            attr.consignee_title,
            attr.consignee_name,
            attr.foreign_company,
            attr.foreign_title,
            attr.foreign_customer_name,
            attr.customer_title,
            attr.customer_name,
            attr.contact_name,
            attr.contact_title,
            attr.party_name,
            attr.addressee_title,
            attr.addressee_name,
            attr.recipient_title,
            attr.recipient_name,
            attr.client_title,
            attr.client_name,
            attr.to_title,
            attr.to_name,
            attr.company_title,
            attr.company_name,
            attr.vkn_tckn_title,
            attr.short_name,
            attr.unvan,
            getObjectTitle(attr.buyer),
            getObjectTitle(attr.consignee),
            getObjectTitle(attr.foreign),
            getObjectTitle(attr.customer),
            getObjectTitle(attr.contact),
            getObjectTitle(attr.addressee),
            getObjectTitle(attr.recipient),
            getObjectTitle(attr.client),
            getObjectTitle(attr.to),
          ];

          for (const cand of candidates) {
            if (!isInvalidPartyName(cand)) {
              partyName = String(cand).trim();
              break;
            }
          }
        }

        if (!partyName || isInvalidPartyName(partyName)) {
          const descText = String(attr.description || '') + '\n' + String(attr.note || '');
          const lines = descText.split('\n').map((l: string) => l.trim()).filter(Boolean);
          for (const line of lines) {
            const match = line.match(/(?:müşteri|müsteri|alıcı|alici|buyer|customer|consignee|firma|company|ünvan|unvan)\s*[:=-]\s*(.+)/i);
            if (match && match[1]) {
              const extracted = match[1].trim();
              if (!isInvalidPartyName(extracted)) {
                partyName = extracted;
                break;
              }
            }
          }
        }

        if (!taxNumber) {
          const taxCandidates = [
            attr.recipient_vkn_tckn,
            attr.recipient_vkn,
            attr.customer_vkn,
            attr.contact_tax_number,
            attr.to_vkn,
            attr.vkn_tckn,
            attr.vkn,
            attr.tckn,
            getObjectVkn(attr.recipient),
            getObjectVkn(attr.customer),
            getObjectVkn(attr.contact),
            getObjectVkn(attr.to),
          ];
          for (const t of taxCandidates) {
            if (t && typeof t === 'string' && t.trim().length > 0) {
              taxNumber = t.trim();
              break;
            }
          }
        }

        if (!partyName || isInvalidPartyName(partyName)) {
          partyName = isExportInvoice ? 'Yurtdışı Müşterisi (İhracat)' : 'Satış Müşterisi';
        }
      } else {
        // Bize Gelen Fatura (Alış/Gider): Satıcı (Tedarikçi) bilgilerini al
        const relKeys = ['contact', 'supplier', 'vendor', 'payee', 'partner', 'from', 'sender'];
        for (const relKey of relKeys) {
          const relData = rel[relKey]?.data;
          const relArr = Array.isArray(relData) ? relData : (relData ? [relData] : []);
          for (const rItem of relArr) {
            if (rItem && rItem.id) {
              const cid = String(rItem.id);
              const cType = String(rItem.type || 'contacts').toLowerCase();
              const found = includedMap.get(`${cType}_${cid}`) || 
                             includedMap.get(`contacts_${cid}`) || 
                             includedMap.get(`contact_${cid}`) || 
                             includedMap.get(`suppliers_${cid}`) || 
                             includedMap.get(`supplier_${cid}`) || 
                             includedMap.get(`vendors_${cid}`) || 
                             includedMap.get(`vendor_${cid}`) ||
                             includedMap.get(cid);
              if (found) {
                const candName = 
                  found.name || 
                  found.company_title || 
                  found.official_title || 
                  found.unvan || 
                  found.title || 
                  found.short_name || 
                  found.full_name || 
                  (found.first_name ? `${found.first_name} ${found.last_name || ''}`.trim() : '');
                if (!isInvalidPartyName(candName)) {
                  partyName = candName.trim();
                  taxNumber = found.tax_number || found.vkn_tckn || found.vkn || found.tckn || found.tax_office || taxNumber;
                  break;
                }
              }
            }
          }
          if (partyName && !isInvalidPartyName(partyName)) break;
        }

        if (!partyName || isInvalidPartyName(partyName)) {
          const candidates = [
            attr.supplier_name,
            attr.supplier_title,
            attr.vendor_name,
            attr.vendor_title,
            attr.sender_title,
            attr.sender_name,
            attr.from_title,
            attr.from_name,
            attr.contact_name,
            attr.contact_title,
            attr.payee_name,
            attr.payee_title,
            attr.company_name,
            attr.company_title,
            attr.unvan,
            attr.short_name,
            attr.vkn_tckn_title,
            attr.name,
            attr.title,
            getObjectTitle(attr.from),
            getObjectTitle(attr.supplier),
            getObjectTitle(attr.vendor),
            getObjectTitle(attr.sender),
            getObjectTitle(attr.contact),
            getObjectTitle(attr.payee),
          ];
          for (const cand of candidates) {
            if (!isInvalidPartyName(cand)) {
              partyName = String(cand).trim();
              break;
            }
          }
        }

        if (!taxNumber) {
          taxNumber = 
            attr.supplier_tax_number || 
            attr.sender_vkn_tckn || 
            attr.sender_vkn || 
            attr.from_vkn || 
            attr.contact_vkn_tckn || 
            getObjectVkn(attr.from) || 
            getObjectVkn(attr.supplier) || 
            getObjectVkn(attr.vendor) || 
            getObjectVkn(attr.sender) || 
            getObjectVkn(attr.contact) || 
            attr.vkn_tckn || 
            attr.vkn || 
            attr.tckn || 
            '';
        }

        if (!partyName || isInvalidPartyName(partyName)) {
          const descText = String(attr.description || '') + '\n' + String(attr.note || '');
          const lines = descText.split('\n').map((l: string) => l.trim()).filter(Boolean);
          for (const line of lines) {
            const match = line.match(/(?:tedarikçi|tedarikci|satıcı|satici|vendor|supplier|from|müşteri|müsteri|alıcı|alici|buyer|customer|consignee|firma|company|ünvan|unvan)\s*[:=-]\s*(.+)/i);
            if (match && match[1]) {
              const extracted = match[1].trim();
              if (!isInvalidPartyName(extracted)) {
                partyName = extracted;
                break;
              }
            }
          }
        }

        if (!partyName || isInvalidPartyName(partyName)) partyName = 'Tedarikçi Firma';
      }

      if (!taxNumber) taxNumber = attr.vkn_tckn || attr.vkn || attr.tckn || attr.tax_number || '';
      const amounts = extractInvoiceAmounts(attr, rawCurrency);

      return {
        id: item.id ? `PRS-${type.toUpperCase()}-${item.id}` : `PRS-${type.toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
        parasutId: String(item.id || ''),
        invoiceType: type,
        invoiceCategory: attr.category || (type === 'sales' ? (rawCurrency !== 'TRY' ? 'İhracat Faturası' : 'e-Fatura / e-Arşiv') : 'Gelen Alış Faturası'),
        invoiceNumber: attr.invoice_no || attr.number || attr.document_number || `GIB${item.id}`,
        issueDate: attr.issue_date || attr.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        dueDate: attr.due_date || attr.issue_date || new Date().toISOString().split('T')[0],
        partyName,
        taxNumber,
        netAmount: amounts.netAmount,
        vatAmount: amounts.vatAmount,
        totalAmount: amounts.totalAmount,
        currency: rawCurrency,
        paymentStatus: attr.payment_status === 'paid' ? 'odendi' : attr.payment_status === 'overdue' ? 'gecikti' : 'bekliyor',
        description: attr.description || attr.note || '',
        itemCount: attr.item_count || (Array.isArray(rel.details?.data) ? rel.details.data.length : 1),
      };
    };

    const salesMap = new Map<string, any>();
    const salesNumberIndex = new Map<string, any>();
    const purchaseMap = new Map<string, any>();
    const purchaseNumberIndex = new Map<string, any>();

    // Helper for deduplicating and merging purchase invoices
    const addOrMergePurchaseInvoice = (inv: any) => {
      if (!inv || !inv.totalAmount) return;

      const pidKey = String(inv.parasutId || '').trim();
      const numKey = (inv.invoiceNumber || '').toLowerCase().trim();

      // 1. Direct ID match
      let existing = pidKey ? purchaseMap.get(pidKey) : null;

      // 2. Direct invoice number match
      if (!existing && numKey) {
        existing = purchaseNumberIndex.get(numKey);
      }

      // 3. Amount and date match (deduplicating manual purchase bills with incoming GIB e-invoices)
      if (!existing) {
        for (const item of purchaseMap.values()) {
          const sameTotal = Math.abs((item.totalAmount || 0) - (inv.totalAmount || 0)) < 0.05;
          const sameNet = Math.abs((item.netAmount || 0) - (inv.netAmount || 0)) < 0.05;

          const d1 = new Date(item.issueDate || '').getTime();
          const d2 = new Date(inv.issueDate || '').getTime();
          const sameDate = !isNaN(d1) && !isNaN(d2) && Math.abs(d1 - d2) <= 3 * 24 * 60 * 60 * 1000;

          if (sameTotal && sameNet && sameDate) {
            existing = item;
            break;
          }
        }
      }

      if (existing) {
        // Merge information into existing item
        if (!existing.partyName || isInvalidPartyName(existing.partyName) || existing.partyName === 'Tedarikçi Firma') {
          if (inv.partyName && !isInvalidPartyName(inv.partyName) && inv.partyName !== 'Tedarikçi Firma') {
            existing.partyName = inv.partyName;
          }
        }
        if ((!existing.taxNumber || existing.taxNumber === '2222222222' || existing.taxNumber === '1111111111') && inv.taxNumber && inv.taxNumber !== '2222222222' && inv.taxNumber !== '1111111111') {
          existing.taxNumber = inv.taxNumber;
        }
        if (inv.invoiceNumber && /^[A-Z0-9]{16}$/i.test(inv.invoiceNumber)) {
          if (!existing.invoiceNumber || existing.invoiceNumber.startsWith('GIB10') || existing.invoiceNumber.startsWith('PRS-')) {
            existing.invoiceNumber = inv.invoiceNumber;
          }
        }
        return;
      }

      // Add as new
      const key = pidKey || inv.invoiceNumber;
      purchaseMap.set(key, inv);
      if (numKey) purchaseNumberIndex.set(numKey, inv);
    };

    for (const item of salesResult.data) {
      const inv = mapInvoice(item, 'sales');
      const pid = inv.parasutId;
      const numKey = (inv.invoiceNumber || '').toLowerCase().trim();
      salesMap.set(pid, inv);
      if (numKey) salesNumberIndex.set(numKey, inv);
    }

    for (const item of purchaseResult.data) {
      const inv = mapInvoice(item, 'purchase');
      addOrMergePurchaseInvoice(inv);
    }

    const mergeEDocument = (item: any, defaultType: 'sales' | 'purchase') => {
      const attr = item.attributes || {};
      const rel = item.relationships || {};
      const isPurchase = defaultType === 'purchase' || attr.direction === 'inbound' || attr.e_invoice_type === 'inbound';

      if (isPurchase) {
        const mappedE = mapInvoice(item, 'purchase');
        addOrMergePurchaseInvoice(mappedE);
        return;
      }

      const targetMap = salesMap;
      const targetNumberIndex = salesNumberIndex;

      const linkedInvoiceId = 
        rel.invoice?.data?.id || 
        rel.sales_invoice?.data?.id || 
        attr.invoice_id || 
        attr.sales_invoice_id;

      const invNo = (attr.invoice_no || attr.number || attr.document_number || '').toLowerCase().trim();

      let existing = linkedInvoiceId ? targetMap.get(String(linkedInvoiceId)) : null;
      if (!existing && invNo) {
        existing = targetNumberIndex.get(invNo);
      }

      if (existing) {
        const mappedE = mapInvoice(item, 'sales');
        if (mappedE.partyName && !isInvalidPartyName(mappedE.partyName) && !mappedE.partyName.includes('Müşterisi')) {
          if (!existing.partyName || isInvalidPartyName(existing.partyName) || existing.partyName.includes('Müşterisi')) {
            existing.partyName = mappedE.partyName;
          }
        }
        if (mappedE.invoiceNumber && mappedE.invoiceNumber.length > 5) {
          if (!existing.invoiceNumber || existing.invoiceNumber.startsWith('GIB10') || !/^[A-Z0-9]{16}$/i.test(existing.invoiceNumber)) {
            if (/^[A-Z0-9]{16}$/i.test(mappedE.invoiceNumber)) {
              existing.invoiceNumber = mappedE.invoiceNumber;
            }
          }
        }
        if ((!existing.taxNumber || existing.taxNumber === '2222222222' || existing.taxNumber === '1111111111') && mappedE.taxNumber && mappedE.taxNumber !== '2222222222' && mappedE.taxNumber !== '1111111111') {
          existing.taxNumber = mappedE.taxNumber;
        }
        return;
      }
    };

    for (const item of eInvoicesResult.data) {
      mergeEDocument(item, 'sales');
    }

    for (const item of eArchivesResult.data) {
      mergeEDocument(item, 'sales');
    }

    const mappedSales = Array.from(salesMap.values());
    const mappedPurchase = Array.from(purchaseMap.values());

    mappedSales.sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));
    mappedPurchase.sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));

    const totalCount = mappedSales.length + mappedPurchase.length;

    let msg = '';
    if (totalCount > 0) {
      msg = `Paraşüt v4 API bağlantısı başarılı! Toplam ${totalCount} adet fatura (${mappedSales.length} kesilmiş satış, ${mappedPurchase.length} gelen alış) aktarıldı.`;
    } else {
      msg = `Paraşüt v4 API doğrulaması başarılı! Firma ID (${effectiveCompanyId}) bağlantısı sağlandı. Ancak seçilen firmanın Paraşüt hesabında henüz kaydedilmiş resmi satış/alış faturası bulunmuyor. Paraşüt panelinizden yeni bir fatura oluşturduğunuzda Senkronize Et butonu ile anında çekebilirsiniz.`;
    }

    return res.json({
      success: true,
      isLiveApi: true,
      syncTime: new Date().toLocaleString('tr-TR'),
      salesInvoices: mappedSales,
      purchaseInvoices: mappedPurchase,
      message: msg,
      debug: {
        salesFetched: mappedSales.length,
        purchaseFetched: mappedPurchase.length,
      }
    });
  } catch (error: any) {
    console.error('Parasut Sync API Error:', error);
    return res.status(500).json({
      success: false,
      error: `Paraşüt Senkronizasyon Sunucu Hatası: ${error.message}`
    });
  }
});

// AI Chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Mesaj metni gereklidir.' });

    const ai = getAiClient();
    const systemInstruction = `
Sen PulCarpet (pulcarpet.com) Halı & Zemin Sistemleri CRM Akıllı Asistanısın.
Görevin: Satış temsilcilerine ve iç mimarlara müşteri yönetimi, özel halı boyutlandırma (En x Boy), m² hesaplaması, iplik türü seçimi (Bambu İpek, Saf Yün, Akrilik, Alev Almaz Otel Serisi, Shaggy, Cami Saflı Halı), kenar biye/overlok/saçak önerileri, teklif yazımı ve müşteri ikna stratejilerinde yardım etmektir.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        ...conversationHistory.map((h: any) => ({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        })),
        { role: 'user', parts: [{ text: message }] },
      ],
      config: { systemInstruction, temperature: 0.7 },
    });

    return res.json({ reply: response.text || 'Yanıt oluşturulamadı.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'AI servisinde hata oluştu.' });
  }
});

// AI Calculate Quote
app.post('/api/ai/calculate-quote', async (req, res) => {
  try {
    const { customerName, projectDetails, items } = req.body;
    const ai = getAiClient();

    const prompt = `
Aşağıdaki PulCarpet müşterisi ve halı sipariş detayları için akıllı bir teklif özeti ve önerilen indirim/teslimat değerlendirmesi yap:
Müşteri: ${customerName || 'Belirtilmedi'}
Proje Açıklaması: ${projectDetails || 'Özel Kesim Halı Siparişi'}
Kalemler: ${JSON.stringify(items || [])}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendationSummary: { type: Type.STRING },
            suggestedDiscountPercent: { type: Type.NUMBER },
            leadPriorityScore: { type: Type.NUMBER },
            estimatedProductionDays: { type: Type.NUMBER },
            upsellSuggestion: { type: Type.STRING },
          },
          required: ['recommendationSummary', 'suggestedDiscountPercent', 'leadPriorityScore', 'estimatedProductionDays', 'upsellSuggestion'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return res.json({ success: true, aiQuoteInsight: result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Teklif AI analizi başarısız.' });
  }
});

// AI Analyze Room
app.post('/api/ai/analyze-room', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Görsel yüklenmedi.' });

    const ai = getAiClient();
    const promptText = `
Sen PulCarpet iç mimari halı uzmanısın. Yüklenen oda veya halı görselini analiz et:
1. Odadaki baskın renk paleti ve mobilya tarzı.
2. Önerilen PulCarpet Halı Koleksiyonu.
3. İdeal halı ölçüsü önerisi.
4. Önerilen iplik ve kenar bitişi.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: imageBase64.replace(/^data:image\/\w+;base64,/, '') } },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            styleCategory: { type: Type.STRING },
            dominantColors: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedCollection: { type: Type.STRING },
            recommendedDimension: { type: Type.STRING },
            suggestedFinish: { type: Type.STRING },
            architectNote: { type: Type.STRING },
          },
          required: ['styleCategory', 'dominantColors', 'recommendedCollection', 'recommendedDimension', 'suggestedFinish', 'architectNote'],
        },
      },
    });

    const analysis = JSON.parse(response.text || '{}');
    return res.json({ success: true, analysis });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Görsel analizi yapılamadı.' });
  }
});

// AI Generate Offer Letter
app.post('/api/ai/generate-offer-letter', async (req, res) => {
  try {
    const { customerName, company, totalAmount, quoteNumber, itemsSummary, tone = 'formal' } = req.body;
    const ai = getAiClient();

    const prompt = `
PulCarpet markası adına ${customerName} (${company || 'Bireysel Müşteri'}) için teklif sunum mektubu / WhatsApp mesajı hazırla.
Teklif No: ${quoteNumber || 'TKF-2026-001'}
Toplam Tutar: ${totalAmount} TL
Detaylar: ${itemsSummary}
Ton: ${tone === 'whatsapp' ? 'Samimi ve hızlı WhatsApp mesajı' : 'Kurumsal, saygın e-posta metni'}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    return res.json({ success: true, draftText: response.text });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Teklif metni üretilemedi.' });
  }
});

// AI Invoice & ÖKC Receipt OCR Parser Endpoint
app.post('/api/ai/parse-invoice-ocr', async (req, res) => {
  try {
    const { fileBase64, mimeType: rawMimeType = 'image/jpeg' } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: 'Fatura veya ÖKC fiş belgesi yüklenmedi.' });
    }

    let effectiveMimeType = rawMimeType;
    if (fileBase64.startsWith('data:application/pdf') || rawMimeType.includes('pdf')) {
      effectiveMimeType = 'application/pdf';
    } else if (fileBase64.startsWith('data:image/png')) {
      effectiveMimeType = 'image/png';
    } else if (fileBase64.startsWith('data:image/webp')) {
      effectiveMimeType = 'image/webp';
    } else if (fileBase64.startsWith('data:image/jpeg') || fileBase64.startsWith('data:image/jpg')) {
      effectiveMimeType = 'image/jpeg';
    }

    const ai = getAiClient();
    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '').trim();

    const promptText = `
Sen Türkiye mevzuatına (e-Fatura, e-Arşiv Fatura, ÖKC Fişi, Z-Raporu, Perakende Satış Fişi, İhracat Faturası) tam hakim uzman mali müşavir ve OCR tarama sistemisin.
Görevin: Yüklenen fatura/fiş belgesini tarayarak metin ve finansal tutarları okumak, kontrol etmek ve aşağıdaki JSON formatına dönüştürmektir:

1. documentType: 
   - "alacak": Müşteriye kesilen satış faturası (Müşteri Alacağı)
   - "borc": Tedarikçi/Satıcıdan gelen alış veya gider faturası (Borç Bakiyesi)
   - "kdv_ihracat": İhracat Faturası (%0 KDV, İade Alacağı)
   - "okc_fis": Yazar Kasa / ÖKC (Ödeme Kaydedici Cihaz) Fişi / Z-Raporu
2. documentTypeName: İnsan tarafından okunabilir belge türü (örnek: "E-Arşiv Fatura", "ÖKC Perakende Fişi", "İplik Alış Faturası")
3. partyName: Faturayı düzenleyen veya faturadaki Karşı Firma/Kurum Unvanı
4. taxNumber: Vergi Kimlik Numarası (VKN) veya TCKN (Varsa)
5. invoiceNumber: Fatura Seri/Sıra No veya ÖKC Fiş / Z No (Örn: GIB2026000004521)
6. date: Belge Tarihi (YYYY-AA-GG formatında)
7. dueDate: Vade Tarihi (Belirtilmişse YYYY-AA-GG, belirtilmemişse Belge Tarihi ile aynı)
8. netAmount: KDV Hariç Matrah Tutar (Sayısal)
9. vatRate: KDV Oranı (%20, %10, %1, %0)
10. vatAmount: KDV Tutarı (Sayısal)
11. totalAmount: KDV Dahil Genel Toplam Tutar (Sayısal)
12. companyCategory: "Müşteri", "İplik & Hammadde Tedarikçisi", "Fason Dokuma & Baski", "Lojistik / Gümrük", "Genel Gider / Fiş", "ÖKC Perakende" kategorilerinden biri
13. summaryNote: Belgedeki mal/hizmet kalemlerinin kısa Türkçe özeti
14. items: Kalem detayları [{ description, quantity, unitPrice, totalPrice }]

Verilen belgedeki tüm sayısal değerleri sayı olarak aktar. Bütün metinler Türkçe olsun.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: effectiveMimeType, data: cleanBase64 } },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentType: { type: Type.STRING },
            documentTypeName: { type: Type.STRING },
            partyName: { type: Type.STRING },
            taxNumber: { type: Type.STRING },
            invoiceNumber: { type: Type.STRING },
            date: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            netAmount: { type: Type.NUMBER },
            vatRate: { type: Type.NUMBER },
            vatAmount: { type: Type.NUMBER },
            totalAmount: { type: Type.NUMBER },
            companyCategory: { type: Type.STRING },
            summaryNote: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  totalPrice: { type: Type.NUMBER },
                },
              },
            },
          },
          required: ['documentType'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    const today = new Date().toISOString().split('T')[0];
    const ocrResult = {
      documentType: parsedData.documentType || 'borc',
      documentTypeName: parsedData.documentTypeName || 'Fatura / Fiş',
      partyName: parsedData.partyName || 'Bilinmeyen Firma',
      taxNumber: parsedData.taxNumber || '',
      invoiceNumber: parsedData.invoiceNumber || `BELGE-${Date.now().toString().slice(-6)}`,
      date: parsedData.date || today,
      dueDate: parsedData.dueDate || parsedData.date || today,
      netAmount: typeof parsedData.netAmount === 'number' ? parsedData.netAmount : (parsedData.totalAmount || 0),
      vatRate: typeof parsedData.vatRate === 'number' ? parsedData.vatRate : 20,
      vatAmount: typeof parsedData.vatAmount === 'number' ? parsedData.vatAmount : 0,
      totalAmount: typeof parsedData.totalAmount === 'number' ? parsedData.totalAmount : 0,
      companyCategory: parsedData.companyCategory || 'Genel Gider / Fiş',
      summaryNote: parsedData.summaryNote || 'Fatura OCR taraması başarıyla yapıldı.',
      items: Array.isArray(parsedData.items) ? parsedData.items : [],
    };

    return res.json({ success: true, ocrData: ocrResult });
  } catch (error: any) {
    console.error('AI Invoice OCR Error:', error);
    return res.status(500).json({ error: error.message || 'Fatura OCR okuma hatası oluştu.' });
  }
});

// Persistent storage helper
const PRODUCTS_CATALOG_FILE = path.join(process.cwd(), 'products_catalog.json');
const ORDERS_CATALOG_FILE = path.join(process.cwd(), 'orders_catalog.json');
const CUSTOMERS_CATALOG_FILE = path.join(process.cwd(), 'customers_catalog.json');
const QUOTES_CATALOG_FILE = path.join(process.cwd(), 'quotes_catalog.json');
const PROJECTS_CATALOG_FILE = path.join(process.cwd(), 'projects_catalog.json');
const ACCOUNTS_CATALOG_FILE = path.join(process.cwd(), 'accounts_catalog.json');
const VAT_TRANSACTIONS_CATALOG_FILE = path.join(process.cwd(), 'vat_transactions_catalog.json');
const PARASUT_INVOICES_CATALOG_FILE = path.join(process.cwd(), 'parasut_invoices_catalog.json');

function getStoredJsonFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return null;
}

function saveJsonToFile(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

app.get('/api/products', (_req, res) => {
  const products = getStoredJsonFile(PRODUCTS_CATALOG_FILE);
  res.json({ products: Array.isArray(products) ? products : [] });
});

app.post('/api/products', (req, res) => {
  try {
    const { products } = req.body || {};
    if (Array.isArray(products)) {
      saveJsonToFile(PRODUCTS_CATALOG_FILE, products);
      return res.json({ success: true, count: products.length, message: 'Ürün kataloğu sunucuda başarıyla saklandı.' });
    }
    return res.status(400).json({ success: false, error: 'Geçersiz ürün dizisi' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/orders', (_req, res) => {
  const orders = getStoredJsonFile(ORDERS_CATALOG_FILE);
  res.json({ orders: Array.isArray(orders) ? orders : [] });
});

app.post('/api/orders', (req, res) => {
  try {
    const { orders } = req.body || {};
    if (Array.isArray(orders)) {
      saveJsonToFile(ORDERS_CATALOG_FILE, orders);
      return res.json({ success: true, count: orders.length, message: 'Siparişler sunucuda kaydedildi.' });
    }
    return res.status(400).json({ success: false, error: 'Geçersiz sipariş dizisi' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/customers', (_req, res) => {
  const customers = getStoredJsonFile(CUSTOMERS_CATALOG_FILE);
  res.json({ customers: Array.isArray(customers) ? customers : [] });
});

app.post('/api/customers', (req, res) => {
  try {
    const { customers } = req.body || {};
    if (Array.isArray(customers)) {
      saveJsonToFile(CUSTOMERS_CATALOG_FILE, customers);
      return res.json({ success: true, count: customers.length, message: 'Müşteriler sunucuda kaydedildi.' });
    }
    return res.status(400).json({ success: false, error: 'Geçersiz müşteri dizisi' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/quotes', (_req, res) => {
  const quotes = getStoredJsonFile(QUOTES_CATALOG_FILE);
  res.json({ quotes: Array.isArray(quotes) ? quotes : [] });
});

app.post('/api/quotes', (req, res) => {
  try {
    const { quotes } = req.body || {};
    if (Array.isArray(quotes)) {
      saveJsonToFile(QUOTES_CATALOG_FILE, quotes);
      return res.json({ success: true, count: quotes.length });
    }
    return res.status(400).json({ success: false, error: 'Geçersiz teklif dizisi' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/projects', (_req, res) => {
  const projects = getStoredJsonFile(PROJECTS_CATALOG_FILE);
  res.json({ projects: Array.isArray(projects) ? projects : [] });
});

app.post('/api/projects', (req, res) => {
  try {
    const { projects } = req.body || {};
    if (Array.isArray(projects)) {
      saveJsonToFile(PROJECTS_CATALOG_FILE, projects);
      return res.json({ success: true, count: projects.length });
    }
    return res.status(400).json({ success: false, error: 'Geçersiz proje dizisi' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/accounts', (_req, res) => {
  const accounts = getStoredJsonFile(ACCOUNTS_CATALOG_FILE);
  res.json({ accounts: Array.isArray(accounts) ? accounts : [] });
});

app.post('/api/accounts', (req, res) => {
  try {
    const { accounts } = req.body || {};
    if (Array.isArray(accounts)) {
      saveJsonToFile(ACCOUNTS_CATALOG_FILE, accounts);
      return res.json({ success: true, count: accounts.length });
    }
    return res.status(400).json({ success: false, error: 'Geçersiz hesap dizisi' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/vat-transactions', (_req, res) => {
  const vatTransactions = getStoredJsonFile(VAT_TRANSACTIONS_CATALOG_FILE);
  res.json({ vatTransactions: Array.isArray(vatTransactions) ? vatTransactions : [] });
});

app.post('/api/vat-transactions', (req, res) => {
  try {
    const { vatTransactions } = req.body || {};
    if (Array.isArray(vatTransactions)) {
      saveJsonToFile(VAT_TRANSACTIONS_CATALOG_FILE, vatTransactions);
      return res.json({ success: true, count: vatTransactions.length });
    }
    return res.status(400).json({ success: false, error: 'Geçersiz KDV verisi' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/parasut/invoices', (_req, res) => {
  const invoices = getStoredJsonFile(PARASUT_INVOICES_CATALOG_FILE);
  res.json({ invoices: Array.isArray(invoices) ? invoices : [] });
});

app.post('/api/parasut/invoices', (req, res) => {
  try {
    const { invoices } = req.body || {};
    if (Array.isArray(invoices)) {
      saveJsonToFile(PARASUT_INVOICES_CATALOG_FILE, invoices);
      return res.json({ success: true, count: invoices.length });
    }
    return res.status(400).json({ success: false, error: 'Geçersiz fatura dizisi' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback for missing API routes
app.all('/api/*', (req, res) => {
  return res.status(404).json({
    success: false,
    error: `API Bulunamadı: ${req.method} ${req.path}`
  });
});

export default app;
