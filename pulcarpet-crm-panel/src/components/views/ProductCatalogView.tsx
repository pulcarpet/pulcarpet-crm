import React, { useState, useEffect } from 'react';
import { CarpetProduct } from '../../types';
import { 
  Grid, 
  Sparkles, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  ScanBarcode, 
  Package, 
  Settings,
  RotateCcw,
  Tag,
  Globe,
  RefreshCw
} from 'lucide-react';

interface ProductCatalogViewProps {
  products: CarpetProduct[];
  onUpdateProducts: (products: CarpetProduct[]) => void;
  onSelectProductForQuote: (product: CarpetProduct) => void;
  searchTerm: string;
}

// Initial Demo Product IDs to differentiate demo vs user-added
const DEMO_PRODUCT_IDS = ['PROD-01', 'PROD-02', 'PROD-03', 'PROD-04', 'PROD-05', 'PROD-06', 'PROD-07'];

const DEFAULT_TITLE = 'PulCarpet Halı & Stok Kataloğu';
const DEFAULT_SUBTITLE = 'Otantik, Bambu, Hazel, Mira, Tuanna, Asu ve Asukka koleksiyonları detaylı stok takibi ve ürün yönetimi';
const DEFAULT_CATEGORIES = ['Otantik', 'Bambu', 'Hazel', 'Mira', 'Tuanna', 'Asu', 'Asukka'];

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({
  products,
  onUpdateProducts,
  onSelectProductForQuote,
  searchTerm,
}) => {
  // Title & Header Customization States
  const [catalogTitle, setCatalogTitle] = useState<string>(() => {
    return localStorage.getItem('pulcarpet_catalog_header_title') || DEFAULT_TITLE;
  });

  const [catalogSubtitle, setCatalogSubtitle] = useState<string>(() => {
    return localStorage.getItem('pulcarpet_catalog_header_subtitle') || DEFAULT_SUBTITLE;
  });

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pulcarpet_catalog_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If old default categories are saved, upgrade to new requested categories
          if (parsed.includes('Bambu İpek') && parsed.includes('Proje/Otel')) {
            return DEFAULT_CATEGORIES;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse stored categories', e);
    }
    return DEFAULT_CATEGORIES;
  });

  // Save headers & categories to localStorage
  useEffect(() => {
    localStorage.setItem('pulcarpet_catalog_header_title', catalogTitle);
  }, [catalogTitle]);

  useEffect(() => {
    localStorage.setItem('pulcarpet_catalog_header_subtitle', catalogSubtitle);
  }, [catalogSubtitle]);

  useEffect(() => {
    localStorage.setItem('pulcarpet_catalog_categories', JSON.stringify(customCategories));
  }, [customCategories]);

  // Selected Category Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [isHeaderEditModalOpen, setIsHeaderEditModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<CarpetProduct | null>(null);

  // GS1 Türkiye Sync State
  const [isGs1Syncing, setIsGs1Syncing] = useState<boolean>(false);

  const handleQuickGs1Sync = async () => {
    setIsGs1Syncing(true);
    try {
      const res = await fetch('/api/gs1tr/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.syncedProducts)) {
        onUpdateProducts(data.syncedProducts);
        showToast(data.message || `online.gs1tr.org ile ${products.length} ürün senkronize edildi!`);
      } else {
        alert(data.error || 'GS1 TR senkronizasyonu başarısız.');
      }
    } catch (err: any) {
      alert('GS1 TR senkronizasyon hatası: ' + err.message);
    } finally {
      setIsGs1Syncing(false);
    }
  };

  // Temp Header Edit Form States
  const [editTitleInput, setEditTitleInput] = useState<string>('');
  const [editSubtitleInput, setEditSubtitleInput] = useState<string>('');
  const [categoryListInput, setCategoryListInput] = useState<string[]>([]);
  const [newCatInput, setNewCatInput] = useState<string>('');

  // Form Field States (Product)
  const [formName, setFormName] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formBarcode, setFormBarcode] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Bambu');

  // Manual Barcode & Catalog Fields (1-Koleksiyon, 2-Desen, 3-Ölçü, 4-Alış Fiyatı & KDV)
  const [formCollectionName, setFormCollectionName] = useState<string>('Bambu Koleksiyonu');
  const [formPatternCode, setFormPatternCode] = useState<string>('DSN-101');
  const [formDimensions, setFormDimensions] = useState<string>('200x300 cm');
  const [formPurchasePrice, setFormPurchasePrice] = useState<string>('450');
  const [formPurchaseCurrency, setFormPurchaseCurrency] = useState<'TL' | 'USD' | 'EUR'>('TL');
  const [formVatOption, setFormVatOption] = useState<'kdv_10' | 'kdv_20' | 'ihrac_kayitli'>('kdv_20');

  const [formPricePerM2, setFormPricePerM2] = useState<string>('1250');
  const [formStockM2, setFormStockM2] = useState<string>('250');
  const [formPileHeightMm, setFormPileHeightMm] = useState<string>('10');
  const [formDensityPoints, setFormDensityPoints] = useState<string>('1200000');
  const [formFiberType, setFormFiberType] = useState<string>('bambu_ipek');
  const [formColorVariants, setFormColorVariants] = useState<string>('Vizon, Sedef, Açık Gri, Krem');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formImage, setFormImage] = useState<string>('');

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // All Category Tabs (Includes 'all')
  const categoryTabs = ['all', ...customCategories];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm)) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Open Header / Category Revise Modal
  const handleOpenHeaderEditModal = () => {
    setEditTitleInput(catalogTitle);
    setEditSubtitleInput(catalogSubtitle);
    setCategoryListInput([...customCategories]);
    setNewCatInput('');
    setIsHeaderEditModalOpen(true);
  };

  // Save Header & Category Revisions
  const handleSaveHeaderRevisions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitleInput.trim()) {
      alert('Lütfen kataloğa ana başlık giriniz.');
      return;
    }

    const newCategories = categoryListInput.map((c) => c.trim()).filter((c) => c.length > 0);

    setCatalogTitle(editTitleInput.trim());
    setCatalogSubtitle(editSubtitleInput.trim());
    setCustomCategories(newCategories.length > 0 ? newCategories : DEFAULT_CATEGORIES);

    setIsHeaderEditModalOpen(false);
    showToast('Katalog ana başlığı, alt başlığı ve koleksiyon kategorileri revize edildi!');
  };

  // Reset Headers to Default
  const handleResetHeadersToDefault = () => {
    if (window.confirm('Katalog başlıklarını ve kategori listesini varsayılan haline döndürmek istediğinize emin misiniz?')) {
      setCatalogTitle(DEFAULT_TITLE);
      setCatalogSubtitle(DEFAULT_SUBTITLE);
      setCustomCategories(DEFAULT_CATEGORIES);
      setEditTitleInput(DEFAULT_TITLE);
      setEditSubtitleInput(DEFAULT_SUBTITLE);
      setCategoryListInput(DEFAULT_CATEGORIES);
      showToast('Katalog başlıkları varsayılan duruma sıfırlandı.');
    }
  };

  // Category List Operations inside Modal
  const handleAddCategoryItem = () => {
    if (!newCatInput.trim()) return;
    const trimmed = newCatInput.trim();
    if (categoryListInput.includes(trimmed)) {
      alert('Bu kategori başlığı zaten listede mevcut.');
      return;
    }
    setCategoryListInput([...categoryListInput, trimmed]);
    setNewCatInput('');
  };

  const handleRemoveCategoryItem = (index: number) => {
    const updated = categoryListInput.filter((_, i) => i !== index);
    setCategoryListInput(updated);
  };

  const handleUpdateCategoryItem = (index: number, val: string) => {
    const updated = [...categoryListInput];
    updated[index] = val;
    setCategoryListInput(updated);
  };

  // Open Modal for Creating New Product
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCode(`PC-${Math.floor(100 + Math.random() * 900)}`);
    setFormBarcode(`86990${Math.floor(100000000 + Math.random() * 900000000)}`);
    setFormCategory(customCategories[0] || 'Bambu');
    setFormCollectionName(customCategories[0] || 'Bambu Koleksiyonu');
    setFormPatternCode('DSN-101');
    setFormDimensions('200x300 cm');
    setFormPurchasePrice('450');
    setFormPurchaseCurrency('TL');
    setFormVatOption('kdv_20');
    setFormPricePerM2('1250');
    setFormStockM2('250');
    setFormPileHeightMm('10');
    setFormDensityPoints('1200000');
    setFormFiberType('bambu_ipek');
    setFormColorVariants('Vizon, Sedef, Açık Gri');
    setFormDescription('PulCarpet özel dokuma halı koleksiyonu.');
    setFormImage('https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80');
    setIsProductModalOpen(true);
  };

  // Open Modal for Editing/Revising Existing Product
  const handleOpenEditModal = (p: CarpetProduct) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCode(p.code);
    setFormBarcode(p.barcode || `86990${Math.floor(100000000 + Math.random() * 900000000)}`);
    setFormCategory(p.category || customCategories[0] || 'Bambu');
    setFormCollectionName(p.collectionName || p.category || 'Bambu Koleksiyonu');
    setFormPatternCode(p.patternCode || p.code || 'DSN-101');
    setFormDimensions(p.dimensions || '200x300 cm');
    setFormPurchasePrice(p.purchasePrice ? p.purchasePrice.toString() : '450');
    setFormPurchaseCurrency(p.purchaseCurrency || 'TL');
    setFormVatOption(p.vatOption || 'kdv_20');
    setFormPricePerM2(p.pricePerM2 ? p.pricePerM2.toString() : '1000');
    setFormStockM2(p.stockM2 ? p.stockM2.toString() : '100');
    setFormPileHeightMm(p.pileHeightMm ? p.pileHeightMm.toString() : '10');
    setFormDensityPoints(p.densityPoints ? p.densityPoints.toString() : '1200000');
    setFormFiberType(p.fiberType || 'bambu_ipek');
    setFormColorVariants(p.colorVariants ? p.colorVariants.join(', ') : 'Vizon, Sedef');
    setFormDescription(p.description || '');
    setFormImage(p.image || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80');
    setIsProductModalOpen(true);
  };

  // Save Add or Edit
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Lütfen ürün adını giriniz.');
      return;
    }

    const colorArray = formColorVariants
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const productPayload: CarpetProduct = {
      id: editingProduct ? editingProduct.id : `prod-custom-${Date.now()}`,
      name: formName.trim(),
      code: formCode.trim() || `PC-${Math.floor(100 + Math.random() * 900)}`,
      barcode: formBarcode.trim() || `86990${Math.floor(100000000 + Math.random() * 900000000)}`,
      category: formCategory.trim(),
      collectionName: formCollectionName.trim() || formCategory.trim(),
      patternCode: formPatternCode.trim() || formCode.trim(),
      dimensions: formDimensions.trim() || '200x300 cm',
      purchasePrice: parseFloat(formPurchasePrice) || 0,
      purchaseCurrency: formPurchaseCurrency,
      vatOption: formVatOption,
      pricePerM2: parseFloat(formPricePerM2) || 0,
      stockM2: parseFloat(formStockM2) || 0,
      pileHeightMm: parseFloat(formPileHeightMm) || 10,
      densityPoints: parseInt(formDensityPoints) || 1200000,
      fiberType: (formFiberType as any) || 'bambu_ipek',
      colorVariants: colorArray.length > 0 ? colorArray : ['Standart'],
      description: formDescription.trim(),
      image: formImage.trim() || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80',
    };

    if (editingProduct) {
      // Revision
      const updated = products.map((p) => (p.id === editingProduct.id ? productPayload : p));
      onUpdateProducts(updated);
      showToast(`"${productPayload.name}" ürün detayları başarıyla revize edildi!`);
    } else {
      // Addition
      const updated = [productPayload, ...products];
      onUpdateProducts(updated);
      showToast(`Yeni ürün "${productPayload.name}" stoğa eklendi!`);
    }

    setIsProductModalOpen(false);
  };

  // Delete Individual Product
  const handleDeleteProduct = (p: CarpetProduct) => {
    if (window.confirm(`"${p.name}" (${p.code}) ürününü stoktan silmek istediğinize emin misiniz?`)) {
      const updated = products.filter((item) => item.id !== p.id);
      onUpdateProducts(updated);
      showToast(`"${p.name}" ürünü stoktan silindi.`);
    }
  };

  // Delete All Demo Products (Keep only user-added)
  const handleDeleteDemoProducts = () => {
    const demoCount = products.filter((p) => DEMO_PRODUCT_IDS.includes(p.id) || p.id.startsWith('PROD-0')).length;
    if (demoCount === 0) {
      alert('Stokta temizlenecek varsayılan demo ürün bulunmamaktadır.');
      return;
    }

    if (window.confirm(`Varsayılan ${demoCount} adet demo halı ürününü silmek istediğinize emin misiniz? Kendi eklediğiniz ürünler korunacaktır.`)) {
      const updated = products.filter((p) => !DEMO_PRODUCT_IDS.includes(p.id) && !p.id.startsWith('PROD-0'));
      onUpdateProducts(updated);
      showToast(`${demoCount} adet demo ürün silindi. Yalnızca eklediğiniz özel ürünler listeleniyor.`);
    }
  };

  // Clear Entire Catalog
  const handleClearAllProducts = () => {
    if (products.length === 0) return;
    if (window.confirm('TÜM stok kataloğunu temizlemek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      onUpdateProducts([]);
      showToast('Stok kataloğu tamamen temizlendi.');
    }
  };

  return (
    <div id="product-catalog-view" className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="p-4 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-200" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-white hover:opacity-80 font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Customizable View Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative group">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Grid className="w-5 h-5 text-indigo-600" /> {catalogTitle}
            </h2>
            <button
              onClick={handleOpenHeaderEditModal}
              className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 transition-all cursor-pointer"
              title="Katalog başlıklarını & kategorilerini düzenle"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500">
            {catalogSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleQuickGs1Sync}
            disabled={isGs1Syncing}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="online.gs1tr.org adresinden GS1 EAN-13 kodlarını otomatik çek ve senkronize et"
          >
            <Globe className="w-4 h-4 text-emerald-200" />
            <span>{isGs1Syncing ? 'EAN Çekiliyor...' : 'GS1 EAN Çek (online.gs1tr.org)'}</span>
          </button>

          <button
            onClick={handleOpenHeaderEditModal}
            className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Ana başlığı, alt açıklamayı ve koleksiyon kategorilerini düzenle"
          >
            <Settings className="w-4 h-4 text-indigo-600" />
            <span>Başlıkları / Kategorileri Düzenle</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Yeni Ürün Ekle</span>
          </button>

          {products.length > 0 && (
            <button
              onClick={handleClearAllProducts}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-300 transition-all cursor-pointer"
              title="Tüm ürünleri siler"
            >
              Tümünü Temizle
            </button>
          )}
        </div>
      </div>

      {/* Category Pills & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {categoryTabs.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'Tüm Koleksiyonlar' : cat}
            </button>
          ))}
          
          <button
            onClick={handleOpenHeaderEditModal}
            className="px-2.5 py-1 rounded-lg border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 text-[11px]"
            title="Kategori başlıklarını yönet"
          >
            <Tag className="w-3 h-3" />
            <span>+ Kategori Ekle/Düzenle</span>
          </button>
        </div>

        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
          {filteredProducts.length} Ürün Listeleniyor
        </span>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Stokta Listelenecek Ürün Bulunamadı</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Seçtiğiniz filtreye uygun ürün bulunamadı. Yeni ürün eklemek için aşağıdaki butonu kullanabilirsiniz.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Halı Ürünü Ekle</span>
          </button>
        </div>
      )}

      {/* Product Cards Grid - Compact Multi-Column Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {filteredProducts.map((prod) => {
          const isDemo = DEMO_PRODUCT_IDS.includes(prod.id) || prod.id.startsWith('PROD-0');

          return (
            <div
              key={prod.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Image Banner - Compact Height */}
              <div className="relative h-28 w-full overflow-hidden bg-slate-100">
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                <div className="absolute top-2 left-2 flex items-center gap-1 flex-wrap">
                  <span className="bg-slate-900/90 text-white backdrop-blur-md font-mono font-bold text-[9px] px-2 py-0.5 rounded shadow-2xs">
                    {prod.code}
                  </span>
                </div>

                <span className="absolute bottom-2 right-2 bg-indigo-600 text-white font-mono font-extrabold text-[11px] px-2 py-0.5 rounded shadow-md">
                  {prod.pricePerM2 ? prod.pricePerM2.toLocaleString('tr-TR') : 0} ₺/m²
                </span>
              </div>

              {/* Content Details */}
              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                      {prod.category}
                    </span>
                    {prod.barcode && (
                      <span className="text-[9px] font-mono text-slate-500 flex items-center gap-0.5 bg-slate-50 px-1 py-0.5 rounded border border-slate-200">
                        <ScanBarcode className="w-2.5 h-2.5 text-slate-400" />
                        {prod.barcode}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">{prod.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{prod.description || 'Açıklama girilmemiş.'}</p>
                </div>

                {/* Compact Specs Grid */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono">
                  <div>
                    <span className="text-slate-400 block font-sans text-[9px]">Hav Yüksekliği:</span>
                    <span className="text-slate-900 font-bold">{prod.pileHeightMm || 10} mm</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans text-[9px]">Mevcut Stok:</span>
                    <span className="text-emerald-600 font-bold">{prod.stockM2 || 0} m²</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-1.5 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(prod)}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold py-1.5 rounded-lg border border-slate-300 flex items-center justify-center gap-1 transition-all cursor-pointer"
                      title="Ürün bilgilerini düzenle / revize et"
                    >
                      <Edit className="w-3 h-3 text-indigo-600" />
                      <span>Düzenle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod)}
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold py-1.5 rounded-lg border border-rose-200 flex items-center justify-center gap-1 transition-all cursor-pointer"
                      title="Ürünü tamamen sil"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      <span>Sil</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectProductForQuote(prod)}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold py-1.5 rounded-lg border border-indigo-200 flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>Fiyat Hesapla</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Header & Categories Modal */}
      {isHeaderEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Katalog Başlıkları & Kategorileri Düzenle</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHeaderEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHeaderRevisions} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              {/* Main Title */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Katalog Ana Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTitleInput}
                  onChange={(e) => setEditTitleInput(e.target.value)}
                  placeholder="ör: PulCarpet Halı & Stok Kataloğu"
                  className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Katalog Alt Açıklaması / Alt Başlık
                </label>
                <input
                  type="text"
                  value={editSubtitleInput}
                  onChange={(e) => setEditSubtitleInput(e.target.value)}
                  placeholder="ör: Bambu İpek, Saf Yün, Otel ve Camii koleksiyonları stok takibi..."
                  className="w-full bg-slate-50 border border-slate-300 text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category / Collection Titles Editor */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    Koleksiyon & Kategori Başlıkları Listesi
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {categoryListInput.length} Adet Kategori
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {categoryListInput.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cat}
                        onChange={(e) => handleUpdateCategoryItem(idx, e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-300 text-xs font-bold px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCategoryItem(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Bu kategoriyi sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Category Item */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    placeholder="Yeni kategori adı (ör: Mescit Halıları)"
                    className="flex-1 bg-slate-50 border border-slate-300 text-xs px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategoryItem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategoryItem}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ekle
                  </button>
                </div>
              </div>

              {/* Reset Option */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetHeadersToDefault}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Varsayılana Sıfırla</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsHeaderEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    İptal
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>Başlıkları Kaydet</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">
                  {editingProduct ? `Ürünü Düzenle & Revize Et (${editingProduct.code})` : 'Yeni Halı Ürünü Ekle'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Ürün / Halı Adı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ör: Bambu İpek Halı"
                    className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    required
                  />
                </div>

                {/* Code */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ürün Kodu:</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="ör: PC-SILK-100"
                    className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Barcode EAN */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Barkod (EAN-13 / GTIN):</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="ör: 8699010020012"
                    className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-xs p-2.5 rounded-xl text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 1 - Collection Name */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    1. Koleksiyon Adı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCollectionName}
                    onChange={(e) => setFormCollectionName(e.target.value)}
                    placeholder="ör: Bambu İpek Koleksiyonu"
                    className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* 2 - Pattern Code */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    2. Desen Kodu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formPatternCode}
                    onChange={(e) => setFormPatternCode(e.target.value)}
                    placeholder="ör: DSN-1024 / 402-Vizon"
                    className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* 3 - Dimensions */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    3. Ölçüsü (Ebat) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formDimensions}
                    onChange={(e) => setFormDimensions(e.target.value)}
                    placeholder="ör: 200x300 cm"
                    className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Koleksiyon / Kategori Türü:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {customCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4 - Purchase Price, Currency & VAT */}
                <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3">
                  <label className="text-xs font-bold text-slate-900 block border-b border-slate-200 pb-1.5">
                    4. Alış Fiyatı, Para Birimi & Vergi (KDV)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Alış Fiyat Tutarı:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formPurchasePrice}
                        onChange={(e) => setFormPurchasePrice(e.target.value)}
                        placeholder="450"
                        className="w-full bg-white border border-slate-300 font-mono font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Para Birimi Seçimi:</label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'TL', label: '₺ TL' },
                          { id: 'USD', label: '$ USD' },
                          { id: 'EUR', label: '€ EUR' },
                        ].map((curr) => (
                          <button
                            key={curr.id}
                            type="button"
                            onClick={() => setFormPurchaseCurrency(curr.id as any)}
                            className={`py-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                              formPurchaseCurrency === curr.id
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {curr.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* KDV Options */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">KDV / Vergi Durumu:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'kdv_10', label: '%10 KDV' },
                        { id: 'kdv_20', label: '%20 KDV' },
                        { id: 'ihrac_kayitli', label: 'İhraç Kayıtlı (%0)' },
                      ].map((vat) => (
                        <button
                          key={vat.id}
                          type="button"
                          onClick={() => setFormVatOption(vat.id as any)}
                          className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                            formVatOption === vat.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {vat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Price per m2 */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Satış Fiyatı (₺/m²):</label>
                  <input
                    type="number"
                    step="1"
                    value={formPricePerM2}
                    onChange={(e) => setFormPricePerM2(e.target.value)}
                    placeholder="1250"
                    className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Stock M2 */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mevcut Stok (m²):</label>
                  <input
                    type="number"
                    step="1"
                    value={formStockM2}
                    onChange={(e) => setFormStockM2(e.target.value)}
                    placeholder="250"
                    className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-xs p-2.5 rounded-xl text-emerald-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Pile Height */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hav Yüksekliği (mm):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formPileHeightMm}
                    onChange={(e) => setFormPileHeightMm(e.target.value)}
                    placeholder="10"
                    className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Density */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">İlme / Dokuma Sıklığı (Nokta/m²):</label>
                  <input
                    type="number"
                    step="10000"
                    value={formDensityPoints}
                    onChange={(e) => setFormDensityPoints(e.target.value)}
                    placeholder="1200000"
                    className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Fiber Type */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Elyaf / İplik Türü:</label>
                  <select
                    value={formFiberType}
                    onChange={(e) => setFormFiberType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="bambu_ipek">Bambu İpek / Viskon</option>
                    <option value="yun">Saf Yün (%100 Yün)</option>
                    <option value="akrilik">Akrilik Dokuma</option>
                    <option value="polyester">Polyester / Mikrofiil</option>
                    <option value="pamuk">Pamuk Tabanlı</option>
                  </select>
                </div>

                {/* Color Variants */}
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Renk Seçenekleri (Virgülle Ayırın):
                  </label>
                  <input
                    type="text"
                    value={formColorVariants}
                    onChange={(e) => setFormColorVariants(e.target.value)}
                    placeholder="Vizon, Sedef, Açık Gri, Zümrüt Yeşili"
                    className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Görsel URL:</label>
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-50 border border-slate-300 font-mono text-xs p-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Açıklama & Detaylar:</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Halı serisi hakkında detaylı bilgi, kullanım alanları..."
                    className="w-full bg-slate-50 border border-slate-300 text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Form Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  İptal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>{editingProduct ? 'Değişiklikleri Kaydet (Revize Et)' : 'Yeni Ürünü Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
