import { getStudentsGroupedByParentEmail } from "@/lib/services/student.service";
import { StudentsTable } from "./students-table";

export const dynamic = 'force-dynamic';

export default async function StudentsPage() {
  let groups = [];
  let error: string | null = null;
  let errorDetail: string | null = null;

  try {
    groups = await getStudentsGroupedByParentEmail();
  } catch (err) {
    console.error("Error fetching students:", err);
    error = "Erreur lors du chargement des élèves";
    errorDetail = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="space-y-6">
      <StudentsTable
        groups={groups}
        error={error}
        errorDetail={errorDetail}
      />
    </div>
  );
}
