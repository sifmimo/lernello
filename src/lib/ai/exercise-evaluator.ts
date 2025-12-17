'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EvaluationCriteria {
  accuracy: number;
  completeness: number;
  reasoning_quality?: number;
  language_quality?: number;
}

export interface EvaluationResult {
  is_correct: boolean;
  score: number;
  criteria: EvaluationCriteria;
  feedback: string;
  suggestions?: string[];
  correct_answer?: string;
}

export interface DictationEvaluationInput {
  expected_text: string;
  student_text: string;
  focus_rules?: string[];
  language?: string;
}

export interface OpenAnswerEvaluationInput {
  question: string;
  expected_answer?: string;
  student_answer: string;
  rubric?: string;
  subject?: string;
  skill_name?: string;
}

export interface SourceAnalysisEvaluationInput {
  source_description: string;
  questions: { question: string; expected_points: string[] }[];
  student_answers: string[];
  subject?: string;
}

export async function evaluateDictation(input: DictationEvaluationInput): Promise<EvaluationResult> {
  const { expected_text, student_text, focus_rules = [], language = 'fr' } = input;

  const prompt = `Tu es un correcteur de dictée pour enfants. Évalue cette dictée.

TEXTE ATTENDU:
"${expected_text}"

TEXTE DE L'ÉLÈVE:
"${student_text}"

RÈGLES CIBLÉES: ${focus_rules.join(', ') || 'orthographe générale'}
LANGUE: ${language}

Analyse les erreurs et donne un feedback constructif et encourageant.

Réponds en JSON:
{
  "is_correct": boolean (true si score >= 80%),
  "score": number (0-100),
  "criteria": {
    "accuracy": number (0-100, orthographe),
    "completeness": number (0-100, mots manquants),
    "language_quality": number (0-100, ponctuation/accents)
  },
  "errors": [
    {"word": "mot erroné", "expected": "mot correct", "type": "orthographe|accent|ponctuation|manquant"}
  ],
  "feedback": "Message encourageant pour l'enfant",
  "suggestions": ["Conseil 1", "Conseil 2"]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu es un correcteur bienveillant pour enfants. Réponds uniquement en JSON valide.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return {
      is_correct: response.is_correct ?? false,
      score: response.score ?? 0,
      criteria: {
        accuracy: response.criteria?.accuracy ?? 0,
        completeness: response.criteria?.completeness ?? 0,
        language_quality: response.criteria?.language_quality ?? 0,
      },
      feedback: response.feedback || 'Continue tes efforts !',
      suggestions: response.suggestions || [],
      correct_answer: expected_text,
    };
  } catch (error) {
    console.error('Dictation evaluation error:', error);
    return {
      is_correct: false,
      score: 0,
      criteria: { accuracy: 0, completeness: 0 },
      feedback: 'Erreur lors de l\'évaluation. Réessaie !',
    };
  }
}

export async function evaluateOpenAnswer(input: OpenAnswerEvaluationInput): Promise<EvaluationResult> {
  const { question, expected_answer, student_answer, rubric, subject, skill_name } = input;

  const prompt = `Tu es un enseignant bienveillant. Évalue cette réponse ouverte d'un enfant.

QUESTION: ${question}
${expected_answer ? `RÉPONSE ATTENDUE: ${expected_answer}` : ''}
${rubric ? `CRITÈRES D'ÉVALUATION: ${rubric}` : ''}
MATIÈRE: ${subject || 'général'}
COMPÉTENCE: ${skill_name || 'non spécifiée'}

RÉPONSE DE L'ÉLÈVE:
"${student_answer}"

Évalue la réponse avec bienveillance. Donne un feedback constructif.

Réponds en JSON:
{
  "is_correct": boolean (true si la réponse est globalement correcte),
  "score": number (0-100),
  "criteria": {
    "accuracy": number (0-100, exactitude du contenu),
    "completeness": number (0-100, exhaustivité),
    "reasoning_quality": number (0-100, qualité du raisonnement)
  },
  "feedback": "Message encourageant et constructif pour l'enfant",
  "suggestions": ["Conseil pour améliorer"],
  "correct_answer": "Réponse modèle si nécessaire"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu es un enseignant bienveillant. Réponds uniquement en JSON valide.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return {
      is_correct: response.is_correct ?? false,
      score: response.score ?? 0,
      criteria: {
        accuracy: response.criteria?.accuracy ?? 0,
        completeness: response.criteria?.completeness ?? 0,
        reasoning_quality: response.criteria?.reasoning_quality ?? 0,
      },
      feedback: response.feedback || 'Continue tes efforts !',
      suggestions: response.suggestions || [],
      correct_answer: response.correct_answer,
    };
  } catch (error) {
    console.error('Open answer evaluation error:', error);
    return {
      is_correct: false,
      score: 0,
      criteria: { accuracy: 0, completeness: 0 },
      feedback: 'Erreur lors de l\'évaluation. Réessaie !',
    };
  }
}

export async function evaluateSourceAnalysis(input: SourceAnalysisEvaluationInput): Promise<EvaluationResult> {
  const { source_description, questions, student_answers, subject = 'histoire' } = input;

  const questionsWithAnswers = questions.map((q, i) => ({
    question: q.question,
    expected_points: q.expected_points,
    student_answer: student_answers[i] || '',
  }));

  const prompt = `Tu es un enseignant d'${subject}. Évalue cette analyse de document.

SOURCE: ${source_description}

QUESTIONS ET RÉPONSES:
${questionsWithAnswers.map((qa, i) => `
Q${i + 1}: ${qa.question}
Points attendus: ${qa.expected_points.join(', ')}
Réponse élève: "${qa.student_answer}"
`).join('\n')}

Évalue chaque réponse et donne un feedback global constructif.

Réponds en JSON:
{
  "is_correct": boolean (true si score global >= 60%),
  "score": number (0-100, score global),
  "criteria": {
    "accuracy": number (0-100, identification correcte),
    "completeness": number (0-100, exhaustivité),
    "reasoning_quality": number (0-100, esprit critique)
  },
  "question_scores": [
    {"question_index": 0, "score": number, "feedback": "..."}
  ],
  "feedback": "Message encourageant global",
  "suggestions": ["Conseil pour améliorer l'analyse de documents"]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu es un enseignant bienveillant. Réponds uniquement en JSON valide.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return {
      is_correct: response.is_correct ?? false,
      score: response.score ?? 0,
      criteria: {
        accuracy: response.criteria?.accuracy ?? 0,
        completeness: response.criteria?.completeness ?? 0,
        reasoning_quality: response.criteria?.reasoning_quality ?? 0,
      },
      feedback: response.feedback || 'Continue tes efforts !',
      suggestions: response.suggestions || [],
    };
  } catch (error) {
    console.error('Source analysis evaluation error:', error);
    return {
      is_correct: false,
      score: 0,
      criteria: { accuracy: 0, completeness: 0 },
      feedback: 'Erreur lors de l\'évaluation. Réessaie !',
    };
  }
}

export async function evaluateExperimentConclusion(
  hypothesis: string,
  observations: string[],
  student_conclusion: string,
  expected_conclusion?: string
): Promise<EvaluationResult> {
  const prompt = `Tu es un enseignant de sciences. Évalue cette conclusion d'expérience.

HYPOTHÈSE DE DÉPART: ${hypothesis}
OBSERVATIONS FAITES: ${observations.join(', ')}
${expected_conclusion ? `CONCLUSION ATTENDUE: ${expected_conclusion}` : ''}

CONCLUSION DE L'ÉLÈVE:
"${student_conclusion}"

Évalue si la conclusion est logique par rapport aux observations.

Réponds en JSON:
{
  "is_correct": boolean,
  "score": number (0-100),
  "criteria": {
    "accuracy": number (0-100, exactitude scientifique),
    "completeness": number (0-100, exhaustivité),
    "reasoning_quality": number (0-100, logique du raisonnement)
  },
  "feedback": "Message encourageant",
  "suggestions": ["Conseil pour améliorer le raisonnement scientifique"],
  "correct_answer": "Conclusion modèle si nécessaire"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu es un enseignant de sciences bienveillant. Réponds uniquement en JSON valide.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return {
      is_correct: response.is_correct ?? false,
      score: response.score ?? 0,
      criteria: {
        accuracy: response.criteria?.accuracy ?? 0,
        completeness: response.criteria?.completeness ?? 0,
        reasoning_quality: response.criteria?.reasoning_quality ?? 0,
      },
      feedback: response.feedback || 'Continue tes efforts !',
      suggestions: response.suggestions || [],
      correct_answer: response.correct_answer,
    };
  } catch (error) {
    console.error('Experiment conclusion evaluation error:', error);
    return {
      is_correct: false,
      score: 0,
      criteria: { accuracy: 0, completeness: 0 },
      feedback: 'Erreur lors de l\'évaluation. Réessaie !',
    };
  }
}
