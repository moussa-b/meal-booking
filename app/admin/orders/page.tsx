import { OrdersTable } from "./orders-table";

export const dynamic = 'force-dynamic';

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <OrdersTable />
    </div>
  );
}
