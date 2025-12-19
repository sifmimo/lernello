'use client';

import { useState, useRef, useEffect } from 'react';
import { ContentBlock } from '@/types/skill-presentation';
import { Play, Pause, Volume2, Mic, RotateCcw } from 'lucide-react';
import { Lumi } from '@/components/lumi';
import { tts } from '@/lib/tts';

interface NarrationBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
  onComplete?: (completed: boolean) => void;
}

export function NarrationBlock({ block, onInteraction, onComplete }: NarrationBlockProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [hasListened, setHasListened] = useState(false);

  const content = block.content;
  const audioUrl = content.audio_url || '';
  const text = content.text || '';
  const character = content.character || 'lumi';
  const emotion = content.emotion || 'friendly';
  
  // Split text into sentences for highlighting
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const progressPercent = (audio.currentTime / audio.duration) * 100;
      setProgress(progressPercent);
      
      // Estimate current sentence based on progress
      const sentenceIndex = Math.min(
        Math.floor((progressPercent / 100) * sentences.length),
        sentences.length - 1
      );
      setCurrentSentenceIndex(sentenceIndex);
      
      if (audio.currentTime >= audio.duration * 0.9 && !hasListened) {
        setHasListened(true);
        onComplete?.(true);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setHasListened(true);
      onComplete?.(true);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [hasListened, onComplete, sentences.length]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
      onInteraction?.();
    }
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setProgress(0);
    setCurrentSentenceIndex(0);
  };

  // Map emotion to Lumi mood
  const lumiMood = emotion === 'excited' ? 'celebrating' :
                   emotion === 'curious' ? 'thinking' :
                   emotion === 'encouraging' ? 'happy' :
                   'neutral';

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}
      
      {/* Character and narration */}
      <div className="flex gap-4">
        {/* Character avatar */}
        <div className="flex-shrink-0">
          {character === 'lumi' ? (
            <div className="relative">
              <Lumi mood={lumiMood} size="md" />
              {isPlaying && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Mic className="h-3 w-3 text-white animate-pulse" />
                </div>
              )}
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <Volume2 className="h-8 w-8 text-white" />
            </div>
          )}
        </div>

        {/* Text content with sentence highlighting */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
            {sentences.length > 0 ? (
              <p className="text-gray-800 leading-relaxed">
                {sentences.map((sentence, idx) => (
                  <span
                    key={idx}
                    className={`transition-colors duration-300 ${
                      idx === currentSentenceIndex && isPlaying
                        ? 'bg-yellow-200 text-gray-900'
                        : idx < currentSentenceIndex
                        ? 'text-gray-600'
                        : 'text-gray-800'
                    }`}
                  >
                    {sentence}{' '}
                  </span>
                ))}
              </p>
            ) : (
              <p className="text-gray-800 leading-relaxed">{text}</p>
            )}
          </div>
        </div>
      </div>

      {/* Audio controls */}
      {audioUrl && (
        <div className="mt-4">
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={restart}
              className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            
            <button
              onClick={togglePlay}
              className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" />
              )}
            </button>

            <div className="h-10 w-10" /> {/* Spacer for symmetry */}
          </div>
        </div>
      )}

      {/* No audio - just text with TTS button */}
      {!audioUrl && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={async () => {
              await tts.speak(text);
              onInteraction?.();
              setHasListened(true);
              onComplete?.(true);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-shadow"
          >
            <Volume2 className="h-5 w-5" />
            Écouter
          </button>
        </div>
      )}

      {/* Completion indicator */}
      {hasListened && (
        <div className="mt-4 flex items-center justify-center gap-2 text-green-600 text-sm">
          <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
            ✓
          </div>
          Narration écoutée
        </div>
      )}
    </div>
  );
}
