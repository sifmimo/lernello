'use server';

import { createClient } from '@/lib/supabase/server';

export interface WorldConfig {
  worldLevel: number;
  unlockedZones: string[];
  placedDecorations: Array<{
    decorationCode: string;
    position: { x: number; y: number };
  }>;
  worldTheme: string;
}

export async function getWorld(studentId: string): Promise<WorldConfig> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('student_worlds')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (!data) {
    return {
      worldLevel: 1,
      unlockedZones: ['starter_island'],
      placedDecorations: [],
      worldTheme: 'island',
    };
  }

  return {
    worldLevel: data.world_level,
    unlockedZones: data.unlocked_zones || ['starter_island'],
    placedDecorations: data.placed_decorations || [],
    worldTheme: data.world_theme,
  };
}

export async function updateWorld(studentId: string, config: Partial<WorldConfig>) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('student_worlds')
    .select('id')
    .eq('student_id', studentId)
    .single();

  const updateData = {
    world_level: config.worldLevel,
    unlocked_zones: config.unlockedZones,
    placed_decorations: config.placedDecorations,
    world_theme: config.worldTheme,
    updated_at: new Date().toISOString(),
  };

  Object.keys(updateData).forEach(key => {
    if (updateData[key as keyof typeof updateData] === undefined) {
      delete updateData[key as keyof typeof updateData];
    }
  });

  if (existing) {
    await supabase
      .from('student_worlds')
      .update(updateData)
      .eq('student_id', studentId);
  } else {
    await supabase.from('student_worlds').insert({
      student_id: studentId,
      ...updateData,
    });
  }

  return { success: true };
}

export async function unlockZone(studentId: string, zoneCode: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('student_worlds')
    .select('unlocked_zones')
    .eq('student_id', studentId)
    .single();

  const currentZones = data?.unlocked_zones || ['starter_island'];
  
  if (!currentZones.includes(zoneCode)) {
    currentZones.push(zoneCode);
    
    await supabase
      .from('student_worlds')
      .upsert({
        student_id: studentId,
        unlocked_zones: currentZones,
        updated_at: new Date().toISOString(),
      });
  }

  return { success: true, unlockedZones: currentZones };
}

export async function placeDecoration(
  studentId: string,
  decorationCode: string,
  position: { x: number; y: number }
) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('student_worlds')
    .select('placed_decorations')
    .eq('student_id', studentId)
    .single();

  const decorations = data?.placed_decorations || [];
  
  // Remove existing placement of same decoration
  const filtered = decorations.filter(
    (d: { decorationCode: string }) => d.decorationCode !== decorationCode
  );
  
  filtered.push({ decorationCode, position });

  await supabase
    .from('student_worlds')
    .upsert({
      student_id: studentId,
      placed_decorations: filtered,
      updated_at: new Date().toISOString(),
    });

  return { success: true };
}
