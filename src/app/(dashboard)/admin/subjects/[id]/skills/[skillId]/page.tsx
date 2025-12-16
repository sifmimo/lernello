import SkillDetailClient from './SkillDetailClient';

export const dynamic = 'force-dynamic';

export default function Page({ 
  params 
}: { 
  params: Promise<{ id: string; skillId: string }> 
}) {
  return <SkillDetailClient params={params} />;
}
