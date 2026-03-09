import { getAllOrganizations } from "@/lib/services/organization.service";
import type { Organization } from "@/lib/models/organization";
import { OrganizationsTable } from "./organizations-table";
import {
  createOrganizationAction,
  updateOrganizationAction,
  deleteOrganizationAction,
} from "./actions";

export const dynamic = 'force-dynamic';

export default async function OrganizationsPage() {
  let organizations: Organization[] = [];
  let error: string | null = null;
  let errorDetail: string | null = null;

  try {
    organizations = await getAllOrganizations();
  } catch (err) {
    console.error("Error fetching organizations:", err);
    error = "Erreur lors du chargement des établissements";
    errorDetail = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="space-y-6">
      <OrganizationsTable
        organizations={organizations}
        createOrganizationAction={createOrganizationAction}
        updateOrganizationAction={updateOrganizationAction}
        deleteOrganizationAction={deleteOrganizationAction}
        error={error}
        errorDetail={errorDetail}
      />
    </div>
  );
}
