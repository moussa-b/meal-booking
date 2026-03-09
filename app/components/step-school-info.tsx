"use client";

import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BookingFormData } from './booking-wizard';
import type { School } from '@/lib/models/school';

export function StepSchoolInfo() {
  const { control } = useFormContext<BookingFormData>();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchools() {
      try {
        const response = await fetch('/api/public/schools');
        if (response.ok) {
          const result = await response.json();
          setSchools(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSchools();
  }, []);

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="schoolId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Établissement</FormLabel>
            <FormControl>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value ? String(field.value) : ""}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez un établissement" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={String(school.id)}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="votre@email.com"
                {...field}
                className="w-full"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
