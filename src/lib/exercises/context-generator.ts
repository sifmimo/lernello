export interface ExerciseContext {
  template: string;
  variables: Record<string, string | number>;
  interests: string[];
  ageRange: [number, number];
}

export const MATH_CONTEXTS: Record<string, ExerciseContext[]> = {
  addition: [
    {
      template: "Tu as {a} billes et ton ami t'en donne {b}. Combien as-tu de billes maintenant ?",
      variables: { a: 0, b: 0 },
      interests: ['jeux', 'amis'],
      ageRange: [6, 8],
    },
    {
      template: "Dans ta collection de cartes Pokémon, tu as {a} cartes. Tu en reçois {b} pour ton anniversaire. Combien en as-tu au total ?",
      variables: { a: 0, b: 0 },
      interests: ['jeux vidéo', 'cartes', 'pokémon'],
      ageRange: [7, 10],
    },
    {
      template: "Tu marques {a} points au premier niveau et {b} points au deuxième niveau. Quel est ton score total ?",
      variables: { a: 0, b: 0 },
      interests: ['jeux vidéo', 'sport'],
      ageRange: [6, 12],
    },
    {
      template: "Il y a {a} élèves dans la classe et {b} arrivent en retard. Combien y a-t-il d'élèves maintenant ?",
      variables: { a: 0, b: 0 },
      interests: ['école'],
      ageRange: [6, 9],
    },
    {
      template: "Tu lis {a} pages le matin et {b} pages le soir. Combien de pages as-tu lues en tout ?",
      variables: { a: 0, b: 0 },
      interests: ['lecture', 'livres'],
      ageRange: [7, 11],
    },
  ],
  subtraction: [
    {
      template: "Tu as {a} bonbons et tu en manges {b}. Combien t'en reste-t-il ?",
      variables: { a: 0, b: 0 },
      interests: ['nourriture'],
      ageRange: [6, 8],
    },
    {
      template: "Tu avais {a} vies dans ton jeu et tu en perds {b}. Combien de vies te reste-t-il ?",
      variables: { a: 0, b: 0 },
      interests: ['jeux vidéo'],
      ageRange: [7, 11],
    },
    {
      template: "Sur les {a} questions du quiz, tu en as raté {b}. Combien as-tu de bonnes réponses ?",
      variables: { a: 0, b: 0 },
      interests: ['école', 'quiz'],
      ageRange: [8, 12],
    },
  ],
  multiplication: [
    {
      template: "Tu as {a} boîtes de {b} crayons chacune. Combien de crayons as-tu en tout ?",
      variables: { a: 0, b: 0 },
      interests: ['école', 'dessin'],
      ageRange: [7, 10],
    },
    {
      template: "{a} amis ont chacun {b} cartes. Combien de cartes ont-ils ensemble ?",
      variables: { a: 0, b: 0 },
      interests: ['amis', 'cartes'],
      ageRange: [7, 10],
    },
    {
      template: "Un bus a {a} rangées de {b} sièges. Combien de places y a-t-il dans le bus ?",
      variables: { a: 0, b: 0 },
      interests: ['transport', 'voyages'],
      ageRange: [8, 11],
    },
    {
      template: "Tu joues {a} parties par jour pendant {b} jours. Combien de parties as-tu jouées ?",
      variables: { a: 0, b: 0 },
      interests: ['jeux vidéo', 'sport'],
      ageRange: [8, 12],
    },
  ],
  division: [
    {
      template: "Tu as {a} gâteaux à partager entre {b} amis. Combien chacun en aura-t-il ?",
      variables: { a: 0, b: 0 },
      interests: ['nourriture', 'amis'],
      ageRange: [8, 11],
    },
    {
      template: "Tu dois ranger {a} livres sur {b} étagères. Combien de livres par étagère ?",
      variables: { a: 0, b: 0 },
      interests: ['lecture', 'organisation'],
      ageRange: [8, 11],
    },
  ],
  fractions: [
    {
      template: "Tu as mangé {a} parts sur les {b} parts de la pizza. Quelle fraction as-tu mangée ?",
      variables: { a: 0, b: 0 },
      interests: ['nourriture'],
      ageRange: [9, 12],
    },
    {
      template: "Tu as complété {a} niveaux sur les {b} niveaux du jeu. Quelle fraction as-tu terminée ?",
      variables: { a: 0, b: 0 },
      interests: ['jeux vidéo'],
      ageRange: [9, 12],
    },
  ],
};

export const FRENCH_CONTEXTS: Record<string, ExerciseContext[]> = {
  conjugaison: [
    {
      template: "Hier, je ___ (manger) une délicieuse pizza avec mes amis.",
      variables: {},
      interests: ['nourriture', 'amis'],
      ageRange: [7, 12],
    },
    {
      template: "Demain, nous ___ (aller) au parc d'attractions.",
      variables: {},
      interests: ['sorties', 'parc'],
      ageRange: [7, 12],
    },
    {
      template: "En ce moment, tu ___ (jouer) à ton jeu préféré.",
      variables: {},
      interests: ['jeux vidéo'],
      ageRange: [7, 12],
    },
  ],
  vocabulaire: [
    {
      template: "Trouve le synonyme du mot '{word}' dans cette phrase.",
      variables: { word: '' },
      interests: ['lecture'],
      ageRange: [8, 12],
    },
  ],
  grammaire: [
    {
      template: "Dans la phrase suivante, identifie le {element}: '{sentence}'",
      variables: { element: '', sentence: '' },
      interests: ['lecture'],
      ageRange: [8, 12],
    },
  ],
};

export interface GeneratedExercise {
  question: string;
  answer: string | number;
  alternatives?: string[];
  hint?: string;
  context: string;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function selectBestContext(
  contexts: ExerciseContext[],
  studentAge: number,
  studentInterests: string[]
): ExerciseContext {
  const validContexts = contexts.filter(
    ctx => studentAge >= ctx.ageRange[0] && studentAge <= ctx.ageRange[1]
  );

  if (validContexts.length === 0) {
    return contexts[0];
  }

  const scoredContexts = validContexts.map(ctx => {
    const interestScore = ctx.interests.filter(i => 
      studentInterests.some(si => si.toLowerCase().includes(i.toLowerCase()))
    ).length;
    return { context: ctx, score: interestScore };
  });

  scoredContexts.sort((a, b) => b.score - a.score);

  const topContexts = scoredContexts.filter(c => c.score === scoredContexts[0].score);
  return topContexts[getRandomInt(0, topContexts.length - 1)].context;
}

export function generateMathExercise(
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'fractions',
  difficulty: number,
  studentAge: number,
  studentInterests: string[] = []
): GeneratedExercise {
  const contexts = MATH_CONTEXTS[operation] || MATH_CONTEXTS.addition;
  const context = selectBestContext(contexts, studentAge, studentInterests);

  let a: number, b: number, answer: number;
  const maxValue = Math.min(10 + difficulty * 20, 100);

  switch (operation) {
    case 'addition':
      a = getRandomInt(1, maxValue);
      b = getRandomInt(1, maxValue);
      answer = a + b;
      break;
    case 'subtraction':
      a = getRandomInt(10, maxValue);
      b = getRandomInt(1, a);
      answer = a - b;
      break;
    case 'multiplication':
      a = getRandomInt(2, Math.min(difficulty + 3, 12));
      b = getRandomInt(2, Math.min(difficulty + 3, 12));
      answer = a * b;
      break;
    case 'division':
      b = getRandomInt(2, Math.min(difficulty + 3, 10));
      answer = getRandomInt(1, Math.min(difficulty + 5, 12));
      a = b * answer;
      break;
    case 'fractions':
      b = getRandomInt(2, 8);
      a = getRandomInt(1, b - 1);
      answer = a;
      break;
    default:
      a = getRandomInt(1, 10);
      b = getRandomInt(1, 10);
      answer = a + b;
  }

  const question = context.template
    .replace('{a}', String(a))
    .replace('{b}', String(b));

  const hints: Record<string, string> = {
    addition: `Additionne ${a} et ${b}. Tu peux compter sur tes doigts ou dessiner des points.`,
    subtraction: `Soustrais ${b} de ${a}. Imagine que tu enlèves ${b} objets.`,
    multiplication: `Multiplie ${a} par ${b}. C'est comme additionner ${a} fois le nombre ${b}.`,
    division: `Divise ${a} par ${b}. Combien de fois ${b} rentre dans ${a} ?`,
    fractions: `Une fraction représente une partie d'un tout. ${a}/${b} signifie ${a} parts sur ${b}.`,
  };

  return {
    question,
    answer: operation === 'fractions' ? `${a}/${b}` : answer,
    hint: hints[operation],
    context: context.template,
  };
}

export function generateFrenchExercise(
  type: 'conjugaison' | 'vocabulaire' | 'grammaire',
  studentAge: number,
  studentInterests: string[] = []
): GeneratedExercise {
  const contexts = FRENCH_CONTEXTS[type] || FRENCH_CONTEXTS.conjugaison;
  const context = selectBestContext(contexts, studentAge, studentInterests);

  return {
    question: context.template,
    answer: '',
    hint: 'Réfléchis au temps de la phrase et à la personne du verbe.',
    context: context.template,
  };
}

export function adaptExerciseToAge(
  exercise: GeneratedExercise,
  age: number
): GeneratedExercise {
  let adaptedQuestion = exercise.question;

  if (age <= 7) {
    adaptedQuestion = adaptedQuestion
      .replace(/\b(\d{3,})\b/g, (match) => {
        const num = parseInt(match);
        return num > 20 ? String(Math.min(num, 20)) : match;
      });
  }

  return {
    ...exercise,
    question: adaptedQuestion,
  };
}
