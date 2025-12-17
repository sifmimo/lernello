import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/admin/check-admin';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subjectName, country, language, schoolLevel, method, aiModelId } = await request.json();

  if (!subjectName || !country || !language || !method) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const schoolLevelNames: Record<string, string> = {
    maternelle: 'Maternelle (3-5 ans)',
    cp: 'CP (6 ans)',
    ce1: 'CE1 (7 ans)',
    ce2: 'CE2 (8 ans)',
    cm1: 'CM1 (9 ans)',
    cm2: 'CM2 (10 ans)',
    primaire: 'Primaire (6-11 ans)',
  };

  const targetLevel = schoolLevelNames[schoolLevel] || schoolLevel || 'Primaire';

  const supabase = await createClient();

  // Récupérer la configuration du modèle IA
  const { data: aiModel } = await supabase
    .from('ai_model_config')
    .select('provider, model_name')
    .eq('id', aiModelId)
    .single();

  if (!aiModel) {
    return NextResponse.json({ error: 'AI model not found' }, { status: 400 });
  }

  // Récupérer les instructions de la méthode pédagogique
  const { data: methodData } = await supabase
    .from('pedagogical_methods')
    .select('prompt_instructions')
    .eq('code', method)
    .single();

  const countryNames: Record<string, string> = {
    FR: 'France',
    MA: 'Maroc',
    DZ: 'Algérie',
    TN: 'Tunisie',
    BE: 'Belgique',
    CH: 'Suisse',
    CA: 'Canada',
    SN: 'Sénégal',
  };

  const languageNames: Record<string, string> = {
    fr: 'français',
    ar: 'arabe',
    en: 'anglais',
  };

  // Générer la structure avec l'IA
  const prompt = `Tu es un expert en pédagogie et en programmes scolaires. Génère la structure complète pour la matière "${subjectName}" selon le programme officiel de ${countryNames[country] || country}.

NIVEAU SCOLAIRE CIBLE: ${targetLevel}
IMPORTANT: Le contenu DOIT être adapté au niveau ${targetLevel}. Les compétences, le vocabulaire et la complexité doivent correspondre à ce niveau scolaire.

Méthode pédagogique à appliquer: ${methodData?.prompt_instructions || 'Approche classique et structurée.'}

Tu dois générer en ${languageNames[language] || language}:
1. Un code unique pour la matière (snake_case, ex: mathematiques, francais, sciences)
2. Une icône emoji représentative
3. Les modules (domaines) adaptés au niveau ${targetLevel} avec leur ordre
4. Pour chaque module, les compétences adaptées au niveau ${targetLevel} avec leur ordre et difficulté (1-5)

IMPORTANT: Les noms des modules et compétences doivent être des noms lisibles en ${languageNames[language] || language}, PAS des clés techniques.

Réponds UNIQUEMENT avec un JSON valide dans ce format exact:
{
  "code": "string",
  "icon": "emoji",
  "name": "string",
  "description": "string",
  "modules": [
    {
      "code": "string",
      "name": "string",
      "description": "string",
      "sort_order": number,
      "skills": [
        {
          "code": "string",
          "name": "string",
          "difficulty_level": number,
          "sort_order": number
        }
      ]
    }
  ]
}`;

  try {
    let generatedContent: any;

    if (aiModel.provider === 'openai') {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const completion = await openai.chat.completions.create({
        model: aiModel.model_name,
        messages: [
          { role: 'system', content: 'Tu es un assistant expert en pédagogie. Réponds uniquement en JSON valide.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }
      generatedContent = JSON.parse(content);
    } else {
      // Fallback pour les autres providers - utiliser OpenAI par défaut
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Tu es un assistant expert en pédagogie. Réponds uniquement en JSON valide.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }
      generatedContent = JSON.parse(content);
    }

    // Créer la matière en base de données
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .insert({
        code: generatedContent.code,
        name_key: `subjects.${generatedContent.code}`,
        description_key: `subjects.${generatedContent.code}_desc`,
        icon: generatedContent.icon,
        sort_order: 1,
        is_official: true,
        status: 'draft',
        language: language,
        method_code: method,
        ai_model_id: aiModelId,
      })
      .select()
      .single();

    if (subjectError) {
      console.error('Error creating subject:', subjectError);
      return NextResponse.json({ error: subjectError.message }, { status: 500 });
    }

    // Créer les modules (domains)
    for (const domainModule of generatedContent.modules) {
      const { data: domain, error: domainError } = await supabase
        .from('domains')
        .insert({
          subject_id: subject.id,
          code: domainModule.code,
          name_key: `domains.${domainModule.code}`,
          description_key: `domains.${domainModule.code}_desc`,
          icon: '📚',
          sort_order: domainModule.sort_order,
          status: 'draft',
        })
        .select()
        .single();

      if (domainError) {
        console.error('Error creating domain:', domainError);
        continue;
      }

      // Créer les compétences (skills)
      for (const skill of domainModule.skills) {
        await supabase.from('skills').insert({
          domain_id: domain.id,
          code: skill.code,
          name_key: `skills.${skill.code}`,
          difficulty_level: skill.difficulty_level,
          sort_order: skill.sort_order,
          status: 'draft',
        });
      }
    }

    // Stocker les traductions générées
    const translations = {
      [`subjects.${generatedContent.code}`]: generatedContent.name,
      [`subjects.${generatedContent.code}_desc`]: generatedContent.description,
    };

    for (const domainModule of generatedContent.modules) {
      translations[`domains.${domainModule.code}`] = domainModule.name;
      translations[`domains.${domainModule.code}_desc`] = domainModule.description;
      for (const skill of domainModule.skills) {
        translations[`skills.${skill.code}`] = skill.name;
      }
    }

    // Sauvegarder les traductions dans une table dédiée ou dans les métadonnées
    await supabase.from('content_translations').upsert(
      Object.entries(translations).map(([key, value]) => ({
        key,
        language,
        value,
      })),
      { onConflict: 'key,language' }
    );

    return NextResponse.json({ 
      success: true, 
      subject: {
        id: subject.id,
        code: subject.code,
        name: generatedContent.name,
      },
      generatedContent 
    });
  } catch (error: any) {
    console.error('AI generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
