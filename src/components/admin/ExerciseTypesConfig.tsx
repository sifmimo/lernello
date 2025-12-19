'use client';

import { useState } from 'react';
import { Check, X, Info } from 'lucide-react';
import { EXERCISE_TYPES, EXERCISE_CATEGORIES, ExerciseTypeId, ExerciseCategoryId } from '@/types/exercise-types';

interface ExerciseTypesConfigProps {
  allowedTypes: ExerciseTypeId[];
  preferredTypes?: ExerciseTypeId[];
  onChange: (allowed: ExerciseTypeId[], preferred: ExerciseTypeId[]) => void;
  disabled?: boolean;
}

export function ExerciseTypesConfig({
  allowedTypes,
  preferredTypes = [],
  onChange,
  disabled = false,
}: ExerciseTypesConfigProps) {
  const [localAllowed, setLocalAllowed] = useState<Set<ExerciseTypeId>>(new Set(allowedTypes));
  const [localPreferred, setLocalPreferred] = useState<Set<ExerciseTypeId>>(new Set(preferredTypes));

  const toggleAllowed = (typeId: ExerciseTypeId) => {
    if (disabled) return;
    const newAllowed = new Set(localAllowed);
    if (newAllowed.has(typeId)) {
      newAllowed.delete(typeId);
      // Si on désactive, retirer aussi des préférés
      const newPreferred = new Set(localPreferred);
      newPreferred.delete(typeId);
      setLocalPreferred(newPreferred);
      onChange(Array.from(newAllowed), Array.from(newPreferred));
    } else {
      newAllowed.add(typeId);
    }
    setLocalAllowed(newAllowed);
    onChange(Array.from(newAllowed), Array.from(localPreferred));
  };

  const togglePreferred = (typeId: ExerciseTypeId) => {
    if (disabled || !localAllowed.has(typeId)) return;
    const newPreferred = new Set(localPreferred);
    if (newPreferred.has(typeId)) {
      newPreferred.delete(typeId);
    } else {
      newPreferred.add(typeId);
    }
    setLocalPreferred(newPreferred);
    onChange(Array.from(localAllowed), Array.from(newPreferred));
  };

  const selectAllInCategory = (category: ExerciseCategoryId) => {
    if (disabled) return;
    const newAllowed = new Set(localAllowed);
    Object.entries(EXERCISE_TYPES).forEach(([id, info]) => {
      if (info.category === category) {
        newAllowed.add(id as ExerciseTypeId);
      }
    });
    setLocalAllowed(newAllowed);
    onChange(Array.from(newAllowed), Array.from(localPreferred));
  };

  const deselectAllInCategory = (category: ExerciseCategoryId) => {
    if (disabled) return;
    const newAllowed = new Set(localAllowed);
    const newPreferred = new Set(localPreferred);
    Object.entries(EXERCISE_TYPES).forEach(([id, info]) => {
      if (info.category === category) {
        newAllowed.delete(id as ExerciseTypeId);
        newPreferred.delete(id as ExerciseTypeId);
      }
    });
    setLocalAllowed(newAllowed);
    setLocalPreferred(newPreferred);
    onChange(Array.from(newAllowed), Array.from(newPreferred));
  };

  const groupedTypes = Object.entries(EXERCISE_CATEGORIES).map(([categoryId, categoryInfo]) => ({
    categoryId: categoryId as ExerciseCategoryId,
    ...categoryInfo,
    types: Object.entries(EXERCISE_TYPES)
      .filter(([, info]) => info.category === categoryId)
      .map(([typeId, info]) => ({ typeId: typeId as ExerciseTypeId, ...info })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
        <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <span>
          Cochez les types d'exercices autorisés pour cette compétence. 
          Les types marqués ⭐ seront prioritaires lors de la génération IA.
        </span>
      </div>

      {groupedTypes.map((category) => (
        <div key={category.categoryId} className="border rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{category.name}</h4>
              <p className="text-sm text-gray-500">{category.description}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => selectAllInCategory(category.categoryId)}
                disabled={disabled}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
              >
                Tout activer
              </button>
              <button
                onClick={() => deselectAllInCategory(category.categoryId)}
                disabled={disabled}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
              >
                Tout désactiver
              </button>
            </div>
          </div>
          
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {category.types.map((type) => {
              const isAllowed = localAllowed.has(type.typeId);
              const isPreferred = localPreferred.has(type.typeId);
              
              return (
                <div
                  key={type.typeId}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                    ${isAllowed 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200 bg-white opacity-60'
                    }
                    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  onClick={() => toggleAllowed(type.typeId)}
                >
                  <div className="text-2xl">{type.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{type.name}</span>
                      {type.requiresMedia && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                          Média
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{type.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePreferred(type.typeId);
                      }}
                      disabled={disabled || !isAllowed}
                      className={`
                        p-1.5 rounded-full transition-all
                        ${isPreferred 
                          ? 'bg-yellow-400 text-yellow-900' 
                          : 'bg-gray-200 text-gray-400 hover:bg-yellow-200'
                        }
                        ${(!isAllowed || disabled) ? 'opacity-30 cursor-not-allowed' : ''}
                      `}
                      title={isPreferred ? 'Retirer des prioritaires' : 'Marquer comme prioritaire'}
                    >
                      ⭐
                    </button>
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center
                      ${isAllowed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'}
                    `}>
                      {isAllowed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Résumé</h4>
        <div className="flex flex-wrap gap-2">
          {Array.from(localAllowed).map((typeId) => {
            const type = EXERCISE_TYPES[typeId];
            const isPreferred = localPreferred.has(typeId);
            return (
              <span
                key={typeId}
                className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm
                  ${isPreferred ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-700'}
                `}
              >
                {type.icon} {type.name}
                {isPreferred && <span>⭐</span>}
              </span>
            );
          })}
          {localAllowed.size === 0 && (
            <span className="text-gray-500 text-sm">Aucun type sélectionné</span>
          )}
        </div>
      </div>
    </div>
  );
}
