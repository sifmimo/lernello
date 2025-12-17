'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EvaluationResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  suggestions?: string[];
  keyPointsFound?: string[];
  keyPointsMissing?: string[];
  grammarErrors?: string[];
  spellingErrors?: string[];
}

interface EvaluateAnswerParams {
  question: string;
  expectedAnswer?: string;
  expectedKeywords?: string[];
  studentAnswer: string;
  exerciseType: 'short_answer' | 'long_answer' | 'dictation' | 'explanation';
  language?: string;
  studentAge?: number;
  strictness?: 'lenient' | 'moderate' | 'strict';
}

export async function evaluateOpenAnswer({
  question,
  expectedAnswer,
  expectedKeywords,
  studentAnswer,
  exerciseType,
  language = 'fr',
  studentAge = 10,
  strictness = 'moderate',
}: EvaluateAnswerParams): Promise<EvaluationResult> {
  try {
    const strictnessInstructions = {
      lenient: 'Sois indulgent et valorise les efforts. Accepte les réponses partiellement correctes.',
      moderate: 'Évalue de manière équilibrée. La réponse doit contenir les éléments essentiels.',
      strict: 'Évalue rigoureusement. La réponse doit être précise et complète.',
    };

    const prompt = `Tu es un correcteur pédagogique bienveillant pour un enfant de ${studentAge} ans.

QUESTION POSÉE:
${question}

${expectedAnswer ? `RÉPONSE ATTENDUE:
${expectedAnswer}` : ''}

${expectedKeywords?.length ? `MOTS-CLÉS ATTENDUS:
${expectedKeywords.join(', ')}` : ''}

RÉPONSE DE L'ÉLÈVE:
${studentAnswer}

TYPE D'EXERCICE: ${exerciseType}
NIVEAU D'EXIGENCE: ${strictnessInstructions[strictness]}

Évalue cette réponse et retourne un JSON avec:
{
  "isCorrect": boolean (true si la réponse est acceptable),
  "score": number (0 à 100),
  "feedback": string (feedback encourageant adapté à l'âge, 1-2 phrases),
  "keyPointsFound": string[] (éléments corrects trouvés),
  "keyPointsMissing": string[] (éléments importants manquants),
  "suggestions": string[] (conseils pour s'améliorer, optionnel)
  ${exerciseType === 'dictation' ? ', "spellingErrors": string[], "grammarErrors": string[]' : ''}
}

Sois encourageant même en cas d'erreur. Utilise un langage simple adapté à l'enfant.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: `Tu es un assistant pédagogique expert en évaluation des réponses d'élèves. Tu réponds uniquement en JSON valide en ${language === 'fr' ? 'français' : language}.` 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(responseText) as EvaluationResult;

    return {
      isCorrect: result.isCorrect ?? false,
      score: result.score ?? 0,
      feedback: result.feedback ?? 'Erreur lors de l\'évaluation',
      suggestions: result.suggestions,
      keyPointsFound: result.keyPointsFound,
      keyPointsMissing: result.keyPointsMissing,
      grammarErrors: result.grammarErrors,
      spellingErrors: result.spellingErrors,
    };
  } catch (error) {
    console.error('AI Evaluation error:', error);
    return {
      isCorrect: false,
      score: 0,
      feedback: 'Une erreur s\'est produite lors de l\'évaluation.',
    };
  }
}

interface EvaluateDictationParams {
  originalText: string;
  studentText: string;
  language?: string;
  studentAge?: number;
}

export async function evaluateDictation({
  originalText,
  studentText,
  language = 'fr',
  studentAge = 10,
}: EvaluateDictationParams): Promise<EvaluationResult> {
  try {
    const prompt = `Tu es un correcteur de dictée bienveillant pour un enfant de ${studentAge} ans.

TEXTE ORIGINAL:
${originalText}

TEXTE ÉCRIT PAR L'ÉLÈVE:
${studentText}

Analyse la dictée et retourne un JSON avec:
{
  "isCorrect": boolean (true si moins de 3 erreurs),
  "score": number (0 à 100, basé sur le pourcentage de mots corrects),
  "feedback": string (feedback encourageant, 1-2 phrases),
  "spellingErrors": [{"word": "mot erroné", "correction": "mot correct"}],
  "grammarErrors": [{"error": "erreur", "correction": "correction"}],
  "suggestions": string[] (conseils pour s'améliorer)
}

Compte les mots corrects vs incorrects. Sois encourageant.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: `Tu es un correcteur de dictée expert. Tu réponds uniquement en JSON valide en ${language === 'fr' ? 'français' : language}.` 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(responseText);

    return {
      isCorrect: result.isCorrect ?? false,
      score: result.score ?? 0,
      feedback: result.feedback ?? 'Erreur lors de l\'évaluation',
      spellingErrors: result.spellingErrors?.map((e: { word: string }) => e.word) || [],
      grammarErrors: result.grammarErrors?.map((e: { error: string }) => e.error) || [],
      suggestions: result.suggestions,
    };
  } catch (error) {
    console.error('Dictation evaluation error:', error);
    return {
      isCorrect: false,
      score: 0,
      feedback: 'Une erreur s\'est produite lors de l\'évaluation.',
    };
  }
}

interface GenerateFeedbackParams {
  exerciseType: string;
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer?: string;
  attemptNumber: number;
  streakCount: number;
  studentAge?: number;
}

export async function generatePersonalizedFeedback({
  exerciseType,
  isCorrect,
  studentAnswer,
  correctAnswer,
  attemptNumber,
  streakCount,
  studentAge = 10,
}: GenerateFeedbackParams): Promise<string> {
  try {
    const context = isCorrect
      ? streakCount >= 3
        ? 'L\'élève a une série de bonnes réponses. Célèbre cette réussite !'
        : 'L\'élève a bien répondu. Encourage-le.'
      : attemptNumber > 1
        ? 'C\'est une nouvelle tentative après un échec. Sois très encourageant.'
        : 'L\'élève s\'est trompé. Encourage-le sans donner la réponse.';

    const prompt = `Génère un feedback court (1 phrase max) pour un enfant de ${studentAge} ans.
    
Contexte: ${context}
Type d'exercice: ${exerciseType}
Réponse correcte: ${isCorrect ? 'Oui' : 'Non'}
${!isCorrect && correctAnswer ? `La bonne réponse était: ${correctAnswer}` : ''}
Série en cours: ${streakCount} bonnes réponses consécutives

Le feedback doit être:
- Court et percutant
- Adapté à l'âge
- Encourageant
- Avec un emoji approprié

Retourne uniquement le texte du feedback, rien d'autre.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu génères des feedbacks pédagogiques courts et encourageants.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 100,
    });

    return completion.choices[0]?.message?.content || (isCorrect ? 'Bravo ! 🎉' : 'Continue, tu vas y arriver ! 💪');
  } catch (error) {
    console.error('Feedback generation error:', error);
    return isCorrect ? 'Bravo ! 🎉' : 'Continue, tu vas y arriver ! 💪';
  }
}
