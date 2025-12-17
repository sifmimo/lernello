'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { getTTSService, TTSOptions } from '@/lib/tts-service';

interface TTSButtonProps {
  text: string;
  options?: TTSOptions;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
}

export function TTSButton({ 
  text, 
  options, 
  size = 'md', 
  variant = 'icon',
  className = '' 
}: TTSButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const tts = getTTSService();
    setIsSupported(tts.isSupported());
  }, []);

  const handleClick = async () => {
    const tts = getTTSService();
    
    if (isPlaying) {
      tts.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      try {
        await tts.speak(text, options);
      } catch (error) {
        console.error('TTS error:', error);
      } finally {
        setIsPlaying(false);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors text-sm font-medium ${className}`}
        title={isPlaying ? 'Arrêter' : 'Écouter'}
      >
        {isPlaying ? (
          <>
            <VolumeX className={iconSizes[size]} />
            Arrêter
          </>
        ) : (
          <>
            <Volume2 className={iconSizes[size]} />
            Écouter
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ${className}`}
      title={isPlaying ? 'Arrêter' : 'Écouter'}
    >
      {isPlaying ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : (
        <Volume2 className={iconSizes[size]} />
      )}
    </button>
  );
}
