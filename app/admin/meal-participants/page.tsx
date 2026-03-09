import { getMealParticipantsGroupedByParentEmail, type MealParticipantsByParentEmail } from '@/lib/services/meal-participant.service';
import { MealParticipantsTable } from "./meal-participants-table";
import { updateMealParticipantAction, deleteMealParticipantAction, } from "./actions";

export const dynamic = 'force-dynamic';

export default async function MealParticipantsPage() {
  let groups: MealParticipantsByParentEmail[] = [];
  let error: string | null = null;
  let errorDetail: string | null = null;

  try {
    groups = await getMealParticipantsGroupedByParentEmail();
  } catch (err) {
    console.error("Error fetching meal participants:", err);
    error = "Erreur lors du chargement des participants";
    errorDetail = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="space-y-6">
      <MealParticipantsTable
        groups={groups}
        updateMealParticipantAction={updateMealParticipantAction}
        deleteMealParticipantAction={deleteMealParticipantAction}
        error={error}
        errorDetail={errorDetail}
      />
    </div>
  );
}
