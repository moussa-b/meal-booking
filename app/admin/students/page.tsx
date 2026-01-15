import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des élèves</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Cette section permettra de consulter et gérer les élèves enregistrés
            : visualiser la liste des élèves, leurs informations et leurs
            réservations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
