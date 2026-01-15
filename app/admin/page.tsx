import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Établissements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">
              Établissements scolaires enregistrés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Repas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">
              Repas disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">
              Commandes totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Élèves</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">
              Élèves enregistrés
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vue d'ensemble</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Le tableau de bord affichera les statistiques et les informations
            principales de l'application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
