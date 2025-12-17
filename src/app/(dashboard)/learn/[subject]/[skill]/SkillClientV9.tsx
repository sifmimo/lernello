'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SkillLearningPage } from '@/components/learning-session';

export default function SkillClientV9() {
  const router = useRouter();
  const params = useParams();
  const subject = params.subject as string;
  const skillCode = params.skill as string;

  const [skillId, setSkillId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const profileId = localStorage.getItem('activeProfileId');
    if (!profileId) {
      router.push('/profiles');
      return;
    }

    loadSkillId();
  }, [router, skillCode, subject]);

  const loadSkillId = async () => {
    const supabase = createClient();

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id')
      .eq('code', subject)
      .single();

    if (!subjectData) {
      setError('Matière non trouvée');
      setLoading(false);
      return;
    }

    const { data: domainsData } = await supabase
      .from('domains')
      .select('id')
      .eq('subject_id', subjectData.id);

    const domainIds = domainsData?.map(d => d.id) || [];

    if (domainIds.length === 0) {
      setError('Aucun domaine trouvé');
      setLoading(false);
      return;
    }

    const { data: skillData } = await supabase
      .from('skills')
      .select('id')
      .eq('code', skillCode)
      .in('domain_id', domainIds)
      .single();

    if (!skillData) {
      setError('Compétence non trouvée');
      setLoading(false);
      return;
    }

    setSkillId(skillData.id);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/30 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !skillId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">{error || 'Compétence non trouvée'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <SkillLearningPage
      skillId={skillId}
      skillCode={skillCode}
      subjectCode={subject}
    />
  );
}
