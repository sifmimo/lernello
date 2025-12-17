'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Palette, Shirt, Sparkles } from 'lucide-react';
import { getAvatar, updateAvatar, AvatarConfig } from '@/server/actions/avatar';

interface AvatarCustomizerProps {
  studentId: string;
  onSave?: () => void;
}

const AVATAR_STYLES = [
  { id: 'explorer', emoji: '🚀', label: 'Explorateur' },
  { id: 'scientist', emoji: '🔬', label: 'Scientifique' },
  { id: 'artist', emoji: '🎨', label: 'Artiste' },
  { id: 'athlete', emoji: '⚽', label: 'Sportif' },
  { id: 'musician', emoji: '🎵', label: 'Musicien' },
  { id: 'nature', emoji: '🌿', label: 'Naturaliste' },
];

const SKIN_COLORS = [
  { id: 'light', color: '#FFE0BD' },
  { id: 'medium-light', color: '#F1C27D' },
  { id: 'medium', color: '#E0AC69' },
  { id: 'medium-dark', color: '#C68642' },
  { id: 'dark', color: '#8D5524' },
];

const HAIR_STYLES = [
  { id: 'short', label: 'Court' },
  { id: 'medium', label: 'Mi-long' },
  { id: 'long', label: 'Long' },
  { id: 'curly', label: 'Bouclé' },
  { id: 'ponytail', label: 'Queue' },
  { id: 'bun', label: 'Chignon' },
];

const HAIR_COLORS = [
  { id: 'black', color: '#1a1a1a' },
  { id: 'brown', color: '#4a3728' },
  { id: 'blonde', color: '#d4a76a' },
  { id: 'red', color: '#8b4513' },
  { id: 'blue', color: '#4169e1' },
  { id: 'pink', color: '#ff69b4' },
];

const OUTFITS = [
  { id: 'casual', emoji: '👕', label: 'Décontracté' },
  { id: 'sporty', emoji: '🏃', label: 'Sportif' },
  { id: 'fancy', emoji: '👔', label: 'Chic' },
  { id: 'adventure', emoji: '🎒', label: 'Aventurier' },
  { id: 'space', emoji: '🚀', label: 'Spatial' },
  { id: 'magic', emoji: '✨', label: 'Magique' },
];

export default function AvatarCustomizer({ studentId, onSave }: AvatarCustomizerProps) {
  const [config, setConfig] = useState<AvatarConfig>({
    avatarStyle: 'explorer',
    skinColor: 'medium',
    hairStyle: 'short',
    hairColor: 'brown',
    outfit: 'casual',
    accessories: [],
  });
  const [activeTab, setActiveTab] = useState<'style' | 'appearance' | 'outfit'>('style');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvatar();
  }, [studentId]);

  const loadAvatar = async () => {
    const data = await getAvatar(studentId);
    if (data) {
      setConfig(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateAvatar(studentId, config);
    setSaving(false);
    onSave?.();
  };

  const getAvatarPreview = () => {
    const style = AVATAR_STYLES.find(s => s.id === config.avatarStyle);
    const skinColor = SKIN_COLORS.find(s => s.id === config.skinColor)?.color || '#F1C27D';
    const hairColor = HAIR_COLORS.find(h => h.id === config.hairColor)?.color || '#4a3728';

    return (
      <div className="relative w-32 h-32 mx-auto">
        <div 
          className="w-full h-full rounded-full flex items-center justify-center text-5xl"
          style={{ backgroundColor: skinColor }}
        >
          {style?.emoji}
        </div>
        <div 
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-8 rounded-t-full"
          style={{ backgroundColor: hairColor }}
        />
      </div>
    );
  };

  if (loading) {
    return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white text-center">
        <h2 className="text-xl font-bold mb-4">Personnalise ton avatar</h2>
        {getAvatarPreview()}
      </div>

      <div className="flex border-b">
        {[
          { id: 'style', label: 'Style', icon: Sparkles },
          { id: 'appearance', label: 'Apparence', icon: Palette },
          { id: 'outfit', label: 'Tenue', icon: Shirt },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'style' && (
          <div className="grid grid-cols-3 gap-3">
            {AVATAR_STYLES.map(style => (
              <motion.button
                key={style.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setConfig(prev => ({ ...prev, avatarStyle: style.id }))}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  config.avatarStyle === style.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <span className="text-3xl block mb-1">{style.emoji}</span>
                <span className="text-sm font-medium text-gray-700">{style.label}</span>
                {config.avatarStyle === style.id && (
                  <Check className="h-4 w-4 text-purple-500 mx-auto mt-1" />
                )}
              </motion.button>
            ))}
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Couleur de peau</h3>
              <div className="flex gap-3 justify-center">
                {SKIN_COLORS.map(skin => (
                  <button
                    key={skin.id}
                    onClick={() => setConfig(prev => ({ ...prev, skinColor: skin.id }))}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      config.skinColor === skin.id
                        ? 'border-purple-500 ring-2 ring-purple-200'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: skin.color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Style de cheveux</h3>
              <div className="grid grid-cols-3 gap-2">
                {HAIR_STYLES.map(hair => (
                  <button
                    key={hair.id}
                    onClick={() => setConfig(prev => ({ ...prev, hairStyle: hair.id }))}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      config.hairStyle === hair.id
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                    }`}
                  >
                    {hair.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Couleur de cheveux</h3>
              <div className="flex gap-3 justify-center">
                {HAIR_COLORS.map(hair => (
                  <button
                    key={hair.id}
                    onClick={() => setConfig(prev => ({ ...prev, hairColor: hair.id }))}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      config.hairColor === hair.id
                        ? 'border-purple-500 ring-2 ring-purple-200'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: hair.color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'outfit' && (
          <div className="grid grid-cols-3 gap-3">
            {OUTFITS.map(outfit => (
              <motion.button
                key={outfit.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setConfig(prev => ({ ...prev, outfit: outfit.id }))}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  config.outfit === outfit.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <span className="text-3xl block mb-1">{outfit.emoji}</span>
                <span className="text-sm font-medium text-gray-700">{outfit.label}</span>
                {config.outfit === outfit.id && (
                  <Check className="h-4 w-4 text-purple-500 mx-auto mt-1" />
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer mon avatar'}
        </button>
      </div>
    </div>
  );
}
