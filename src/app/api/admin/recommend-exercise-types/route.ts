import { NextRequest, NextResponse } from 'next/server';
import { checkIsAdmin } from '@/lib/admin/check-admin';
import { 
  recommendAndApplyForSkill, 
  recommendAndApplyForSubject, 
  recommendAndApplyForDomain 
} from '@/lib/ai/exercise-types-recommender';

export async function POST(request: NextRequest) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { skillId, domainId, subjectId, language = 'fr' } = await request.json();

  if (!skillId && !domainId && !subjectId) {
    return NextResponse.json({ 
      error: 'Missing required field: skillId, domainId, or subjectId' 
    }, { status: 400 });
  }

  try {
    if (skillId) {
      console.log('[recommend-exercise-types] Processing single skill:', skillId);
      const result = await recommendAndApplyForSkill(skillId, language);
      
      if (!result) {
        return NextResponse.json({ 
          error: 'Failed to recommend exercise types for skill' 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        type: 'skill',
        skillId,
        recommendation: result,
      });
    }

    if (domainId) {
      console.log('[recommend-exercise-types] Processing domain:', domainId);
      const result = await recommendAndApplyForDomain(domainId, language);

      return NextResponse.json({
        success: true,
        type: 'domain',
        domainId,
        result,
      });
    }

    if (subjectId) {
      console.log('[recommend-exercise-types] Processing subject:', subjectId);
      const result = await recommendAndApplyForSubject(subjectId, language);

      return NextResponse.json({
        success: true,
        type: 'subject',
        subjectId,
        result,
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('[recommend-exercise-types] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
