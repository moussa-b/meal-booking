import { getAllWeeklyMenus } from "@/lib/services/weekly-menu.service";
import { getAllMeals } from "@/lib/services/meal.service";
import { getAllSchools } from "@/lib/services/school.service";
import type { WeeklyMenu } from "@/lib/models/weekly-menu";
import type { Meal } from "@/lib/models/meal";
import type { School } from "@/lib/models/school";
import { MenusTable } from "./menus-table";
import {
  createWeeklyMenuAction,
  updateWeeklyMenuAction,
  deleteWeeklyMenuAction,
} from "./actions";

export const dynamic = 'force-dynamic';

export default async function MenusPage() {
  let menus: WeeklyMenu[] = [];
  let meals: Meal[] = [];
  let schools: School[] = [];
  let error: string | null = null;
  let errorDetail: string | null = null;

  try {
    [menus, meals, schools] = await Promise.all([
      getAllWeeklyMenus(),
      getAllMeals(),
      getAllSchools(),
    ]);
  } catch (err) {
    console.error("Error fetching data:", err);
    error = "Erreur lors du chargement des données";
    errorDetail = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="space-y-6">
      <MenusTable
        menus={menus}
        meals={meals}
        schools={schools}
        createWeeklyMenuAction={createWeeklyMenuAction}
        updateWeeklyMenuAction={updateWeeklyMenuAction}
        deleteWeeklyMenuAction={deleteWeeklyMenuAction}
        error={error}
        errorDetail={errorDetail}
      />
    </div>
  );
}
