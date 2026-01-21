// @ts-ignore
import logoImg from './assets/logo.png'; 
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, Download, Play, Database, X, CheckCircle2, 
  Circle, Calendar, CheckSquare, Square, 
  Link as LinkIcon, Check, RefreshCw, AlertCircle, ExternalLink,
  LayoutGrid, List 
} from 'lucide-react';

// === CONFIGURAÇÃO MANUAL ===
const DRIVE_FOLDER_ID = '1lVuYpQgI5Ledq9q3Hnv555Fhw46SiY0T'; 

interface DriveVideo {
  id: string;
  name: string;
  thumbnail: string;
  size: string;
  rawSize: number;
  date: string;
  timestamp: number;
  webContentLink?: string;
}

const App: React.FC = () => {
  const [videos, setVideos] = useState<DriveVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('asc'); 
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeVideo, setActiveVideo] = useState<DriveVideo | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  const formatSize = (bytes: string | undefined) => {
    if (!bytes) return 'N/A';
    const b = parseInt(bytes);
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const fetchVideos = useCallback(async () => {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      setError("Chave API ausente.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let allFiles: any[] = [];
      let nextPageToken = "";
      const q = `'${DRIVE_FOLDER_ID}' in parents and mimeType contains 'video/' and trashed = false`;
      
      do {
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=nextPageToken,files(id,name,thumbnailLink,size,createdTime,webContentLink)&pageSize=1000&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.files) {
          allFiles = [...allFiles, ...data.files];
        }
        nextPageToken = data.nextPageToken || "";
      } while (nextPageToken);

      const mapped = allFiles.map((file: any) => ({
        id: file.id,
        name: file.name,
        thumbnail: `https://drive.google.com/thumbnail?id=${file.id}&sz=w640`,
        size: formatSize(file.size),
        rawSize: parseInt(file.size || '0'),
        date: new Date(file.createdTime).toLocaleDateString('pt-BR'),
        timestamp: new Date(file.createdTime).getTime(),
        webContentLink: file.webContentLink,
      }));
      setVideos(mapped);
      setError(null);
    } catch (err) {
      setError("Erro ao carregar vídeos.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDownload = (video: DriveVideo) => {
    if (!video.webContentLink) return;
    setDownloadingId(video.id);
    const reset = () => setDownloadingId(null);

    if (video.rawSize > 100 * 1024 * 1024) {
      window.open(video.webContentLink, '_blank');
      setTimeout(reset, 1000);
    } else {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.onload = reset;
      const backup = setTimeout(reset, 3000);
      iframe.src = video.webContentLink;
      document.body.appendChild(iframe);
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
        clearTimeout(backup);
      }, 5000);
    }
  };

  const handleBulkDownload = () => {
    const selected = videos.filter(v => selectedIds.has(v.id));
    setIsBulkDownloading(true);
    selected.forEach((v, i) => {
      setTimeout(() => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = v.webContentLink || '';
        iframe.onload = () => { if (i === selected.length - 1) setIsBulkDownloading(false); };
        document.body.appendChild(iframe);
        if (i === selected.length - 1) setTimeout(() => setIsBulkDownloading(false), 5000);
      }, i * 1000);
    });
    setSelectedIds(new Set());
  };

  const handleCopyLink = (id: string) => {
    navigator.clipboard.writeText(`https://drive.google.com/file/d/${id}/view`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredVideos = useMemo(() => {
    let result = videos.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    result.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [videos, searchQuery, sortOrder]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-blue-100">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* SEÇÃO DA LOGO E TÍTULO */}
          <div className="flex items-center gap-8 shrink-0">
            <div className="h-12 flex items-center shrink-0">
              <img 
                src={logoImg} 
                alt="Logo Azzas" 
                className="h-full w-auto object-contain" 
              />
            </div>
            <h1 className="text-xl font-black tracking-tight text-blue-900 ">
              Portal de Operações - Vit's Atelier
            </h1>
          </div>

          {/* SEÇÃO DE BUSCA E REFRESH */}
          <div className="flex-1 w-full max-w-2xl flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Pesquisar operações..."
                className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <button 
                  onClick={handleBulkDownload}
                  disabled={isBulkDownloading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold shadow-xl shadow-blue-500/25 transition-all"
                >
                  {isBulkDownloading ? <><RefreshCw className="w-4 h-4 animate-spin" /> ...</> : <><Download className="w-4 h-4" /> ({selectedIds.size})</>}
                </button>
              )}
              <button onClick={fetchVideos} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (selectedIds.size === filteredVideos.length) setSelectedIds(new Set());
                else setSelectedIds(new Set(filteredVideos.map(v => v.id)));
              }}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600"
            >
              {selectedIds.size === filteredVideos.length && filteredVideos.length > 0 ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
              Selecionar Tudo
            </button>
            <div className="w-px h-4 bg-slate-200" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {loading ? 'Carregando...' : `${filteredVideos.length} resultados`}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* ABAIXO A ALTERAÇÃO DO DROPDOWN HARMONIOSO */}
            <div className="flex items-center border-l border-slate-200 pl-6">
              <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-white hover:border-blue-300 transition-all group">
                <Calendar className="w-4 h-4 text-slate-400 mr-2 group-hover:text-blue-500 transition-colors" />
                <select 
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-slate-600 cursor-pointer outline-none appearance-none pr-4"
                >
                  <option value="asc">Ordem Crescente</option>
                  <option value="desc">Ordem Decrescente</option>
                </select>
                <div className="absolute right-2 pointer-events-none text-slate-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-3 border border-slate-100 animate-pulse">
                <div className="aspect-video bg-slate-100 rounded-2xl mb-4" />
                <div className="h-4 bg-slate-100 rounded-full w-3/4 mb-2" />
                <div className="h-10 bg-slate-50 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" 
            : "flex flex-col gap-3"
          }>
            {filteredVideos.map((video) => {
              const isSel = selectedIds.has(video.id);
              const isCopied = copiedId === video.id;
              const isDownloading = downloadingId === video.id;

              if (viewMode === 'list') {
                return (
                  <div key={video.id} className={`flex items-center gap-4 bg-white p-3 rounded-2xl border-2 transition-all ${isSel ? 'border-blue-500 bg-blue-50/30' : 'border-transparent shadow-sm hover:border-blue-100'}`}>
                    <button 
                      onClick={() => {
                        const next = new Set(selectedIds);
                        next.has(video.id) ? next.delete(video.id) : next.add(video.id);
                        setSelectedIds(next);
                      }}
                      className="shrink-0"
                    >
                      {isSel ? <CheckCircle2 className="w-6 h-6 text-blue-600 fill-white" /> : <Circle className="w-6 h-6 text-slate-200" />}
                    </button>
                    
                    <div className="relative w-32 aspect-video rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img src={video.thumbnail} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/10 hover:bg-black/20 transition-colors" onClick={() => setActiveVideo(video)}>
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-slate-800 truncate">{video.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{video.size}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{video.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => handleDownload(video)}
                        disabled={isDownloading}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isDownloading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                      >
                        {isDownloading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        {isDownloading ? '...' : 'Baixar'}
                      </button>
                      <button 
                        onClick={() => handleCopyLink(video.id)}
                        className={`p-2.5 rounded-xl border-2 transition-all ${isCopied ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-blue-600'}`}
                      >
                        {isCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={video.id} className={`group bg-white p-3 rounded-3xl border-2 transition-all duration-300 ${isSel ? 'border-blue-500 bg-blue-50/30' : 'border-transparent shadow-sm hover:border-blue-100'}`}>
                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-slate-100">
                    <img src={video.thumbnail} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center cursor-pointer" onClick={() => setActiveVideo(video)}>
                      <Play className="w-12 h-12 text-white fill-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 pointer-events-none" />
                    </div>
                    <button 
                      onClick={() => {
                        const next = new Set(selectedIds);
                        next.has(video.id) ? next.delete(video.id) : next.add(video.id);
                        setSelectedIds(next);
                      }}
                      className="absolute top-3 left-3"
                    >
                      {isSel ? <CheckCircle2 className="w-7 h-7 text-blue-600 fill-white pointer-events-none" /> : <Circle className="w-7 h-7 text-white/80 pointer-events-none" />}
                    </button>
                  </div>

                  <div className="px-1">
                    <h3 className="font-bold text-sm text-slate-800 line-clamp-2 mb-2 min-h-[40px] leading-tight">{video.name}</h3>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-4">
                      <span>{video.size}</span>
                      <span>{video.date}</span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDownload(video)}
                        disabled={isDownloading}
                        className={`flex-1 ${isDownloading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all`}
                      >
                        {isDownloading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin pointer-events-none" /> Carregando</> : <><Download className="w-3.5 h-3.5 pointer-events-none" /> Baixar</>}
                      </button>
                      <button 
                        onClick={() => handleCopyLink(video.id)}
                        className={`w-11 h-10 flex items-center justify-center rounded-xl border-2 transition-all ${isCopied ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-blue-600'}`}
                      >
                        {isCopied ? <Check className="w-4 h-4 pointer-events-none" /> : <LinkIcon className="w-4 h-4 pointer-events-none" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setActiveVideo(null)} />
          <div className="relative w-full max-w-4xl bg-white rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="aspect-video bg-black relative">
              <button onClick={() => setActiveVideo(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/60 rounded-full text-white hover:bg-black/80"><X className="w-5 h-5" /></button>
              <iframe src={`https://drive.google.com/file/d/${activeVideo.id}/preview`} className="w-full h-full border-0" allow="autoplay; fullscreen" allowFullScreen />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
