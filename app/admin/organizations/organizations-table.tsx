"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PencilIcon, TrashIcon } from 'lucide-react';
import type { Organization } from '@/lib/models/organization';
import { type ActionResult } from './actions';
import {
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
} from '@/lib/validations/organization.validation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreateOrganizationDialog } from './create-organization-dialog';
import { EditOrganizationDialog } from './edit-organization-dialog';

interface OrganizationsTableProps {
  organizations: Organization[];
  createOrganizationAction: (data: CreateOrganizationInput) => Promise<ActionResult>;
  updateOrganizationAction: (
    id: number,
    data: UpdateOrganizationInput
  ) => Promise<ActionResult>;
  deleteOrganizationAction: (id: number) => Promise<ActionResult<void>>;
  error?: string | null;
  errorDetail?: string | null;
}

export function OrganizationsTable({
  organizations: initialOrganizations,
  createOrganizationAction,
  updateOrganizationAction,
  deleteOrganizationAction,
  error,
  errorDetail,
}: OrganizationsTableProps) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Update organizations when initialOrganizations changes (after revalidation)
  useEffect(() => {
    setOrganizations(initialOrganizations);
  }, [initialOrganizations]);

  // Handle edit
  const handleEditClick = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    setSelectedOrganization(null);
  };

  // Handle delete
  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;

    const result = await deleteOrganizationAction(deleteId);
    if (result.success) {
      toast.success("Établissement supprimée avec succès");
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const organizationToDelete = deleteId
    ? organizations.find((s) => s.id === deleteId)
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestion des établissements</CardTitle>
            <CreateOrganizationDialog
              createOrganizationAction={createOrganizationAction}
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error}
              {errorDetail && (
                <div className="mt-2 text-xs font-mono opacity-75">
                  {errorDetail}
                </div>
              )}
            </div>
          )}
          {organizations.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Aucun établissement enregistré.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((organization) => (
                  <TableRow key={organization.id}>
                    <TableCell className="font-medium">{organization.name}</TableCell>
                    <TableCell>{organization.code}</TableCell>
                    <TableCell>{organization.type === 'company' ? 'Entreprise' : 'École'}</TableCell>
                    <TableCell>
                      {organization.description || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(organization.created)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(organization)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(organization.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditOrganizationDialog
        organization={selectedOrganization}
        updateOrganizationAction={updateOrganizationAction}
        open={isEditDialogOpen}
        onOpenChange={handleEditClose}
      />

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;établissement{" "}
              <strong>{organizationToDelete?.name}</strong> ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
