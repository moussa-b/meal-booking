import { getAllWeeklyMenus } from "@/lib/services/weekly-menu.service";
import { getAllMeals } from "@/lib/services/meal.service";
import { getAllOrganizations } from "@/lib/services/organization.service";
import type { WeeklyMenu } from "@/lib/models/weekly-menu";
import type { Meal } from "@/lib/models/meal";
import type { Organization } from "@/lib/models/organization";
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
  let organizations: Organization[] = [];
  let error: string | null = null;
  let errorDetail: string | null = null;

  const resolvedSearchParams = (await searchParams) ?? {};

  const openCreateMenu =
    typeof resolvedSearchParams.openCreateMenu === "string"
      ? resolvedSearchParams.openCreateMenu === "1" ||
        resolvedSearchParams.openCreateMenu === "true"
      : false;

  try {
    [menus, meals, organizations] = await Promise.all([
      getAllWeeklyMenus(),
      getAllMeals(),
      getAllOrganizations(),
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
          organizations={organizations}
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
