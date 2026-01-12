"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { BookingFormData } from "./booking-wizard";

export function StepSchoolInfo() {
  const { control } = useFormContext<BookingFormData>();

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="schoolCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Code école</FormLabel>
            <FormControl>
              <Input
                placeholder="Entrez le code de l'école"
                {...field}
                className="w-full"
              />
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
