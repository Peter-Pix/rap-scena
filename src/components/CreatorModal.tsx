import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Wand2, Eye, Code, Save, Loader2 } from 'lucide-react';
import { generateContentFromAI, saveContent } from '../lib/content';
import ReactMarkdown from 'react-markdown';
import matter from 'gray-matter';

interface CreatorModalProps {
  onClose: () => void;
  onSaved: () => void;
  initialType?: string;
}

export function CreatorModal({ onClose, onSaved, initialType }: CreatorModalProps) {
  const [step, setStep] = useState<'input' | 'edit'>('input');
  const [type, setType] = useState(initialType || 'raperi');
  const [query, setQuery] = useState('');
  const [mdx, setMdx] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'mdx' | 'preview'>('mdx');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step === 'edit' && mdx) {
      const timer = setTimeout(() => {
        handleSave();
      }, 5000); // Auto-save after 5 seconds of inactivity
      return () => clearTimeout(timer);
    }
  }, [mdx, step]);

  const handleGenerate = async () => {
    if (!query) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateContentFromAI(type, query);
      setMdx(result);
      setStep('edit');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      const { data } = matter(mdx);
      if (!data.slug) throw new Error('MDX postrádá pole "slug" ve frontmatter.');
      
      await saveContent(type, data.slug, mdx);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  let previewMetadata = {};
  let previewContent = '';
  if (step === 'edit') {
    try {
      const parsed = matter(mdx);
      previewMetadata = parsed.data;
      previewContent = parsed.content;
    } catch (e) {
      previewContent = '> Mimořádně neplatný YAML frontmatter v MDX. Opravte jej prosím v editoru.';
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wand2 size={20} className="text-zinc-400" />
            Vytvořit nový obsah
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/10 border-b border-red-500/20 px-6 py-4"
            >
              <p className="text-sm text-red-500 font-bold">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {step === 'input' ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl mx-auto space-y-8 py-12"
              >
                <div className="space-y-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Typ obsahu</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['raperi', 'alba', 'skladby', 'labely', 'zanry', 'clanky'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                          type === t ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Název / Dotaz</label>
                  <div className="relative">
                    <input
                      autoFocus
                      type="text"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-12 py-4 text-lg focus:border-white focus:ring-0 outline-none transition-all placeholder:text-zinc-700"
                      placeholder="Např: Viktor Sheen, Milion Plus, Trap..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                  </div>
                  <p className="text-xs text-zinc-500">
                    AI vyhledá ověřené informace a předpřipraví MDX soubor.
                  </p>
                </div>

                <button
                  disabled={!query || isGenerating}
                  onClick={handleGenerate}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Generuji data...
                    </>
                  ) : (
                    <>
                      <Wand2 size={20} />
                      Vygenerovat profil
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col gap-6"
              >
                <div className="flex justify-center">
                  <div className="bg-zinc-900 p-1 rounded-lg flex border border-zinc-800">
                    <button
                      onClick={() => setViewMode('mdx')}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'mdx' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Code size={14} /> MDX Editor
                    </button>
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'preview' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Eye size={14} /> Náhled
                    </button>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 overflow-hidden min-h-[400px]">
                  {viewMode === 'mdx' ? (
                    <textarea
                      autoFocus
                      className="w-full h-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 font-mono text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 resize-none"
                      value={mdx}
                      onChange={(e) => setMdx(e.target.value)}
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900/30 border border-zinc-800 rounded-xl p-8 overflow-y-auto prose prose-invert max-w-none">
                      <div className="markdown-body">
                        <ReactMarkdown>{previewContent}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={() => setStep('input')}
                    className="text-zinc-500 hover:text-white text-sm"
                  >
                    ← Zpět na zadání
                  </button>
                  <button
                    disabled={isSaving}
                    onClick={handleSave}
                    className="bg-zinc-100 text-black font-black px-8 py-3 rounded-xl flex items-center gap-2 hover:bg-white transition-all shadow-lg active:scale-95"
                  >
                    {isSaving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    Uložit do databáze
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
