"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react';
import type { School } from '@/lib/models/school';
import { type ActionResult, } from './actions';
import {
  type CreateSchoolInput,
  createSchoolSchema,
  type UpdateSchoolInput,
  updateSchoolSchema,
} from '@/lib/validations/school.validation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface SchoolsTableProps {
  schools: School[];
  createSchoolAction: (data: CreateSchoolInput) => Promise<ActionResult<School>>;
  updateSchoolAction: (
    id: number,
    data: UpdateSchoolInput
  ) => Promise<ActionResult<School>>;
  deleteSchoolAction: (id: number) => Promise<ActionResult<void>>;
  error?: string | null;
}

export function SchoolsTable({
  schools: initialSchools,
  createSchoolAction,
  updateSchoolAction,
  deleteSchoolAction,
  error,
}: SchoolsTableProps) {
  const router = useRouter();
  const [schools, setSchools] = useState(initialSchools);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Create form
  const createForm = useForm<CreateSchoolInput>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Edit form
  const editForm = useForm<UpdateSchoolInput>({
    resolver: zodResolver(updateSchoolSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Update schools when initialSchools changes (after revalidation)
  useEffect(() => {
    setSchools(initialSchools);
  }, [initialSchools]);

  // Handle create
  const handleCreateSubmit = async (data: CreateSchoolInput) => {
    const result = await createSchoolAction(data);
    if (result.success && result.data) {
      toast.success("École créée avec succès");
      createForm.reset();
      setIsCreateDialogOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la création");
    }
  };

  // Handle edit
  const handleEditClick = (school: School) => {
    setSelectedSchool(school);
    editForm.reset({
      name: school.name,
      description: school.description,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: UpdateSchoolInput) => {
    if (!selectedSchool) return;

    const result = await updateSchoolAction(selectedSchool.id, data);
    if (result.success && result.data) {
      toast.success("École modifiée avec succès");
      setIsEditDialogOpen(false);
      setSelectedSchool(null);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la modification");
    }
  };

  // Handle delete
  const handleDeleteClick = (id: number) => {
    const school = schools.find((s) => s.id === id);
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;

    const result = await deleteSchoolAction(deleteId);
    if (result.success) {
      toast.success("École supprimée avec succès");
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

  const schoolToDelete = deleteId
    ? schools.find((s) => s.id === deleteId)
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestion des établissements scolaires</CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Ajouter une école
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un établissement</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour créer un nouvel établissement
                    scolaire. Le code sera généré automatiquement.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form
                    onSubmit={createForm.handleSubmit(handleCreateSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nom de l'établissement" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <textarea
                              {...field}
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Description (optionnel)"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button type="submit">Créer</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}
          {schools.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Aucun établissement scolaire enregistré.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.code}</TableCell>
                    <TableCell>
                      {school.description || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(school.created)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(school)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(school.id)}
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'établissement</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'établissement scolaire. Le code ne peut pas être modifié.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-4"
            >
              {selectedSchool && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Code</label>
                  <Input
                    value={selectedSchool.code}
                    disabled
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Le code est généré automatiquement et ne peut pas être modifié
                  </p>
                </div>
              )}
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom de l'établissement" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Description (optionnel)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'établissement{" "}
              <strong>{schoolToDelete?.name}</strong> ? Cette action est
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
