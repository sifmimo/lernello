'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { BookOpen, Play, Volume2 } from 'lucide-react';
import { useState } from 'react';

interface ConceptBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function ConceptBlock({ block, onInteraction }: ConceptBlockProps) {
  const { format, content } = block;
  const [isPlaying, setIsPlaying] = useState(false);

  const renderTextFormat = () => (
    <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-indigo-600" />
        <span className="text-sm font-medium text-indigo-600">À retenir</span>
      </div>
      <p className="text-gray-700 leading-relaxed text-lg">{content.text}</p>
    </div>
  );

  const renderVisualFormat = () => (
    <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
      {content.image_url && (
        <img 
          src={content.image_url} 
          alt={content.alt_text || 'Illustration du concept'} 
          className="w-full h-auto max-h-64 object-contain bg-gray-50"
        />
      )}
      {content.caption && (
        <p className="p-4 text-center text-gray-600 font-medium">{content.caption}</p>
      )}
    </div>
  );

  const renderVideoFormat = () => (
    <div className="rounded-xl bg-black overflow-hidden shadow-lg">
      <div className="relative aspect-video">
        {content.video_url ? (
          <video 
            src={content.video_url} 
            controls 
            className="w-full h-full"
            onPlay={() => { setIsPlaying(true); onInteraction?.(); }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <button 
              onClick={() => setIsPlaying(true)}
              className="flex items-center gap-2 rounded-full bg-white/20 px-6 py-3 text-white hover:bg-white/30 transition-colors"
            >
              <Play className="h-6 w-6" />
              <span>Regarder</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderAudioFormat = () => (
    <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-lg">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => { setIsPlaying(!isPlaying); onInteraction?.(); }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          {isPlaying ? (
            <Volume2 className="h-6 w-6 animate-pulse" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
        </button>
        <div className="flex-1">
          <p className="font-medium">{content.narration || 'Écoute l\'explication'}</p>
          {content.audio_url && (
            <audio 
              src={content.audio_url} 
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderAnimationFormat = () => (
    <div className="rounded-xl bg-white border-2 border-indigo-200 p-6 shadow-sm">
      <div className="aspect-video bg-indigo-50 rounded-lg flex items-center justify-center">
        {content.animation_id ? (
          <div className="text-center">
            <div className="animate-bounce mb-2">🎬</div>
            <p className="text-indigo-600 font-medium">Animation: {content.animation_id}</p>
          </div>
        ) : (
          <p className="text-gray-500">Animation interactive</p>
        )}
      </div>
      {content.narration && (
        <p className="mt-4 text-center text-gray-600">{content.narration}</p>
      )}
    </div>
  );

  const renderInteractiveFormat = () => (
    <div 
      className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 p-6 cursor-pointer hover:shadow-lg transition-all"
      onClick={onInteraction}
    >
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
          <span className="text-3xl">👆</span>
        </div>
        <p className="text-emerald-800 font-medium text-lg">{content.text || 'Clique pour interagir'}</p>
      </div>
    </div>
  );

  switch (format) {
    case 'visual': return renderVisualFormat();
    case 'video': return renderVideoFormat();
    case 'audio': return renderAudioFormat();
    case 'animation': return renderAnimationFormat();
    case 'interactive': return renderInteractiveFormat();
    default: return renderTextFormat();
  }
}
