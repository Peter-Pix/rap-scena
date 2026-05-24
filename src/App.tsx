import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getAllContent, formatMdxForDownload } from './lib/content';
import { ContentFile, ContentMetadata } from './types';
import { ContentCard } from './components/ContentCard';
import { DetailView } from './components/DetailView';
import { SettingsModal } from './components/SettingsModal';
import { CreatorModal } from './components/CreatorModal';
import { Search, Loader2, Plus, Settings } from 'lucide-react';

export default function App() {
  const [content, setContent] = useState<ContentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentMetadata['type'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [downloadStateFilter, setDownloadStateFilter] = useState<'all' | 'downloaded' | 'new'>('all');
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [downloadedSlugs, setDownloadedSlugs] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('downloaded_slugs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  const handleToggleSelect = (slug: string) => {
    const next = new Set(selectedSlugs);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setSelectedSlugs(next);
  };

  const handleBulkDownload = async (slugsToDownload: Set<string>) => {
    if (slugsToDownload.size === 0) return;
    
    const files = content.filter(c => slugsToDownload.has(c.metadata.slug));
    
    if (files.length === 1) {
      const file = files[0];
      const formattedMdx = formatMdxForDownload(file.metadata, file.content);
      const blob = new Blob([formattedMdx], { type: 'text/markdown' });
      saveAs(blob, `${file.metadata.slug}.mdx`);
    } else {
      const zip = new JSZip();
      files.forEach(file => {
        const formattedMdx = formatMdxForDownload(file.metadata, file.content);
        zip.file(`${file.metadata.type}/${file.metadata.slug}.mdx`, formattedMdx);
      });
      const contentZip = await zip.generateAsync({ type: "blob" });
      saveAs(contentZip, "rapscena-export.zip");
    }

    const nextDownloaded = new Set(downloadedSlugs);
    slugsToDownload.forEach(s => nextDownloaded.add(s));
    setDownloadedSlugs(nextDownloaded);
    localStorage.setItem('downloaded_slugs', JSON.stringify(Array.from(nextDownloaded)));
    
    setSelectedSlugs(new Set());
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllContent();
      setContent(data);
    } catch (err) {
      console.error('Failed to load content:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredContent = useMemo(() => {
    return content.filter(item => {
      const type = item.metadata.type;
      const matchesTab = activeTab === 'all' || type === activeTab;
      const matchesSearch = item.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.metadata.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesDownload = true;
      if (downloadStateFilter === 'downloaded') {
        matchesDownload = downloadedSlugs.has(item.metadata.slug);
      } else if (downloadStateFilter === 'new') {
        matchesDownload = !downloadedSlugs.has(item.metadata.slug);
      }
      
      return matchesTab && matchesSearch && matchesDownload;
    });
  }, [content, activeTab, searchQuery, downloadStateFilter, downloadedSlugs]);

  const selectedItem = useMemo(() => {
    return content.find(item => item.metadata.slug === selectedSlug);
  }, [content, selectedSlug]);

  if (loading && content.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <nav className="border-b border-zinc-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="text-xl font-black tracking-tighter cursor-pointer select-none"
            onClick={() => {
              setSelectedSlug(null);
              setActiveTab('all');
              setSearchQuery('');
            }}
          >
            RAPSCÉNA<span className="text-zinc-500">.CZ</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 focus-within:border-zinc-500 transition-colors">
              <Search size={14} className="text-zinc-500" />
              <input 
                type="text" 
                placeholder="Hledat..." 
                autoComplete="off"
                className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-zinc-600 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button
              onClick={() => setIsCreatorOpen(true)}
              className="bg-white text-black p-2 rounded-full hover:scale-110 transition-all flex items-center justify-center shadow-lg"
              title="Přidat nový obsah"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="bg-zinc-800 text-white p-2 rounded-full hover:scale-110 transition-all flex items-center justify-center"
              title="Nastavení"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto min-h-[calc(100vh-64px)]">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/10 border-b border-red-500/20 px-6 py-4"
            >
              <p className="text-sm text-red-500 font-bold max-w-7xl mx-auto">Chyba při načítání dat: {error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {selectedItem ? (
            <DetailView 
              key="detail"
              metadata={selectedItem.metadata}
              content={selectedItem.content}
              rawContent={selectedItem.rawContent}
              allContent={content}
              onBack={() => setSelectedSlug(null)}
              onNavigate={(slug) => setSelectedSlug(slug)}
              onMarkDownloaded={(slug) => {
                const next = new Set(downloadedSlugs);
                next.add(slug);
                setDownloadedSlugs(next);
                localStorage.setItem('downloaded_slugs', JSON.stringify(Array.from(next)));
              }}
            />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 px-6"
            >
              <div className="flex flex-wrap gap-2 mb-12">
                {[
                  { id: 'all', label: 'Vše' },
                  { id: 'raperi', label: 'Rappeři' },
                  { id: 'alba', label: 'Alba' },
                  { id: 'skladby', label: 'Skladby' },
                  { id: 'labely', label: 'Labely' },
                  { id: 'zanry', label: 'Žánry' },
                  { id: 'clanky', label: 'Články' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all border ${
                      activeTab === tab.id 
                        ? 'bg-white text-black border-white' 
                        : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white border-zinc-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mr-2">Stav</span>
                  {[
                    { id: 'all', label: 'Vše' },
                    { id: 'new', label: 'Nové' },
                    { id: 'downloaded', label: 'Stažené' }
                  ].map(f => (
                    <button 
                      key={f.id}
                      onClick={() => setDownloadStateFilter(f.id as any)}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                        downloadStateFilter === f.id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2 items-center flex-wrap">
                  <button 
                    onClick={() => setSelectedSlugs(new Set(filteredContent.map(i => i.metadata.slug)))}
                    className="text-xs text-zinc-400 hover:text-white px-3"
                  >
                    Vybrat vše
                  </button>
                  <button 
                    onClick={() => setSelectedSlugs(new Set())}
                    className="text-xs text-zinc-400 hover:text-white px-3"
                  >
                    Zrušit výběr
                  </button>
                  <button
                    onClick={() => handleBulkDownload(new Set(filteredContent.map(i => i.metadata.slug)))}
                    className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-700 transition"
                  >
                    Stáhnout vše ({filteredContent.length})
                  </button>
                  {selectedSlugs.size > 0 && (
                    <button
                      onClick={() => handleBulkDownload(selectedSlugs)}
                      className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-200 transition"
                    >
                      Stáhnout vybrané ({selectedSlugs.size})
                    </button>
                  )}
                </div>
              </div>

              {filteredContent.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContent.map((item) => (
                    <ContentCard
                      key={item.metadata.slug}
                      item={item.metadata}
                      isSelected={selectedSlugs.has(item.metadata.slug)}
                      onToggleSelect={() => handleToggleSelect(item.metadata.slug)}
                      onClick={() => setSelectedSlug(item.metadata.slug)}
                    />
                  ))}
                  
                  {/* Plus button inside grid as well */}
                  <motion.div
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="bg-zinc-900/20 border border-zinc-800 border-dashed p-6 rounded-xl cursor-pointer hover:border-zinc-500 hover:bg-zinc-900/50 transition-all flex flex-col items-center justify-center gap-4 text-zinc-500 hover:text-white group"
                    onClick={() => setIsCreatorOpen(true)}
                  >
                    <div className="p-4 bg-zinc-900 rounded-full group-hover:scale-110 transition-transform">
                      <Plus size={32} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">Přidat {activeTab !== 'all' ? activeTab : 'obsah'}</span>
                  </motion.div>
                </div>
              ) : (
                <div className="text-center py-24 border border-dashed border-zinc-800 rounded-3xl flex flex-col items-center gap-6">
                  <p className="text-zinc-500">Nebyly nalezeny žádné výsledky pro váš výběr.</p>
                  <button
                    onClick={() => setIsCreatorOpen(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-full text-sm font-bold transition-all"
                  >
                    <Plus size={16} /> Vytvořit {activeTab !== 'all' ? activeTab : 'nový záznam'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreatorOpen && (
          <CreatorModal 
            initialType={activeTab === 'all' ? 'raperi' : activeTab}
            onClose={() => setIsCreatorOpen(false)}
            onSaved={() => {
              setIsCreatorOpen(false);
              load();
            }}
          />
        )}
      </AnimatePresence>

      <footer className="border-t border-zinc-800 py-12 px-6 mt-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-sm text-zinc-500">
            © 2026 RapScéna.cz — Kompletní průvodce českým rapem. Všechna data jsou čerpána z ověřených zdrojů.
          </div>
          <div className="flex gap-8 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <a href="https://cs.wikipedia.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Wikipedia</a>
            <a href="https://diskografie.cz" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Diskografie.cz</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
