import { getProductCount } from '@/lib/products/actions';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';

export default async function AdminDashboardPage() {
  const totalProducts = await getProductCount();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del catálogo de suplementos
        </p>
      </div>

      <AnalyticsDashboard totalProducts={totalProducts} />
    </div>
  );
}
