import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, Code, Save, Loader2 } from 'lucide-react';
import { saveContent } from '../lib/content';
import ReactMarkdown from 'react-markdown';
import matter from 'gray-matter';

interface EditorModalProps {
  onClose: () => void;
  onSaved: () => void;
  type: string;
  slug: string;
  initialContent: string;
}

export function EditorModal({ onClose, onSaved, type, slug, initialContent }: EditorModalProps) {
  const [mdx, setMdx] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'mdx' | 'preview'>('mdx');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      await saveContent(type, slug, mdx);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  let previewContent = '';
  try {
    const parsed = matter(mdx);
    previewContent = parsed.content;
  } catch (e) {
    previewContent = '> Neplatný YAML frontmatter v MDX. Opravte jej prosím v editoru.';
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
          <h2 className="text-xl font-bold">Editovat obsah</h2>
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

        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
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

          <div className="flex justify-end pt-4">
            <button
              disabled={isSaving}
              onClick={handleSave}
              className="bg-white text-black font-black px-8 py-3 rounded-xl flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Uložit změny
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
