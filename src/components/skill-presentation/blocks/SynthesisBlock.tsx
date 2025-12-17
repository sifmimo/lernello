'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { Bookmark, Volume2 } from 'lucide-react';
import { tts } from '@/lib/tts';

interface SynthesisBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function SynthesisBlock({ block, onInteraction }: SynthesisBlockProps) {
  const { format, content } = block;

  const handleSpeak = () => {
    if (content.phrase) {
      tts.speak(content.phrase);
      onInteraction?.();
    }
  };

  const renderMnemonicFormat = () => (
    <div className="rounded-xl bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-300 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-amber-600" />
          <span className="font-semibold text-amber-800">À retenir</span>
        </div>
        <button
          onClick={handleSpeak}
          className="p-2 rounded-full bg-amber-200 hover:bg-amber-300 transition-colors"
        >
          <Volume2 className="h-5 w-5 text-amber-700" />
        </button>
      </div>
      
      <p className="text-xl font-bold text-amber-900 text-center py-4">
        {content.phrase}
      </p>
      
      {content.visual_anchor && (
        <p className="text-3xl text-center mt-2">{content.visual_anchor}</p>
      )}
    </div>
  );

  const renderKeyPointsFormat = () => (
    <div className="rounded-xl bg-white border-2 border-indigo-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Bookmark className="h-5 w-5 text-indigo-600" />
        <span className="font-semibold text-indigo-800">Points clés</span>
      </div>
      
      <ul className="space-y-3">
        {(content.key_points || []).map((point, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex-shrink-0">
              {index + 1}
            </span>
            <span className="text-gray-700">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderVisualSummaryFormat = () => (
    <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-6">
      <div className="text-center">
        {content.image_url && (
          <img 
            src={content.image_url} 
            alt="Résumé visuel" 
            className="mx-auto max-h-48 rounded-lg mb-4"
          />
        )}
        <p className="text-lg font-medium text-purple-800">{content.phrase || content.text}</p>
      </div>
    </div>
  );

  switch (format) {
    case 'mnemonic': return renderMnemonicFormat();
    case 'key_points': return renderKeyPointsFormat();
    case 'visual_summary': return renderVisualSummaryFormat();
    default: return renderMnemonicFormat();
  }
}
