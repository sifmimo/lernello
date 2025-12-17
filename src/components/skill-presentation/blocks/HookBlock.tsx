'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { Lumi } from '@/components/lumi';
import { Sparkles, HelpCircle, Zap, Search } from 'lucide-react';

interface HookBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function HookBlock({ block, onInteraction }: HookBlockProps) {
  const { format, content } = block;

  const getIcon = () => {
    switch (format) {
      case 'story': return <Sparkles className="h-5 w-5 text-purple-500" />;
      case 'question': return <HelpCircle className="h-5 w-5 text-blue-500" />;
      case 'challenge': return <Zap className="h-5 w-5 text-orange-500" />;
      case 'mystery': return <Search className="h-5 w-5 text-indigo-500" />;
      default: return <Sparkles className="h-5 w-5 text-purple-500" />;
    }
  };

  const getBgColor = () => {
    switch (format) {
      case 'story': return 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200';
      case 'question': return 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200';
      case 'challenge': return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
      case 'mystery': return 'bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-200';
      default: return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
    }
  };

  return (
    <div 
      className={`rounded-2xl border-2 p-6 ${getBgColor()} transition-all hover:shadow-md`}
      onClick={onInteraction}
    >
      <div className="flex items-start gap-4">
        {content.character === 'lumi' ? (
          <Lumi mood="curious" size="sm" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            {getIcon()}
          </div>
        )}
        
        <div className="flex-1">
          <p className="text-lg font-medium text-gray-800 leading-relaxed">
            {content.text}
          </p>
          
          {content.image_url && (
            <img 
              src={content.image_url} 
              alt={content.alt_text || ''} 
              className="mt-4 rounded-xl max-h-48 object-cover"
            />
          )}
        </div>
      </div>
    </div>
  );
}
