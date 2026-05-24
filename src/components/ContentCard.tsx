import { motion } from 'motion/react';
import { ContentMetadata } from '../types';
import { User, Disc, Building2, Hash, FileText, Music } from 'lucide-react';

interface ContentCardProps {
  item: ContentMetadata;
  onClick: () => void;
}

export function ContentCard({ item, onClick }: ContentCardProps) {
  const Icon = {
    raperi: User,
    alba: Disc,
    labely: Building2,
    zanry: Hash,
    clanky: FileText,
    skladby: Music,
  }[item.type];

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-xl cursor-pointer hover:border-zinc-500 transition-all group"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-zinc-700 transition-colors">
          <Icon size={20} className="text-zinc-400 group-hover:text-white" />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
          {item.type}
        </span>
      </div>
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-zinc-200">
        {item.title}
      </h3>
      <p className="text-sm text-zinc-400 line-clamp-2">
        {item.description}
      </p>
    </motion.div>
  );
}
