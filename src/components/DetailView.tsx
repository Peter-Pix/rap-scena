import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { ContentFile, ContentMetadata } from '../types';
import { ArrowLeft, Calendar, MapPin, Tag, User, Disc, Download, Pencil, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { deleteContent, formatMdxForDownload } from '../lib/content';
import { EditorModal } from './EditorModal';
import { ContentCard } from './ContentCard';

interface DetailViewProps {
  metadata: ContentMetadata;
  content: string;
  rawContent: string;
  allContent: ContentFile[];
  onBack: () => void;
  onNavigate: (slug: string) => void;
  onMarkDownloaded?: (slug: string) => void;
}

export function DetailView({ metadata, content, rawContent, allContent, onBack, onNavigate, onMarkDownloaded }: DetailViewProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const related = useMemo(() => {
    return allContent.filter(item => {
      if (item.metadata.slug === metadata.slug) return false;

      // Logic based on metadata fields
      if (metadata.type === 'raperi' && (metadata as any).relatedRappers?.includes(item.metadata.slug)) return true;
      if (metadata.type === 'raperi' && (metadata as any).relatedAlbums?.includes(item.metadata.slug)) return true;
      
      // ... expand as needed ...
      
      return false;
    });
  }, [allContent, metadata]);

  const handleDownload = () => {
    const formattedMdx = formatMdxForDownload(metadata, content);
    const blob = new Blob([formattedMdx], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.slug}.mdx`;
    a.click();
    URL.revokeObjectURL(url);
    if (onMarkDownloaded) {
      onMarkDownloaded(metadata.slug);
    }
  };


  const handleDelete = async () => {
    if (confirm('Opravdu chcete smazat tento obsah?')) {
      try {
        await deleteContent(metadata.type, metadata.slug);
        onBack();
        window.location.reload();
      } catch (err) {
        alert('Chyba při mazání: ' + err);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto py-12 px-6"
    >
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Zpět na seznam
        </button>
        
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="p-2 text-zinc-500 hover:text-white transition-colors" title="Stáhnout MDX">
            <Download size={20} />
          </button>
          <button onClick={() => setIsEditorOpen(true)} className="p-2 text-zinc-500 hover:text-white transition-colors" title="Editovat">
            <Pencil size={20} />
          </button>
          <button onClick={handleDelete} className="p-2 text-zinc-500 hover:text-red-500 transition-colors" title="Smazat">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold rounded tracking-wider">
            {metadata.type}
          </span>
          {metadata.publishedAt && (
            <span className="text-zinc-500 text-xs flex items-center gap-1">
              <Calendar size={12} />
              {new Date(metadata.publishedAt).toLocaleDateString('cs-CZ')}
            </span>
          )}
        </div>
        <h1 className="text-5xl font-black text-white mb-6">
          {metadata.title}
        </h1>
        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
          {metadata.description}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Informace</h4>
            
            {metadata.type === 'raperi' && (
              <>
                <InfoItem icon={User} label="Občanské jméno" value={metadata.realName} />
                <InfoItem icon={Calendar} label="Narozen" value={metadata.born} />
                <InfoItem icon={Tag} label="Aktivita" value={metadata.active} />
                <InfoItem icon={Tag} label="Label" value={metadata.label} />
              </>
            )}

            {metadata.type === 'alba' && (
              <>
                <InfoItem icon={User} label="Interpret" value={metadata.rapper} />
                <InfoItem icon={Calendar} label="Rok vydání" value={metadata.year.toString()} />
                <InfoItem icon={Tag} label="Label" value={metadata.label} />
              </>
            )}

            {metadata.type === 'labely' && (
              <>
                <InfoItem icon={Calendar} label="Založeno" value={metadata.founded} />
                <InfoItem icon={MapPin} label="Sídlo" value={metadata.location} />
              </>
            )}

            {metadata.type === 'skladby' && (
              <>
                <InfoItem icon={User} label="Interpret" value={metadata.rapper} />
                <InfoItem icon={Disc} label="Album" value={metadata.album} />
                <InfoItem icon={Calendar} label="Rok" value={metadata.year?.toString()} />
              </>
            )}
          </div>
        </aside>

        <article className="lg:col-span-3 space-y-12">
          <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-zinc-400 prose-li:text-zinc-400 prose-strong:text-white prose-blockquote:border-white">
            <div className="markdown-body">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>

          {related.length > 0 && (
            <div className="border-t border-zinc-900 pt-12">
              <h3 className="text-xl font-bold text-white mb-6">Související</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.map(item => (
                  <ContentCard
                    key={item.metadata.slug}
                    item={item.metadata}
                    onClick={() => onNavigate(item.metadata.slug)}
                  />
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
      {isEditorOpen && (
        <EditorModal 
          onClose={() => setIsEditorOpen(false)}
          onSaved={() => {
            setIsEditorOpen(false);
            window.location.reload();
          }}
          type={metadata.type}
          slug={metadata.slug}
          initialContent={rawContent}
        />
      )}
    </motion.div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{label}</p>
      <div className="flex items-center gap-2 text-sm text-zinc-200">
        <Icon size={14} className="text-zinc-500" />
        {value}
      </div>
    </div>
  );
}
