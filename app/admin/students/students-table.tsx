'use client';

import { Fragment, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import type { StudentsByParentEmail } from '@/lib/services/student.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils/date.utils';

interface StudentsTableProps {
  groups: StudentsByParentEmail[];
  error?: string | null;
  errorDetail?: string | null;
}

export function StudentsTable({groups, error, errorDetail,}: StudentsTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

  return (
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
                      <TableCell colSpan={5}></TableCell>
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
  );
}
