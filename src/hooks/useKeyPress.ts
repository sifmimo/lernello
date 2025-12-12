'use client';

import { useState, useEffect, useCallback } from 'react';

export function useKeyPress(targetKey: string): boolean {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setKeyPressed(true);
      }
    };

    const upHandler = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]);

  return keyPressed;
}

export function useKeyboardShortcut(
  keys: string[],
  callback: () => void,
  options: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean } = {}
): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { ctrl = false, alt = false, shift = false, meta = false } = options;

      if (ctrl && !event.ctrlKey) return;
      if (alt && !event.altKey) return;
      if (shift && !event.shiftKey) return;
      if (meta && !event.metaKey) return;

      if (keys.includes(event.key)) {
        event.preventDefault();
        callback();
      }
    },
    [keys, callback, options]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function useEscapeKey(callback: () => void): void {
  useKeyboardShortcut(['Escape'], callback);
}
