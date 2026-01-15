import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MenusPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des menus</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Cette section permettra de gérer les menus : créer des menus pour
            chaque jour, modifier les menus existants et consulter les menus
            planifiés.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
