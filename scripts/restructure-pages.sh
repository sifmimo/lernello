#!/bin/bash

# Script pour restructurer les pages client en Server Component + Client Component

PAGES=(
  "src/app/(auth)/forgot-password/page.tsx:ForgotPasswordClient"
  "src/app/(dashboard)/achievements/page.tsx:AchievementsClient"
  "src/app/(dashboard)/admin/ai-settings/page.tsx:AdminAISettingsClient"
  "src/app/(dashboard)/admin/methods/page.tsx:MethodsClient"
  "src/app/(dashboard)/admin/programs/page.tsx:ProgramsClient"
  "src/app/(dashboard)/admin/stats/page.tsx:StatsClient"
  "src/app/(dashboard)/admin/subjects/page.tsx:SubjectsClient"
  "src/app/(dashboard)/admin/subjects/new/page.tsx:NewSubjectClient"
  "src/app/(dashboard)/admin/users/page.tsx:UsersClient"
  "src/app/(dashboard)/create/page.tsx:CreateClient"
  "src/app/(dashboard)/explore/page.tsx:ExploreClient"
  "src/app/(dashboard)/learn/page.tsx:LearnClient"
  "src/app/(dashboard)/parent/notifications/page.tsx:NotificationsClient"
  "src/app/(dashboard)/parent/page.tsx:ParentClient"
  "src/app/(dashboard)/parent/reports/page.tsx:ReportsClient"
  "src/app/(dashboard)/profiles/page.tsx:ProfilesClient"
  "src/app/(dashboard)/settings/page.tsx:SettingsClient"
  "src/app/(dashboard)/settings/preferences/page.tsx:PreferencesClient"
  "src/app/(dashboard)/settings/ai/usage/page.tsx:AIUsageClient"
  "src/app/(dashboard)/learn/[subject]/page.tsx:SubjectClient"
  "src/app/(dashboard)/learn/[subject]/[skill]/page.tsx:SkillClient"
  "src/app/(dashboard)/admin/subjects/[id]/page.tsx:SubjectDetailClient"
)

for entry in "${PAGES[@]}"; do
  IFS=':' read -r filepath clientname <<< "$entry"
  
  if [ -f "$filepath" ]; then
    dir=$(dirname "$filepath")
    clientfile="$dir/${clientname}.tsx"
    
    # Renommer le fichier existant
    mv "$filepath" "$clientfile"
    
    # Créer le nouveau page.tsx
    cat > "$filepath" << EOF
import ${clientname} from './${clientname}';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <${clientname} />;
}
EOF
    
    echo "Restructured: $filepath"
  fi
done

echo "Done!"
