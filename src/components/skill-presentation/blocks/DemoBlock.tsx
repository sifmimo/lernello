'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { Code, Play, Terminal } from 'lucide-react';
import { useState } from 'react';

interface DemoBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function DemoBlock({ block, onInteraction }: DemoBlockProps) {
  const { content } = block;
  const [showOutput, setShowOutput] = useState(false);

  return (
    <div 
      className="rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-lg"
      onClick={onInteraction}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 shadow-inner">
          <Code className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-cyan-300">
            {content.title || '💻 Démonstration'}
          </h3>
          <p className="text-sm text-cyan-500">Code en action</p>
        </div>
      </div>

      <div className="bg-slate-950 rounded-xl p-4 border border-slate-700 font-mono text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="ml-2 text-slate-500 text-xs">{content.language || 'code'}</span>
        </div>
        <pre className="text-green-400 whitespace-pre-wrap">
          {content.code || content.text}
        </pre>
      </div>

      {content.expected_output && (
        <div className="mt-4">
          <button
            onClick={(e) => { e.stopPropagation(); setShowOutput(!showOutput); }}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            {showOutput ? <Terminal className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {showOutput ? 'Masquer le résultat' : 'Voir le résultat'}
          </button>
          
          {showOutput && (
            <div className="mt-3 bg-slate-950 rounded-xl p-4 border border-cyan-500/30">
              <p className="text-xs text-cyan-500 mb-2">Sortie :</p>
              <pre className="text-white whitespace-pre-wrap">{content.expected_output}</pre>
            </div>
          )}
        </div>
      )}

      {content.visual_hint && (
        <p className="mt-4 text-sm text-cyan-400 italic flex items-center gap-2">
          <span>💡</span> {content.visual_hint}
        </p>
      )}
    </div>
  );
}
