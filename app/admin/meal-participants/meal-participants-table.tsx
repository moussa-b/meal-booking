'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, TrashIcon } from 'lucide-react';
import type { MealParticipantsByParentEmail } from '@/lib/services/meal-participant.service';
import type { MealParticipant } from '@/lib/models/meal-participant';
import { type ActionResult } from './actions';
import { type UpdateMealParticipantInput, } from '@/lib/validations/meal-participant.validation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { formatDate } from '@/lib/utils/date.utils';
import { EditMealParticipantDialog } from './edit-meal-participant-dialog';

interface MealParticipantsTableProps {
  groups: MealParticipantsByParentEmail[];
  updateMealParticipantAction: (id: number, data: UpdateMealParticipantInput) => Promise<ActionResult>;
  deleteMealParticipantAction: (id: number) => Promise<ActionResult<void>>;
  error?: string | null;
  errorDetail?: string | null;
}

export function MealParticipantsTable({
  groups: initialGroups,
  updateMealParticipantAction,
  deleteMealParticipantAction,
  error,
  errorDetail,
}: MealParticipantsTableProps) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMealParticipant, setSelectedMealParticipant] = useState<MealParticipant | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Update groups when initialGroups changes (after revalidation)
  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  // Handle edit
  const handleEditClick = (mealParticipant: MealParticipant) => {
    setSelectedMealParticipant(mealParticipant);
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    setSelectedMealParticipant(null);
  };

  // Handle delete
  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;

    const result = await deleteMealParticipantAction(deleteId);
    if (result.success) {
      toast.success("Participant supprimé avec succès");
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  const toggleGroup = (parentEmail: string | null) => {
    const key = parentEmail ?? '__null__';
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isGroupExpanded = (parentEmail: string | null): boolean => {
    const key = parentEmail ?? '__null__';
    return expandedGroups.has(key);
  };

  const getGroupLabel = (parentEmail: string | null): string => {
    return parentEmail ?? 'email du parent inconnu';
  };

  const totalMealParticipants = groups.reduce((sum, group) => sum + group.mealParticipants.length, 0);

  const mealParticipantToDelete = deleteId
    ? groups
        .flatMap((g) => g.mealParticipants)
        .find((s) => s.id === deleteId)
    : null;

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Gestion des participants</CardTitle>
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
        {totalMealParticipants === 0 ? (
          <p className="text-center text-muted-foreground">
            Aucun participant enregistré.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[1%]">Email du parent</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Régime alimentaire</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => {
                const isExpanded = isGroupExpanded(group.parentEmail);
                const groupKey = group.parentEmail ?? '__null__';
                const groupLabel = getGroupLabel(group.parentEmail);

                return (
                  <Fragment key={groupKey}>
                    {/* Group Header Row */}
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleGroup(group.parentEmail)}
                    >
                      <TableCell>
                        {isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4"/>
                        ) : (
                          <ChevronRightIcon className="h-4 w-4"/>
                        )}
                      </TableCell>
                      <TableCell className="font-medium w-[1%]">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span>{groupLabel}</span>
                          <Badge variant="secondary"
                                 className="ml-2 shrink-0">
                            {group.mealParticipants.length}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell colSpan={7}></TableCell>
                    </TableRow>
                    {/* MealParticipant Rows (only visible when expanded) */}
                    {isExpanded &&
                      group.mealParticipants.map((mealParticipant) => (
                        <TableRow key={mealParticipant.id}
                                  className="bg-muted/30">
                          <TableCell className="bg-white"></TableCell>
                          <TableCell className="pl-8 w-[1%] bg-white"></TableCell>
                          <TableCell>{mealParticipant.firstName}</TableCell>
                          <TableCell>{mealParticipant.lastName}</TableCell>
                          <TableCell>{mealParticipant.class}</TableCell>
                          <TableCell>
                            {mealParticipant.type && <Badge variant="outline">{mealParticipant.type === 'school' ? 'École' : 'Entreprise'}</Badge>}
                          </TableCell>
                          <TableCell>
                            {mealParticipant.feedingRegime || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(mealParticipant.created)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(mealParticipant);
                                }}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(mealParticipant.id);
                                }}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    {/* Edit Dialog */}
    <EditMealParticipantDialog
      mealParticipant={selectedMealParticipant}
      updateMealParticipantAction={updateMealParticipantAction}
      open={isEditDialogOpen}
      onOpenChange={handleEditClose}
    />

    {/* Delete Alert Dialog */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le participant{" "}
            <strong>
              {mealParticipantToDelete
                ? `${mealParticipantToDelete.firstName} ${mealParticipantToDelete.lastName}`
                : ""}
            </strong> ? Cette action est irréversible.
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
