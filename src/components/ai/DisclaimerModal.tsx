'use client';

import { useState } from 'react';
import { AlertTriangle, X, Shield, Key, Info } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function DisclaimerModal({ isOpen, onAccept, onDecline }: DisclaimerModalProps) {
  const [hasRead, setHasRead] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-yellow-100 p-2">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Avertissement - Clés API personnelles
            </h2>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-6 space-y-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Qu&apos;est-ce que BYOK ?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  BYOK (Bring Your Own Key) vous permet d&apos;utiliser vos propres clés API 
                  OpenAI ou Anthropic pour les fonctionnalités IA de Lernello.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900">Sécurité</h3>
                <ul className="text-sm text-green-700 mt-1 space-y-1">
                  <li>• Vos clés sont chiffrées avec AES-256-GCM</li>
                  <li>• Elles ne sont jamais stockées en clair</li>
                  <li>• Vous pouvez les supprimer à tout moment</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900">Responsabilités</h3>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• Vous êtes responsable des coûts liés à l&apos;utilisation de vos clés</li>
                  <li>• Surveillez votre consommation sur les dashboards des providers</li>
                  <li>• Définissez des limites de dépenses sur vos comptes API</li>
                  <li>• Ne partagez jamais vos clés avec d&apos;autres personnes</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              En utilisant cette fonctionnalité, vous acceptez que Lernello utilise vos clés API 
              uniquement pour générer du contenu éducatif pour vos enfants. Nous ne sommes pas 
              responsables des coûts encourus ou de toute utilisation abusive de vos clés.
            </p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasRead}
              onChange={(e) => setHasRead(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              J&apos;ai lu et compris les informations ci-dessus
            </span>
          </label>
        </div>

        <div className="border-t border-gray-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onDecline}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Annuler
          </button>
          <button
            onClick={onAccept}
            disabled={!hasRead}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            J&apos;accepte et je continue
          </button>
        </div>
      </div>
    </div>
  );
}
