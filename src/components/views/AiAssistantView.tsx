import React, { useState } from 'react';
import { AiChatMessage } from '../../types';
import { 
  Sparkles, 
  Send, 
  Upload, 
  Bot, 
  User, 
  Image as ImageIcon, 
  Layers, 
  CheckCircle2, 
  Ruler, 
  Palette, 
  Building
} from 'lucide-react';

export const AiAssistantView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'room-analyzer'>('chat');

  // Chat State
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Merhaba! Ben PulCarpet Google AI Müşteri ve Halı Uzmanı Asistanıyım. Özel ölçü kesimler, iplik farkları (Bambu İpek, Saf Yün, Akrilik), otel/cami projeleri veya müşteri teklifleri hakkında size nasıl yardımcı olabilirim?',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Room Analyzer State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isSending) return;

    const userMsg: AiChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: messages,
        }),
      });

      const data = await res.json();
      const botMsg: AiChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply || 'Gemini servisinden yanıt alınamadı.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'Bağlantı hatası oluştu. Lütfen tekrar deneyin.',
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeRoomImage = async () => {
    if (!selectedImage || isAnalyzingImage) return;

    setIsAnalyzingImage(true);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/ai/analyze-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
        }),
      });

      const data = await res.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  return (
    <div id="ai-assistant-view" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4" /> Google Gemini 2.5 Flash Yapay Zeka
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            PulCarpet AI Halı & İç Mimari Danışmanı
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Soru sorun, teklif taslağı hazırlayın veya mekan görsellerini yükleyip anında koleksiyon & renk önerisi alın.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'chat' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💬 Akıllı Asistan Chat
          </button>
          <button
            onClick={() => setActiveTab('room-analyzer')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'room-analyzer' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📸 Mekan & Halı Görsel Analizi
          </button>
        </div>
      </div>

      {/* Tab 1: AI Chat Assistant */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Box */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl flex flex-col h-[520px] shadow-sm overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white font-medium rounded-tr-none shadow-xs'
                        : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none whitespace-pre-wrap font-medium'
                    }`}
                  >
                    <div>{msg.text}</div>
                    <div className={`text-[10px] mt-1.5 text-right font-mono ${msg.sender === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                      Siz
                    </div>
                  )}
                </div>
              ))}

              {isSending && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 font-mono italic p-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Google Gemini yanıt hazırlıyor...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Örn: Otel lobisi için 500m² leke tutmaz halı maliyeti ve teslimat süresi nedir?"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-white border border-slate-200 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
              />
              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" /> Gönder
              </button>
            </form>
          </div>

          {/* Quick Prompts Panel */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Hızlı AI Soruları
            </h3>

            <div className="space-y-2">
              {[
                'Bambu İpek halıların temizliği ve pamuk saçak avantajı nedir?',
                '400m² Otel koridoru için alev geciktiricili akrilik teklifi yaz.',
                'Cami saflı yün halılarda ilme sıklığı ve güve yemezlik garantisi.',
                'Müşteriye özel %10 indirimli satış teklif mektubu oluştur.',
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-left p-3 bg-slate-50 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 text-xs rounded-xl border border-slate-200 transition-all cursor-pointer font-medium"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Multimodal Room & Rug Analyzer */}
      {activeTab === 'room-analyzer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Box */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" /> Oda veya Halı Deseni Fotoğrafı Yükle
            </h3>

            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center bg-slate-50 transition-colors relative">
              {selectedImage ? (
                <div className="space-y-3">
                  <img
                    src={selectedImage}
                    alt="Yüklenen Oda"
                    className="max-h-64 mx-auto rounded-xl border border-slate-200 object-cover shadow-2xs"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-xs text-rose-500 hover:underline font-bold"
                  >
                    Görseli Değiştir
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 text-indigo-600 mx-auto" />
                  <div className="text-xs font-bold text-slate-800">Fotoğraf Seçin veya Sürükleyin</div>
                  <div className="text-[11px] text-slate-500">Salon, yatak odası, otel lobisi veya halı örneği (JPG/PNG)</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              onClick={handleAnalyzeRoomImage}
              disabled={!selectedImage || isAnalyzingImage}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>{isAnalyzingImage ? 'Mekan Analiz Ediliyor...' : 'Google AI ile Odayı Analiz Et'}</span>
            </button>
          </div>

          {/* Analysis Result Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col justify-between shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Gemini AI Mekan & Ürün Eşleştirme Raporu
            </h3>

            {analysisResult ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 uppercase font-mono font-semibold">Oda / Mekan Tarzı</div>
                  <div className="text-sm font-bold text-indigo-600 mt-0.5">{analysisResult.styleCategory}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 uppercase font-mono flex items-center gap-1 font-semibold">
                    <Palette className="w-3.5 h-3.5 text-indigo-600" /> Önerilen Renk Paleti
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    {analysisResult.dominantColors?.map((col: string, i: number) => (
                      <span key={i} className="bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded font-medium shadow-2xs">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 uppercase font-mono flex items-center gap-1 font-semibold">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" /> Önerilen PulCarpet Koleksiyonu
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{analysisResult.recommendedCollection}</div>
                  <div className="text-[11px] text-slate-600 mt-1">Önerilen Ölçü: <strong>{analysisResult.recommendedDimension}</strong> • Bitiş: <strong>{analysisResult.suggestedFinish}</strong></div>
                </div>

                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="text-[11px] font-bold text-indigo-700 uppercase">İç Mimar Tavsiyesi</div>
                  <p className="text-xs text-slate-800 mt-1 leading-relaxed font-medium">{analysisResult.architectNote}</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 border border-slate-200 border-dashed rounded-xl flex items-center justify-center p-8 text-center text-xs text-slate-400">
                Görsel seçip "Google AI ile Odayı Analiz Et" butonuna tıklayın.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
