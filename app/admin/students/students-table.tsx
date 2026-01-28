'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, TrashIcon } from 'lucide-react';
import type { StudentsByParentEmail } from '@/lib/services/student.service';
import type { Student } from '@/lib/models/student';
import { type ActionResult } from './actions';
import { type UpdateStudentInput, } from '@/lib/validations/student.validation';
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
import { EditStudentDialog } from './edit-student-dialog';

interface StudentsTableProps {
  groups: StudentsByParentEmail[];
  updateStudentAction: (id: number, data: UpdateStudentInput) => Promise<ActionResult>;
  deleteStudentAction: (id: number) => Promise<ActionResult<void>>;
  error?: string | null;
  errorDetail?: string | null;
}

export function StudentsTable({
  groups: initialGroups,
  updateStudentAction,
  deleteStudentAction,
  error,
  errorDetail,
}: StudentsTableProps) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Update groups when initialGroups changes (after revalidation)
  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  // Handle edit
  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    setSelectedStudent(null);
  };

  // Handle delete
  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;

    const result = await deleteStudentAction(deleteId);
    if (result.success) {
      toast.success("Élève supprimé avec succès");
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

  const totalStudents = groups.reduce((sum, group) => sum + group.students.length, 0);

  const studentToDelete = deleteId
    ? groups
        .flatMap((g) => g.students)
        .find((s) => s.id === deleteId)
    : null;

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Gestion des élèves</CardTitle>
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
        {totalStudents === 0 ? (
          <p className="text-center text-muted-foreground">
            Aucun élève enregistré.
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
                            {group.students.length}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell colSpan={6}></TableCell>
                    </TableRow>
                    {/* Student Rows (only visible when expanded) */}
                    {isExpanded &&
                      group.students.map((student) => (
                        <TableRow key={student.id}
                                  className="bg-muted/30">
                          <TableCell className="bg-white"></TableCell>
                          <TableCell className="pl-8 w-[1%] bg-white"></TableCell>
                          <TableCell>{student.firstName}</TableCell>
                          <TableCell>{student.lastName}</TableCell>
                          <TableCell>{student.class}</TableCell>
                          <TableCell>
                            {student.feedingRegime || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(student.created)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(student);
                                }}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(student.id);
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
    <EditStudentDialog
      student={selectedStudent}
      updateStudentAction={updateStudentAction}
      open={isEditDialogOpen}
      onOpenChange={handleEditClose}
    />

    {/* Delete Alert Dialog */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer l&apos;élève{" "}
            <strong>
              {studentToDelete
                ? `${studentToDelete.firstName} ${studentToDelete.lastName}`
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
