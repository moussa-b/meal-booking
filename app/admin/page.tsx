'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { getMonday, getNextMonday, isMonday, formatDateLocal, formatWeekTitle } from '@/lib/utils/date.utils';
import type { School } from '@/lib/models/school';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { WeekColumnContent, type DashboardWeek } from './week-column-content';

interface DashboardData {
  week1: DashboardWeek;
  week2: DashboardWeek;
}

export default function AdminDashboardPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(() => getMonday(new Date()));
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Load schools on mount
  useEffect(() => {
    async function fetchSchools() {
      try {
        setSchoolsLoading(true);
        const res = await fetch('/api/admin/schools');
        if (!res.ok) throw new Error('Failed to fetch schools');
        const json = await res.json();
        const data = json.data ?? [];
        setSchools(data);
        // Default: first school by smallest id
        if (data.length > 0) {
          const sorted = [...data].sort((a: School, b: School) => a.id - b.id);
          setSelectedSchoolId(sorted[0].id);
        }
      } catch (err) {
        console.error(err);
        setSchools([]);
      } finally {
        setSchoolsLoading(false);
      }
    }

    fetchSchools();
  }, []);

  const sortedSchools = useMemo(() => {
    return [...schools].sort((a, b) => a.id - b.id);
  }, [schools]);

  // Fetch dashboard when date or school changes (only when we have a valid school)
  useEffect(() => {
    if (selectedSchoolId == null) return;

    let cancelled = false;
    setDashboardError(null);
    setDashboardLoading(true);

    const dateStr = formatDateLocal(selectedDate);
    fetch(`/api/admin/dashboard?date=${dateStr}&schoolId=${selectedSchoolId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 400 ? 'Invalid request' : 'Failed to load dashboard');
        return res.json();
      })
      .then((data: DashboardData) => {
        if (!cancelled) setDashboardData(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setDashboardError(err.message ?? 'Erreur lors du chargement');
          setDashboardData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setDashboardLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, selectedSchoolId]);

  // No schools: onboarding
  if (!schoolsLoading && schools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Pour commencer, créez un établissement scolaire.
        </p>
        <Button asChild>
          <Link href="/admin/schools">Créer un établissement</Link>
        </Button>
      </div>
    );
  }

  const weekStart1 = getMonday(selectedDate);
  const weekStart2 = getNextMonday(weekStart1);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Popover open={datePickerOpen}
                 onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-fit pl-3 text-left font-normal',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              {selectedDate ? (
                format(selectedDate, 'PPP', {locale: fr})
              ) : (
                <span>Sélectionner une date</span>
              )}
              <CalendarIcon className="ml-2 h-4 w-4 opacity-50"/>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0"
                          align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setDatePickerOpen(false);
                }
              }}
              disabled={(date) => !isMonday(date)}
            />
          </PopoverContent>
        </Popover>

        <Select
          value={selectedSchoolId != null ? String(selectedSchoolId) : ''}
          onValueChange={(v) => setSelectedSchoolId(parseInt(v, 10))}
          disabled={sortedSchools.length === 0}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Établissement"/>
          </SelectTrigger>
          <SelectContent>
            {sortedSchools.map((school) => (
              <SelectItem key={school.id}
                          value={String(school.id)}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {dashboardError && (
        <p className="text-sm text-destructive">{dashboardError}</p>
      )}

      {/* Two columns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Column 1: selected week */}
        <Card>
          <CardHeader>
            <CardTitle>{formatWeekTitle(weekStart1)}</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <p className="text-muted-foreground">Chargement…</p>
            ) : dashboardData?.week1.noData || !dashboardData?.week1.menus.length ? (
              <p className="text-muted-foreground">
                Aucun menu défini pour cette semaine.
              </p>
            ) : (
              <WeekColumnContent week={dashboardData.week1}/>
            )}
          </CardContent>
        </Card>

        {/* Column 2: next week */}
        <Card>
          <CardHeader>
            <CardTitle>{formatWeekTitle(weekStart2)}</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <p className="text-muted-foreground">Chargement…</p>
            ) : dashboardData?.week2.noData || !dashboardData?.week2.menus.length ? (
              <p className="text-muted-foreground">
                Aucun menu défini pour cette semaine.
              </p>
            ) : (
              <WeekColumnContent week={dashboardData.week2}/>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
