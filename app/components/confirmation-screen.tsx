"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Mail, School, User, UtensilsCrossed } from "lucide-react";
import type { BookingFormData } from "./booking-wizard";
import { toast } from "sonner";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Organization as OrganizationType } from "@/lib/models/organization";
import type { WeeklyMenu, WeeklyMenuDay } from "@/lib/models/weekly-menu";
import { DayOfWeek } from "@/lib/utils/date.utils";

const DAYS_FRENCH: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
};

// Map day of week (0-6) to lowercase key for form
const DAY_KEYS: Record<number, string | null> = {
  [DayOfWeek.MONDAY]: "lundi",
  [DayOfWeek.TUESDAY]: "mardi",
  [DayOfWeek.THURSDAY]: "jeudi",
  [DayOfWeek.FRIDAY]: "vendredi",
  [DayOfWeek.WEDNESDAY]: null,
  [DayOfWeek.SATURDAY]: null,
  [DayOfWeek.SUNDAY]: null,
};

interface ConfirmationScreenProps {
  onSubmitted?: () => void;
}

export function ConfirmationScreen({ onSubmitted }: ConfirmationScreenProps) {
  const { watch } = useFormContext<BookingFormData>();
  const formData = watch();
  const [organizations, setOrganizations] = useState<OrganizationType[]>([]);
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);

  // Fetch organizations to get organization name
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch("/api/public/organizations");
        if (response.ok) {
          const result = await response.json();
          setOrganizations(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    }
    fetchOrganizations();
  }, []);

  // Fetch weekly menu to calculate total price
  useEffect(() => {
    async function fetchMenu() {
      if (!formData.organizationId || formData.organizationId <= 0) {
        return;
      }

      try {
        const response = await fetch(`/api/public/weekly-menus?current=true&organizationId=${formData.organizationId}`);
        if (response.ok) {
          const result = await response.json();
          setWeeklyMenu(result.data);
        }
      } catch (error) {
        console.error("Error fetching weekly menu:", error);
      }
    }
    fetchMenu();
  }, [formData.organizationId]);

  // Find organization name by id
  const organization = organizations.find((s) => s.id === formData.organizationId);
  const organizationName = organization?.name || "Établissement non trouvé";

  // Calculate total price
  const calculateTotalPrice = (): number => {
    if (!weeklyMenu?.days) return 0;

    let total = 0;
    formData.students.forEach((student, index) => {
      const studentKey = `${student.firstName}-${student.lastName}-${index}`;
      const selectedIds = formData.menuSelections[studentKey] || [];

      if (!Array.isArray(selectedIds)) return;

      selectedIds.forEach((weeklyMenuDayId: number) => {
        const dayMenu = weeklyMenu.days?.find(
          (day: WeeklyMenuDay) => day.id === weeklyMenuDayId
        );
        if (dayMenu) {
          total += dayMenu.price;
        }
      });
    });

    return total;
  };

  const totalPrice = calculateTotalPrice();
  const [paying, setPaying] = useState(false);
  const [savingForLater, setSavingForLater] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [savedForLater, setSavedForLater] = useState(false);
  const [savedBookingId, setSavedBookingId] = useState<number | null>(null);

  const paypalPopupRef = useRef<Window | null>(null);
  const paypalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const payPalOutcomeRef = useRef<'none' | 'captured' | 'cancelled'>('none');

  const submissionData = {
    ...formData,
    menuId: weeklyMenu?.id ?? 0,
    saveChildrenInfo: formData.saveChildrenInfo ?? false,
  };

  const handlePaymentMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'payment_captured') {
        payPalOutcomeRef.current = 'captured';
        if (paypalIntervalRef.current) {
          clearInterval(paypalIntervalRef.current);
          paypalIntervalRef.current = null;
        }
        setPaymentSuccess(true);
        toast.success("Réservation enregistrée et payée avec succès!", {
          description: "Vous recevrez une confirmation par email.",
          duration: 5000,
        });
        onSubmitted?.();
      } else if (event.data?.type === 'payment_cancelled') {
        payPalOutcomeRef.current = 'cancelled';
        if (paypalIntervalRef.current) {
          clearInterval(paypalIntervalRef.current);
          paypalIntervalRef.current = null;
        }
        setSavedForLater(true);
        toast.success('Réservation enregistrée', {
          description: 'Vous pourrez effectuer le paiement plus tard.',
          duration: 5000,
        });
        onSubmitted?.();
      }
    },
    [onSubmitted]
  );

  useEffect(() => {
    window.addEventListener("message", handlePaymentMessage);
    return () => window.removeEventListener("message", handlePaymentMessage);
  }, [handlePaymentMessage]);

  useEffect(() => {
    return () => {
      if (paypalIntervalRef.current) {
        clearInterval(paypalIntervalRef.current);
        paypalIntervalRef.current = null;
      }
    };
  }, []);

  /**
   * Validates, saves the booking via API, and returns the created booking id or null.
   * Shows error toasts on validation or request failure. Does not manage loading state.
   * @param options.sendPayLaterEmail - When false, no pay-later email is sent (e.g. when paying with PayPal). Default true.
   */
  async function saveBooking(options?: { sendPayLaterEmail?: boolean }): Promise<{ id: number } | null> {
    if (!weeklyMenu?.id) {
      toast.error("Erreur", {
        description: "Impossible de récupérer les informations du menu. Veuillez réessayer.",
        duration: 5000,
      });
      return null;
    }

    if (totalPrice <= 0) {
      toast.error("Erreur", {
        description: "Aucun repas sélectionné. Veuillez sélectionner au moins un jour.",
        duration: 5000,
      });
      return null;
    }

    const body = {
      ...submissionData,
      ...(options?.sendPayLaterEmail !== undefined && { sendPayLaterEmail: options.sendPayLaterEmail }),
    };

    try {
      const bookingRes = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!bookingRes.ok) {
        const errorData = await bookingRes.json().catch(() => ({}));
        toast.error("Erreur", {
          description: errorData.message ?? "Une erreur est survenue lors de l'enregistrement de la réservation.",
          duration: 5000,
        });
        return null;
      }

      const bookingResult = await bookingRes.json();
      const bookingId = bookingResult.data?.id;
      if (!bookingId) {
        toast.error("Erreur", { description: "Réponse invalide du serveur.", duration: 5000 });
        return null;
      }

      return { id: bookingId };
    } catch (error) {
      console.error("Error saving booking:", error);
      toast.error("Erreur", {
        description: "Une erreur est survenue. Veuillez réessayer.",
        duration: 5000,
      });
      return null;
    }
  }

  const handlePayWithPayPal = async () => {
    setPaying(true);
    const result = await saveBooking({ sendPayLaterEmail: false });
    if (!result) {
      setPaying(false);
      return;
    }

    setSavedBookingId(result.id);
    payPalOutcomeRef.current = 'none';

    try {
      const orderRes = await fetch("/api/public/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: result.id }),
      });

      if (!orderRes.ok) {
        const orderErr = await orderRes.json().catch(() => ({}));
        toast.error("Erreur", {
          description: orderErr.message ?? "Impossible de créer le paiement PayPal.",
          duration: 5000,
        });
        setPaying(false);
        return;
      }

      const orderData = await orderRes.json();
      const approvalUrl = orderData.approvalUrl ?? orderData.approval_url;
      if (!approvalUrl) {
        toast.error("Erreur", { description: "URL de paiement manquante.", duration: 5000 });
        setPaying(false);
        return;
      }

      const width = 500;
      const height = 600;
      const left = Math.round((window.screen.width - width) / 2);
      const top = Math.round((window.screen.height - height) / 2);
      const popup = window.open(
        approvalUrl,
        "paypal-checkout",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      );
      paypalPopupRef.current = popup;

      if (popup) {
        paypalIntervalRef.current = setInterval(() => {
          if (paypalPopupRef.current?.closed) {
            if (paypalIntervalRef.current) {
              clearInterval(paypalIntervalRef.current);
              paypalIntervalRef.current = null;
            }
            paypalPopupRef.current = null;
            if (payPalOutcomeRef.current === 'none') {
              setSavedForLater(true);
              toast.success('Réservation enregistrée', {
                description: 'Vous pourrez effectuer le paiement plus tard.',
                duration: 5000,
              });
              onSubmitted?.();
              if (result.id) {
                fetch(`/api/public/bookings/${result.id}/send-pay-later-email`, {method: 'POST'}).catch(
                  (err) => console.error('Failed to send pay-later email:', err)
                );
              }
            }
          }
        }, 300);
      }
    } catch (error) {
      console.error("Error starting PayPal:", error);
      toast.error("Erreur", {
        description: "Une erreur est survenue. Veuillez réessayer.",
        duration: 5000,
      });
    }
    setPaying(false);
  };

  // const handleSaveAndPayLater = async () => {
  //   if (savedBookingId !== null) {
  //     setSavingForLater(true);
  //     try {
  //       const sendRes = await fetch(`/api/public/bookings/${savedBookingId}/send-pay-later-email`, {
  //         method: "POST",
  //       });
  //       if (!sendRes.ok) {
  //         console.error("Failed to send pay-later email:", await sendRes.text());
  //       }
  //     } catch (err) {
  //       console.error("Failed to send pay-later email:", err);
  //     }
  //     setSavingForLater(false);
  //     setSavedForLater(true);
  //     toast.success("Réservation enregistrée", {
  //       description: "Vous pourrez effectuer le paiement plus tard.",
  //       duration: 5000,
  //     });
  //     onSubmitted?.();
  //     return;
  //   }
  //
  //   setSavingForLater(true);
  //   const result = await saveBooking({ sendPayLaterEmail: true });
  //   setSavingForLater(false);
  //
  //   if (!result) return;
  //
  //   setSavedBookingId(result.id);
  //   setSavedForLater(true);
  //   toast.success("Réservation enregistrée", {
  //     description: "Vous pourrez effectuer le paiement plus tard.",
  //     duration: 5000,
  //   });
  //   onSubmitted?.();
  // };

  return (
    <div className="space-y-6">
      {/* Success Icon */}
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
      </div>

      <p className="text-center text-slate-600 mb-6">
        Veuillez vérifier vos informations avant de soumettre votre réservation.
      </p>

      {/* Organization Information */}
      <Card className="border-2 border-slate-200 pt-0">
        <CardHeader className="bg-slate-50 rounded-t-xl">
          <CardTitle className="text-lg font-semibold text-blue-900 text-center pt-2 flex items-center justify-center gap-2">
            <School className="h-5 w-5 text-blue-600" />
            Informations de l&apos;établissement
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start gap-3">
            <School className="h-5 w-5 text-slate-400 mt-0.5" />
            <div>
              <div className="text-sm text-slate-500">Établissement</div>
              <div className="font-semibold text-slate-900">
                {organizationName}
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
            <div>
              <div className="text-sm text-slate-500">Email</div>
              <div className="font-semibold text-slate-900">
                {formData.email}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students and Menu Selections */}
      <Card className="border-2 border-blue-200 pt-0">
        <CardHeader className="bg-blue-50 rounded-t-xl">
          <CardTitle className="text-lg font-semibold text-blue-900 text-center pt-2 flex items-center justify-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Élèves inscrits
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          {formData.students.map((student, index) => {
            const studentKey = `${student.firstName}-${student.lastName}-${index}`;
            const selectedIds = formData.menuSelections[studentKey] || [];
            const selectedIdsArray = Array.isArray(selectedIds) ? selectedIds : [];

            // Create array of selected days with their prices
            const selectedDaysWithPrices = selectedIdsArray
              .map((weeklyMenuDayId: number) => {
                const dayMenu = weeklyMenu?.days?.find(
                  (day: WeeklyMenuDay) => day.id === weeklyMenuDayId
                );
                if (!dayMenu) return null;

                const dayKey = DAY_KEYS[dayMenu.dayOfWeek];
                const dayName = dayKey ? DAYS_FRENCH[dayKey] : '';
                return {
                  id: weeklyMenuDayId,
                  dayKey: dayKey || '',
                  dayName,
                  dayOfWeek: dayMenu.dayOfWeek,
                  price: dayMenu.price
                };
              })
              .filter((item): item is { id: number; dayKey: string; dayName: string; dayOfWeek: number; price: number } => item !== null)
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

            return (
              <div key={studentKey}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-slate-900">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        Classe: <span className="font-medium">{student.class}</span>
                      </div>
                      {student.feedingRegime && (
                        <div className="text-sm text-slate-600 mt-1">
                          Régime alimentaire:{" "}
                          <span className="font-medium">
                            {student.feedingRegime}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-8 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <UtensilsCrossed className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-slate-700">
                        Jours sélectionnés:
                      </span>
                    </div>
                    {selectedDaysWithPrices.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedDaysWithPrices.map(({ id, dayName, price }) => (
                          <span
                            key={id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200"
                          >
                            {dayName} - {price.toFixed(2)} €
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-amber-600 italic">
                        Aucun jour sélectionné
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Total Price */}
      <Card className="border-2 border-green-200 pt-0">
        <CardHeader className="bg-green-50 rounded-t-xl">
          <CardTitle className="text-lg font-semibold text-green-900 text-center pt-2">
            Prix total
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-700">
              {totalPrice.toFixed(2)} €
            </div>
          </div>
        </CardContent>
      </Card>

      {/* After success: message; otherwise action buttons */}
      <div className="pt-4">
        {paymentSuccess ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-10 w-10 text-green-600" aria-hidden />
            </div>
            <p className="font-semibold text-green-800">Paiement effectué avec succès</p>
            <p className="text-sm text-slate-600">Vous pouvez fermer la fenêtre de paiement maintenant.</p>
          </div>
        ) : savedForLater ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-10 w-10 text-green-600" aria-hidden />
            </div>
            <p className="font-semibold text-green-800">Réservation enregistrée</p>
            <p className="text-sm text-slate-600">Vous pourrez effectuer le paiement plus tard.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              type="button"
              onClick={handlePayWithPayPal}
              disabled={paying || savingForLater || totalPrice <= 0}
              className="w-full min-h-12 h-auto py-3 text-base font-semibold bg-[#0070ba] hover:bg-[#005ea6] text-white whitespace-normal text-center"
            >
              {paying ? (
                "Enregistrement et préparation du paiement..."
              ) : (
                <span className="flex items-center justify-center gap-2 w-full min-w-0">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span className="min-w-0 text-center">Soumettre la réservation et payer avec PayPal</span>
                </span>
              )}
            </Button>
            {/*<Button*/}
            {/*  type="button"*/}
            {/*  variant="outline"*/}
            {/*  onClick={handleSaveAndPayLater}*/}
            {/*  disabled={paying || savingForLater || totalPrice <= 0}*/}
            {/*  className="w-full h-11 text-base font-medium"*/}
            {/*>*/}
            {/*  {savingForLater ? "Enregistrement..." : "Enregistrer et payer plus tard"}*/}
            {/*</Button>*/}
          </div>
        )}
      </div>
    </div>
  );
}
