import { getAllWeeklyMenus } from "@/lib/services/weekly-menu.service";
import { getAllMeals } from "@/lib/services/meal.service";
import { getAllSchools } from "@/lib/services/school.service";
import type { WeeklyMenu } from "@/lib/models/weekly-menu";
import type { Meal } from "@/lib/models/meal";
import type { School } from "@/lib/models/school";
import { MenusTable } from "./menus-table";
import { AdminMenusUrlCleaner } from "./url-cleaner";
import {
  createWeeklyMenuAction,
  updateWeeklyMenuAction,
  deleteWeeklyMenuAction,
} from "./actions";

export const dynamic = 'force-dynamic';

interface MenusPageProps {
  searchParams?:
    | { [key: string]: string | string[] | undefined }
    | Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MenusPage({ searchParams }: MenusPageProps) {
  let menus: WeeklyMenu[] = [];
  let meals: Meal[] = [];
  let schools: School[] = [];
  let error: string | null = null;
  let errorDetail: string | null = null;

  const resolvedSearchParams = (await searchParams) ?? {};

  const openCreateMenu =
    typeof resolvedSearchParams.openCreateMenu === "string"
      ? resolvedSearchParams.openCreateMenu === "1" ||
        resolvedSearchParams.openCreateMenu === "true"
      : false;

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
    <>
      <AdminMenusUrlCleaner param="openCreateMenu" />
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
          openCreateOnMount={openCreateMenu}
        />
      </div>
    </>
  );
}
