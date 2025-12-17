'use server';

import { createClient } from '@/lib/supabase/server';

export interface AvatarConfig {
  avatarStyle: string;
  skinColor: string;
  hairStyle: string;
  hairColor: string;
  outfit: string;
  accessories: string[];
}

export async function getAvatar(studentId: string): Promise<AvatarConfig | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('student_avatars')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (!data) {
    return {
      avatarStyle: 'explorer',
      skinColor: 'default',
      hairStyle: 'default',
      hairColor: 'brown',
      outfit: 'default',
      accessories: [],
    };
  }

  return {
    avatarStyle: data.avatar_style,
    skinColor: data.skin_color,
    hairStyle: data.hair_style,
    hairColor: data.hair_color,
    outfit: data.outfit,
    accessories: data.accessories || [],
  };
}

export async function updateAvatar(studentId: string, config: Partial<AvatarConfig>) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('student_avatars')
    .select('id')
    .eq('student_id', studentId)
    .single();

  const updateData = {
    avatar_style: config.avatarStyle,
    skin_color: config.skinColor,
    hair_style: config.hairStyle,
    hair_color: config.hairColor,
    outfit: config.outfit,
    accessories: config.accessories,
    updated_at: new Date().toISOString(),
  };

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key as keyof typeof updateData] === undefined) {
      delete updateData[key as keyof typeof updateData];
    }
  });

  if (existing) {
    await supabase
      .from('student_avatars')
      .update(updateData)
      .eq('student_id', studentId);
  } else {
    await supabase.from('student_avatars').insert({
      student_id: studentId,
      ...updateData,
    });
  }

  return { success: true };
}

export async function getUnlockedDecorations(studentId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('student_decorations')
    .select('*')
    .eq('student_id', studentId);

  return data || [];
}

export async function unlockDecoration(
  studentId: string, 
  decorationType: string, 
  decorationCode: string
) {
  const supabase = await createClient();

  const { error } = await supabase.from('student_decorations').insert({
    student_id: studentId,
    decoration_type: decorationType,
    decoration_code: decorationCode,
  });

  if (error && error.code !== '23505') { // Ignore duplicate
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function equipDecoration(studentId: string, decorationCode: string) {
  const supabase = await createClient();

  // Unequip all of same type first
  const { data: decoration } = await supabase
    .from('student_decorations')
    .select('decoration_type')
    .eq('student_id', studentId)
    .eq('decoration_code', decorationCode)
    .single();

  if (decoration) {
    await supabase
      .from('student_decorations')
      .update({ is_equipped: false })
      .eq('student_id', studentId)
      .eq('decoration_type', decoration.decoration_type);
  }

  // Equip the selected one
  await supabase
    .from('student_decorations')
    .update({ is_equipped: true })
    .eq('student_id', studentId)
    .eq('decoration_code', decorationCode);

  return { success: true };
}
