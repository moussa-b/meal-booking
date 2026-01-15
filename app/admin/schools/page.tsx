import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchoolsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des établissements scolaires</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Cette section permettra de gérer les établissements scolaires :
            ajouter, modifier, supprimer et consulter les informations des
            établissements.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
