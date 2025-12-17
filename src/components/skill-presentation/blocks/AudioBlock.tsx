'use client';

import { useState, useRef, useEffect } from 'react';
import { ContentBlock } from '@/types/skill-presentation';
import { Play, Pause, Volume2, VolumeX, RotateCcw, FastForward } from 'lucide-react';

interface AudioBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
  onComplete?: (completed: boolean) => void;
}

export function AudioBlock({ block, onInteraction, onComplete }: AudioBlockProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasListened, setHasListened] = useState(false);

  const content = block.content;
  const audioUrl = content.audio_url || '';
  const title = content.title || 'Audio';
  const transcript = content.text || '';

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
      if (audio.currentTime >= audio.duration * 0.9 && !hasListened) {
        setHasListened(true);
        onComplete?.(true);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setHasListened(true);
      onComplete?.(true);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [hasListened, onComplete]);

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

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setProgress(0);
  };

  const changeSpeed = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const speeds = [0.75, 1, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newRate = speeds[nextIndex];
    audio.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <Volume2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">
            {duration > 0 ? formatTime(duration) : 'Chargement...'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div 
        className="h-2 bg-gray-200 rounded-full cursor-pointer mb-4 overflow-hidden"
        onClick={seekTo}
      >
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </button>
          
          <button
            onClick={restart}
            className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={changeSpeed}
            className="px-3 py-1.5 rounded-full bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1"
          >
            <FastForward className="h-3 w-3" />
            {playbackRate}x
          </button>
          
          <button
            onClick={toggleMute}
            className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Transcript (optional) */}
      {transcript && (
        <details className="mt-4">
          <summary className="text-sm text-purple-600 cursor-pointer hover:text-purple-700">
            Voir la transcription
          </summary>
          <div className="mt-2 p-4 bg-white rounded-xl text-sm text-gray-700 leading-relaxed">
            {transcript}
          </div>
        </details>
      )}

      {/* Completion indicator */}
      {hasListened && (
        <div className="mt-4 flex items-center gap-2 text-green-600 text-sm">
          <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
            ✓
          </div>
          Audio écouté
        </div>
      )}
    </div>
  );
}
