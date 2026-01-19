import { getAllMeals } from "@/lib/services/meal.service";
import type { Meal } from "@/lib/models/meal";
import { MealsTable } from "./meals-table";
import {
  createMealAction,
  updateMealAction,
  deleteMealAction,
} from "./actions";

export const dynamic = 'force-dynamic';

export default async function MealsPage() {
  let meals: Meal[] = [];
  let error: string | null = null;
  let errorDetail: string | null = null;

  try {
    meals = await getAllMeals();
  } catch (err) {
    console.error("Error fetching meals:", err);
    error = "Erreur lors du chargement des repas";
    errorDetail = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="space-y-6">
      <MealsTable
        meals={meals}
        createMealAction={createMealAction}
        updateMealAction={updateMealAction}
        deleteMealAction={deleteMealAction}
        error={error}
        errorDetail={errorDetail}
      />
    </div>
  );
}
