import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/admin/check-admin';

export async function POST(request: NextRequest) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { countryCode, countryName, countryFlag } = await request.json();

  if (!countryCode || !countryName || !countryFlag) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = await createClient();

  // Créer le programme du pays
  const { data: program, error: programError } = await supabase
    .from('country_programs')
    .insert({
      country_code: countryCode,
      country_name: countryName,
      country_flag: countryFlag,
    })
    .select()
    .single();

  if (programError) {
    return NextResponse.json({ error: programError.message }, { status: 500 });
  }

  // Pour l'instant, créer les matières de base (sera remplacé par génération IA)
  const defaultSubjects = [
    { code: 'math', name_key: 'subjects.math', description_key: 'subjects.math_desc', icon: 'calculator', sort_order: 1 },
    { code: 'french', name_key: 'subjects.french', description_key: 'subjects.french_desc', icon: 'book', sort_order: 2 },
    { code: 'science', name_key: 'subjects.science', description_key: 'subjects.science_desc', icon: 'flask', sort_order: 3 },
    { code: 'history', name_key: 'subjects.history', description_key: 'subjects.history_desc', icon: 'landmark', sort_order: 4 },
    { code: 'geography', name_key: 'subjects.geography', description_key: 'subjects.geography_desc', icon: 'globe', sort_order: 5 },
  ];

  for (const subject of defaultSubjects) {
    await supabase.from('subjects').insert({
      ...subject,
      country_program_id: program.id,
      is_official: true,
    });
  }

  return NextResponse.json({ success: true, program });
}
