'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Lightbulb, CheckCircle, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';
import { getSkillContent, generateFullSkillContent, saveSkillContent, getPedagogicalMethods } from '@/server/actions/skill-content';
import type { FullSkillContent, PedagogicalMethod } from '@/types/v2';

interface SkillTheoryProps {
  skillId: string;
  skillName: string;
  skillDescription?: string;
  language?: string;
  onComplete?: () => void;
}

export default function SkillTheory({
  skillId,
  skillName,
  skillDescription,
  language = 'fr',
  onComplete,
}: SkillTheoryProps) {
  const [content, setContent] = useState<FullSkillContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    theory: true,
    examples: false,
    synthesis: false,
  });
  const [methods, setMethods] = useState<PedagogicalMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('standard');
  const [selfAssessmentAnswers, setSelfAssessmentAnswers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadContent();
    loadMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId]);

  const loadContent = async () => {
    setLoading(true);
    const data = await getSkillContent(skillId);
    setContent(data);
    setLoading(false);
  };

  const loadMethods = async () => {
    const data = await getPedagogicalMethods();
    setMethods(data);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await generateFullSkillContent(
      skillId,
      skillName,
      skillDescription || '',
      selectedMethod as 'standard' | 'montessori' | 'singapore' | 'gamified',
      language
    );

    if (result.success && result.data) {
      await saveSkillContent(
        skillId,
        result.data.content,
        result.data.examples,
        result.data.selfAssessments,
        selectedMethod as 'standard' | 'montessori' | 'singapore' | 'gamified',
        language,
        'ai'
      );
      await loadContent();
    }
    setGenerating(false);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSelfAssessment = (id: string, value: boolean) => {
    setSelfAssessmentAnswers(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  const allAssessmentsComplete = content?.selfAssessments.every(
    sa => selfAssessmentAnswers[sa.id] !== undefined
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!content?.content) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Contenu théorique non disponible
          </h3>
          <p className="text-gray-500 mb-6">
            Génère le contenu pédagogique complet pour cette compétence
          </p>

          <div className="max-w-xs mx-auto mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Méthode pédagogique
            </label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {methods.map(m => (
                <option key={m.code} value={m.code}>
                  {m.code === 'standard' ? 'Standard' :
                   m.code === 'montessori' ? 'Montessori' :
                   m.code === 'singapore' ? 'Singapour' :
                   m.code === 'gamified' ? 'Ludique' : m.code}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Générer le contenu
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Objectif */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Objectif</h3>
            <p className="text-gray-700">{content.content.objective}</p>
          </div>
        </div>
      </div>

      {/* Contexte */}
      {content.content.context && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <p className="text-gray-700 italic">{content.content.context}</p>
        </div>
      )}

      {/* Théorie */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => toggleSection('theory')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-900">Explication théorique</span>
          </div>
          {expandedSections.theory ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.theory && (
          <div className="px-4 pb-4 prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content.content.theory.replace(/\n/g, '<br/>') }} />
          </div>
        )}
      </div>

      {/* Exemples */}
      {content.examples.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('examples')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-gray-900">
                Exemples guidés ({content.examples.length})
              </span>
            </div>
            {expandedSections.examples ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.examples && (
            <div className="px-4 pb-4 space-y-4">
              {content.examples.map((example, idx) => (
                <div key={example.id} className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {idx + 1}. {example.title}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Problème :</span>
                      <p className="text-gray-700">{example.problem}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Solution :</span>
                      <p className="text-gray-700">{example.solution}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Explication :</span>
                      <p className="text-gray-700">{example.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Synthèse */}
      {content.content.synthesis && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('synthesis')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium text-gray-900">À retenir</span>
            </div>
            {expandedSections.synthesis ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.synthesis && (
            <div className="px-4 pb-4">
              <div className="bg-green-50 rounded-xl p-4 text-gray-700">
                {content.content.synthesis}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto-évaluation */}
      {content.selfAssessments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-purple-500" />
            Auto-évaluation
          </h3>
          <div className="space-y-3">
            {content.selfAssessments.map(sa => (
              <div key={sa.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-700 text-sm">{sa.question}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSelfAssessment(sa.id, true)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selfAssessmentAnswers[sa.id] === true
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    Oui
                  </button>
                  <button
                    onClick={() => handleSelfAssessment(sa.id, false)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selfAssessmentAnswers[sa.id] === false
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    Non
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton continuer */}
      {onComplete && (
        <button
          onClick={onComplete}
          disabled={content.selfAssessments.length > 0 && !allAssessmentsComplete}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Passer aux exercices
        </button>
      )}

      {/* Badge méthode */}
      <div className="text-center text-xs text-gray-400">
        Méthode : {content.content.pedagogical_method} • Source : {content.content.source}
      </div>
    </div>
  );
}
