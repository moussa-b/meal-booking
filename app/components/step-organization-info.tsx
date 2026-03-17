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
import type { Organization } from '@/lib/models/organization';

interface StepOrganizationInfoProps {
  onOrganizationSelect?: (organization: Organization | null) => void;
}

export function StepOrganizationInfo({ onOrganizationSelect }: StepOrganizationInfoProps) {
  const { control, watch } = useFormContext<BookingFormData>();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const organizationId = watch('organizationId');

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch('/api/public/organizations');
        if (response.ok) {
          const result = await response.json();
          setOrganizations(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (!organizationId) {
      onOrganizationSelect?.(null);
      return;
    }

    const selectedOrganization =
      organizations.find((organization) => organization.id === organizationId) ?? null;
    onOrganizationSelect?.(selectedOrganization);
  }, [onOrganizationSelect, organizationId, organizations]);

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="organizationId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Établissement</FormLabel>
            <FormControl>
              <Select
                onValueChange={(value) => {
                  const selectedOrganizationId = Number(value);
                  field.onChange(selectedOrganizationId);
                  const selectedOrganization =
                    organizations.find((organization) => organization.id === selectedOrganizationId) ?? null;
                  onOrganizationSelect?.(selectedOrganization);
                }}
                value={field.value ? String(field.value) : ""}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez un établissement" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((organization) => (
                    <SelectItem key={organization.id} value={String(organization.id)}>
                      {organization.name}
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

      <FormField
        control={control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Téléphone{" "}
              <span className="text-slate-400 text-sm">(optionnel)</span>
            </FormLabel>
            <FormControl>
              <Input
                type="tel"
                placeholder="Votre numéro de téléphone"
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
