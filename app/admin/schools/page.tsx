import { getAllSchools } from "@/lib/services/school.service";
import type { School } from "@/lib/models/school";
import { SchoolsTable } from "./schools-table";
import {
  createSchoolAction,
  updateSchoolAction,
  deleteSchoolAction,
} from "./actions";

export default async function SchoolsPage() {
  let schools: School[] = [];
  let error: string | null = null;
  let errorDetail: string | null = null;

  try {
    schools = await getAllSchools();
  } catch (err) {
    console.error("Error fetching schools:", err);
    error = "Erreur lors du chargement des établissements";
    errorDetail = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="space-y-6">
      <SchoolsTable
        schools={schools}
        createSchoolAction={createSchoolAction}
        updateSchoolAction={updateSchoolAction}
        deleteSchoolAction={deleteSchoolAction}
        error={error}
        errorDetail={errorDetail}
      />
    </div>
  );
}
