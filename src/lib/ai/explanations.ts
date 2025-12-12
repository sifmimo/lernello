'use server';

import { createAICompletion, AIProvider, AIModel } from './providers';

interface ExplanationOptions {
  skillName: string;
  question: string;
  correctAnswer: string;
  studentAnswer?: string;
  studentAge: number;
  language?: string;
  pedagogyStyle?: 'encouraging' | 'detailed' | 'simple';
}

export async function generateExplanation(
  provider: AIProvider,
  apiKey: string,
  options: ExplanationOptions,
  model?: AIModel
): Promise<string> {
  const { skillName, question, correctAnswer, studentAnswer, studentAge, language = 'fr', pedagogyStyle = 'encouraging' } = options;

  const styleInstructions = {
    encouraging: "Sois très encourageant et positif. Félicite l'effort même si la réponse est fausse.",
    detailed: "Donne une explication détaillée et complète avec des exemples.",
    simple: "Utilise des mots simples et des phrases courtes. Va droit au but."
  };

  const systemPrompt = `Tu es un tuteur bienveillant pour enfants de ${studentAge} ans.
${styleInstructions[pedagogyStyle]}
Langue: ${language === 'fr' ? 'Français' : language === 'ar' ? 'Arabe' : 'Anglais'}
Adapte ton vocabulaire et tes exemples à l'âge de l'enfant.`;

  const userPrompt = studentAnswer 
    ? `L'enfant a répondu "${studentAnswer}" à la question "${question}" sur "${skillName}".
La bonne réponse était "${correctAnswer}".
Explique-lui pourquoi sa réponse n'est pas correcte et aide-le à comprendre.`
    : `Explique simplement le concept "${skillName}" à l'enfant.
Question: ${question}
Réponse: ${correctAnswer}`;

  try {
    const result = await createAICompletion(provider, apiKey, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model,
      temperature: 0.7,
      maxTokens: 512,
    });

    return result.content;
  } catch (error) {
    console.error('Error generating explanation:', error);
    return "Je n'ai pas pu générer d'explication. Réessaie plus tard !";
  }
}

export async function generateProgressiveHint(
  provider: AIProvider,
  apiKey: string,
  question: string,
  correctAnswer: string,
  hintLevel: number,
  studentAge: number,
  language: string = 'fr',
  model?: AIModel
): Promise<string> {
  const hintInstructions = {
    1: "Donne un indice très vague qui oriente vers la bonne direction sans révéler la réponse.",
    2: "Donne un indice plus précis qui aide à comprendre la méthode.",
    3: "Donne un indice qui révèle presque la réponse mais laisse l'enfant faire le dernier pas."
  };

  const systemPrompt = `Tu es un tuteur pour enfants de ${studentAge} ans.
Langue: ${language === 'fr' ? 'Français' : language === 'ar' ? 'Arabe' : 'Anglais'}
${hintInstructions[hintLevel as 1 | 2 | 3] || hintInstructions[1]}`;

  const userPrompt = `Question: ${question}
Réponse correcte (NE PAS RÉVÉLER): ${correctAnswer}
Génère un indice de niveau ${hintLevel}/3.`;

  try {
    const result = await createAICompletion(provider, apiKey, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model,
      temperature: 0.6,
      maxTokens: 150,
    });

    return result.content;
  } catch (error) {
    console.error('Error generating hint:', error);
    return "Réfléchis bien à la question...";
  }
}

export async function generateEncouragementMessage(
  provider: AIProvider,
  apiKey: string,
  context: 'correct' | 'incorrect' | 'streak' | 'milestone' | 'struggle',
  studentAge: number,
  streakCount?: number,
  language: string = 'fr',
  model?: AIModel
): Promise<string> {
  const contextPrompts = {
    correct: "L'enfant vient de répondre correctement. Félicite-le brièvement !",
    incorrect: "L'enfant s'est trompé. Encourage-le à continuer sans le décourager.",
    streak: `L'enfant a une série de ${streakCount} bonnes réponses ! Célèbre cet exploit !`,
    milestone: "L'enfant vient d'atteindre un jalon important. Félicite-le chaleureusement !",
    struggle: "L'enfant a du mal avec cet exercice. Rassure-le et motive-le."
  };

  const systemPrompt = `Tu génères des messages d'encouragement courts (1-2 phrases max) pour enfants de ${studentAge} ans.
Langue: ${language === 'fr' ? 'Français' : language === 'ar' ? 'Arabe' : 'Anglais'}
Sois chaleureux, positif et adapté à l'âge.`;

  try {
    const result = await createAICompletion(provider, apiKey, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextPrompts[context] }
      ],
      model,
      temperature: 0.9,
      maxTokens: 100,
    });

    return result.content;
  } catch {
    const fallbacks = {
      correct: ['Bravo ! 🎉', 'Super ! 👏', 'Excellent ! ⭐'],
      incorrect: ['Continue, tu vas y arriver ! 💪', 'Pas grave, réessaie ! 🌟'],
      streak: ['Quelle série ! 🔥', 'Tu es en feu ! 🚀'],
      milestone: ['Félicitations ! 🏆', 'Quel progrès ! 🌈'],
      struggle: ['Tu peux le faire ! 💪', 'Prends ton temps 🌟']
    };
    const messages = fallbacks[context];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}
