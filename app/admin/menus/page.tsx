import { getAllWeeklyMenus } from "@/lib/services/weekly-menu.service";
import { getAllMeals } from "@/lib/services/meal.service";
import type { WeeklyMenu } from "@/lib/models/weekly-menu";
import type { Meal } from "@/lib/models/meal";
import { MenusTable } from "./menus-table";
import {
  createWeeklyMenuAction,
  updateWeeklyMenuAction,
  deleteWeeklyMenuAction,
} from "./actions";

export default async function MenusPage() {
  let menus: WeeklyMenu[] = [];
  let meals: Meal[] = [];
  let error: string | null = null;

  try {
    [menus, meals] = await Promise.all([
      getAllWeeklyMenus(),
      getAllMeals(),
    ]);
  } catch (err) {
    console.error("Error fetching data:", err);
    error = "Erreur lors du chargement des données";
  }

  return (
    <div className="space-y-6">
      <MenusTable
        menus={menus}
        meals={meals}
        createWeeklyMenuAction={createWeeklyMenuAction}
        updateWeeklyMenuAction={updateWeeklyMenuAction}
        deleteWeeklyMenuAction={deleteWeeklyMenuAction}
        error={error}
      />
    </div>
  );
}
