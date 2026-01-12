import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-lg">
          <CardTitle className="text-3xl font-bold text-center">
            Panneau d'administration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-amber-100 p-6">
              <Construction className="h-16 w-16 text-amber-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            À venir prochainement
          </h2>
          <p className="text-slate-600 text-lg">
            Le panneau d'administration est en cours de développement.
          </p>
          <p className="text-slate-500 mt-4">
            Cette section permettra de gérer les réservations, les menus et les
            paramètres de l'école.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
