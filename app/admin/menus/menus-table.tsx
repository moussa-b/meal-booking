"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { WeeklyMenu } from '@/lib/models/weekly-menu';
import type { Meal } from '@/lib/models/meal';
import { type ActionResult } from './actions';
import {
  type CreateWeeklyMenuInput,
  type UpdateWeeklyMenuInput,
} from '@/lib/validations/weekly-menu.validation';
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
import { CreateMenuDialog } from './create-menu-dialog';
import { EditMenuDialog } from './edit-menu-dialog';

interface MenusTableProps {
  menus: WeeklyMenu[];
  meals: Meal[];
  createWeeklyMenuAction: (data: CreateWeeklyMenuInput) => Promise<ActionResult<WeeklyMenu>>;
  updateWeeklyMenuAction: (
    id: number,
    data: UpdateWeeklyMenuInput
  ) => Promise<ActionResult<WeeklyMenu>>;
  deleteWeeklyMenuAction: (id: number) => Promise<ActionResult<void>>;
  error?: string | null;
}

export function MenusTable({
  menus: initialMenus,
  meals,
  createWeeklyMenuAction,
  updateWeeklyMenuAction,
  deleteWeeklyMenuAction,
  error,
}: MenusTableProps) {
  const router = useRouter();
  const [menus, setMenus] = useState(initialMenus);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<WeeklyMenu | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Update menus when initialMenus changes (after revalidation)
  useEffect(() => {
    setMenus(initialMenus);
  }, [initialMenus]);

  // Handle edit
  const handleEditClick = (menu: WeeklyMenu) => {
    setSelectedMenu(menu);
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    setSelectedMenu(null);
  };

  // Handle delete
  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;

    const result = await deleteWeeklyMenuAction(deleteId);
    if (result.success) {
      toast.success("Menu supprimé avec succès");
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd MMMM yyyy', { locale: fr });
  };

  const formatWeekRange = (menu: WeeklyMenu) => {
    const start = menu.weekStartDate;
    const end = new Date(start);
    end.setDate(end.getDate() + 3); // Thursday
    return `Semaine du ${formatDate(start)} au ${formatDate(end)}`;
  };

  const menuToDelete = deleteId ? menus.find((m) => m.id === deleteId) : null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestion des menus</CardTitle>
            <CreateMenuDialog
              meals={meals}
              createWeeklyMenuAction={createWeeklyMenuAction}
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}
          {menus.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Aucun menu enregistré.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Semaine</TableHead>
                  <TableHead>Année</TableHead>
                  <TableHead>Nombre de jours</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menus.map((menu) => (
                  <TableRow key={menu.id}>
                    <TableCell className="font-medium">
                      {formatWeekRange(menu)}
                    </TableCell>
                    <TableCell>{menu.weekNumber || '—'}</TableCell>
                    <TableCell>{menu.year || '—'}</TableCell>
                    <TableCell>{menu.days?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(menu)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(menu.id)}
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
      <EditMenuDialog
        menu={selectedMenu}
        meals={meals}
        updateWeeklyMenuAction={updateWeeklyMenuAction}
        open={isEditDialogOpen}
        onOpenChange={handleEditClose}
      />

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le menu{" "}
              <strong>{menuToDelete ? formatWeekRange(menuToDelete) : ''}</strong> ? Cette action est
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
