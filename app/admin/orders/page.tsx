import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des commandes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Cette section permettra de consulter et gérer les commandes de
            repas : visualiser les réservations, suivre le statut des commandes
            et gérer les annulations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
