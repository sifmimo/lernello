'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { Globe, Briefcase, Heart, Sun } from 'lucide-react';

interface RealWorldBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function RealWorldBlock({ block, onInteraction }: RealWorldBlockProps) {
  const { format, content } = block;

  const getIcon = () => {
    switch (format) {
      case 'career': return <Briefcase className="h-5 w-5 text-blue-600" />;
      case 'hobby': return <Heart className="h-5 w-5 text-pink-600" />;
      case 'daily_life': return <Sun className="h-5 w-5 text-orange-600" />;
      default: return <Globe className="h-5 w-5 text-emerald-600" />;
    }
  };

  const getLabel = () => {
    switch (format) {
      case 'career': return 'Dans le monde du travail';
      case 'hobby': return 'Dans tes loisirs';
      case 'daily_life': return 'Dans la vie de tous les jours';
      default: return 'Dans la vraie vie';
    }
  };

  const getBgColor = () => {
    switch (format) {
      case 'career': return 'from-blue-50 to-sky-50 border-blue-200';
      case 'hobby': return 'from-pink-50 to-rose-50 border-pink-200';
      case 'daily_life': return 'from-orange-50 to-amber-50 border-orange-200';
      default: return 'from-emerald-50 to-teal-50 border-emerald-200';
    }
  };

  return (
    <div 
      className={`rounded-xl bg-gradient-to-br ${getBgColor()} border-2 p-6 cursor-pointer hover:shadow-md transition-all`}
      onClick={onInteraction}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-full bg-white shadow-sm">
          {getIcon()}
        </div>
        <span className="font-semibold text-gray-700">{getLabel()}</span>
      </div>

      {content.context && (
        <div className="mb-3">
          <span className="inline-block px-3 py-1 rounded-full bg-white/70 text-sm font-medium text-gray-600">
            📍 {content.context}
          </span>
        </div>
      )}

      <p className="text-gray-800 leading-relaxed mb-3">
        {content.situation}
      </p>

      {content.connection_to_skill && (
        <div className="mt-4 pt-4 border-t border-gray-200/50">
          <p className="text-sm font-medium text-gray-600">
            💡 {content.connection_to_skill}
          </p>
        </div>
      )}
    </div>
  );
}
