import SubjectDetailClient from './SubjectDetailClient';

export const dynamic = 'force-dynamic';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <SubjectDetailClient params={params} />;
}
