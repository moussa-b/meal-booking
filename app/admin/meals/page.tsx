import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MealsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des repas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Cette section permettra de gérer les repas disponibles : créer,
            modifier, supprimer et consulter les informations des repas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
