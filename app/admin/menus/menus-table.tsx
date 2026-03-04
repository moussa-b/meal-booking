"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EyeIcon, EyeOffIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { WeeklyMenu } from '@/lib/models/weekly-menu';
import { DayOfWeek } from '@/lib/utils/date.utils';
import type { Meal } from '@/lib/models/meal';
import type { School } from '@/lib/models/school';
import { type ActionResult } from './actions';
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
import type { CreateWeeklyMenuInput, UpdateWeeklyMenuInput } from '@/lib/validations/weekly-menu.validation';

const DEFAULT_DAYS = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];

interface MenusTableProps {
  menus: WeeklyMenu[];
  meals: Meal[];
  schools: School[];
  createWeeklyMenuAction: (data: CreateWeeklyMenuInput) => Promise<ActionResult>;
  updateWeeklyMenuAction: (
    id: number,
    data: UpdateWeeklyMenuInput
  ) => Promise<ActionResult>;
  deleteWeeklyMenuAction: (id: number) => Promise<ActionResult<void>>;
  error?: string | null;
  errorDetail?: string | null;
  openCreateOnMount?: boolean;
}

export function MenusTable({
  menus: initialMenus,
  meals,
  schools,
  createWeeklyMenuAction,
  updateWeeklyMenuAction,
  deleteWeeklyMenuAction,
  error,
  errorDetail,
  openCreateOnMount,
}: MenusTableProps) {
  const router = useRouter();
  const [menus, setMenus] = useState(initialMenus);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<WeeklyMenu | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());

  // Update menus when initialMenus changes (after revalidation)
  useEffect(() => {
    setMenus(initialMenus);
  }, [initialMenus]);

  // Optionally open create dialog on mount (e.g. from dashboard link)
  useEffect(() => {
    if (openCreateOnMount) {
      setIsCreateDialogOpen(true);
    }
  }, [openCreateOnMount]);

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

  // Helper function to get meal name by ID
  const getMealName = (mealId: number | null | undefined): string => {
    if (!mealId) return '—';
    const meal = meals.find((m) => m.id === mealId);
    return meal?.name || '—';
  };

  // Helper function to get school name by ID
  const getSchoolName = (schoolId: number | null | undefined): string => {
    if (!schoolId) return '—';
    const school = schools.find((s) => s.id === schoolId);
    return school?.name || '—';
  };

  // Helper function to get day name by dayOfWeek
  const DAY_LABELS: Record<number, string> = {
    [DayOfWeek.MONDAY]: 'Lundi',
    [DayOfWeek.TUESDAY]: 'Mardi',
    [DayOfWeek.WEDNESDAY]: 'Mercredi',
    [DayOfWeek.THURSDAY]: 'Jeudi',
    [DayOfWeek.FRIDAY]: 'Vendredi',
    [DayOfWeek.SATURDAY]: 'Samedi',
    [DayOfWeek.SUNDAY]: 'Dimanche',
  };

  const getDayName = (dayOfWeek: number): string => {
    return DAY_LABELS[dayOfWeek] || `Jour ${dayOfWeek}`;
  };

  // Toggle menu details visibility
  const toggleMenuDetails = (menuId: number) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  const isMenuExpanded = (menuId: number) => expandedMenus.has(menuId);

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
              {errorDetail && (
                <div className="mt-2 text-xs font-mono opacity-75">
                  {errorDetail}
                </div>
              )}
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
                  <TableHead>École</TableHead>
                  <TableHead>Semaine</TableHead>
                  <TableHead>Année</TableHead>
                  <TableHead>Nombre de jours</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menus.flatMap((menu) => [
                  <TableRow key={menu.id}>
                    <TableCell className="font-medium">
                      {formatWeekRange(menu)}
                    </TableCell>
                    <TableCell>{getSchoolName(menu.schoolId)}</TableCell>
                    <TableCell>{menu.weekNumber || '—'}</TableCell>
                    <TableCell>{menu.year || '—'}</TableCell>
                    <TableCell>{menu.days?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMenuDetails(menu.id)}
                          className="gap-2"
                        >
                          {isMenuExpanded(menu.id) ? (
                            <>
                              <EyeOffIcon className="h-4 w-4" />
                              Masquer le menu
                            </>
                          ) : (
                            <>
                              <EyeIcon className="h-4 w-4" />
                              Voir le menu
                            </>
                          )}
                        </Button>
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
                  </TableRow>,
                  ...(menu.days &&
                  menu.days.length > 0 &&
                  isMenuExpanded(menu.id)
                    ? [
                        <TableRow key={`${menu.id}-details`}>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {menu.days
                                .filter((day) => {
                                  // Only show days that are in DEFAULT_DAYS (exclude Wednesday, Saturday, Sunday)
                                  if (!DEFAULT_DAYS.includes(day.dayOfWeek)) {
                                    return false;
                                  }
                                  // Filter out days with invalid mainDishId or if meal doesn't exist
                                  const meal = meals.find((m) => m.id === day.mainDishId);
                                  return meal !== undefined;
                                })
                                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                                .map((day) => (
                                  <Card key={day.id} className="gap-0 py-2">
                                    <CardHeader className="pb-1">
                                      <CardTitle className="text-base">
                                        {getDayName(day.dayOfWeek)}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <div className="text-sm">
                                        <span className="font-medium text-muted-foreground">
                                          Entrée:
                                        </span>{' '}
                                        <span>
                                          {day.appetizerId
                                            ? getMealName(day.appetizerId)
                                            : 'Aucun'}
                                        </span>
                                      </div>
                                      <div className="text-sm">
                                        <span className="font-medium text-muted-foreground">
                                          Plat:
                                        </span>{' '}
                                        <span>{getMealName(day.mainDishId)}</span>
                                      </div>
                                      <div className="text-sm">
                                        <span className="font-medium text-muted-foreground">
                                          Dessert:
                                        </span>{' '}
                                        <span>
                                          {day.dessertId
                                            ? getMealName(day.dessertId)
                                            : 'Aucun'}
                                        </span>
                                      </div>
                                      <div className="pt-2 border-t">
                                        <span className="font-semibold text-base">
                                          {day.price.toFixed(2)}€
                                        </span>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </TableCell>
                        </TableRow>,
                      ]
                    : []),
                ])}
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
