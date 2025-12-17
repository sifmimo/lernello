'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { Telescope, Sparkles, History, PartyPopper } from 'lucide-react';

interface ExtensionBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function ExtensionBlock({ block, onInteraction }: ExtensionBlockProps) {
  const { format, content } = block;

  const getIcon = () => {
    switch (format) {
      case 'deep_dive': return <Telescope className="h-5 w-5 text-indigo-600" />;
      case 'curiosity': return <Sparkles className="h-5 w-5 text-purple-600" />;
      case 'historical': return <History className="h-5 w-5 text-amber-600" />;
      case 'fun_fact': return <PartyPopper className="h-5 w-5 text-pink-600" />;
      default: return <Sparkles className="h-5 w-5 text-gray-600" />;
    }
  };

  const getLabel = () => {
    switch (format) {
      case 'deep_dive': return 'Pour aller plus loin';
      case 'curiosity': return 'Le savais-tu ?';
      case 'historical': return 'Un peu d\'histoire';
      case 'fun_fact': return 'Fait amusant';
      default: return 'Bonus';
    }
  };

  const getBgColor = () => {
    switch (format) {
      case 'deep_dive': return 'from-indigo-50 to-blue-50 border-indigo-200';
      case 'curiosity': return 'from-purple-50 to-violet-50 border-purple-200';
      case 'historical': return 'from-amber-50 to-yellow-50 border-amber-200';
      case 'fun_fact': return 'from-pink-50 to-rose-50 border-pink-200';
      default: return 'from-gray-50 to-slate-50 border-gray-200';
    }
  };

  return (
    <div 
      className={`rounded-xl bg-gradient-to-br ${getBgColor()} border-2 p-6 cursor-pointer hover:shadow-md transition-all`}
      onClick={onInteraction}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-full bg-white shadow-sm">
          {getIcon()}
        </div>
        <span className="font-semibold text-gray-700">{getLabel()}</span>
      </div>

      <p className="text-gray-800 leading-relaxed">
        {content.fact || content.text}
      </p>

      {content.source && (
        <p className="mt-3 text-sm text-gray-500">
          Source: {content.source}
        </p>
      )}
    </div>
  );
}
