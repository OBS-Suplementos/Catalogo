import ConveniosManager from '@/components/admin/ConveniosManager';
import { getConvenios } from '@/lib/convenios/actions';

export const dynamic = 'force-dynamic';

export default async function AdminConveniosPage() {
  const { data: convenios, error } = await getConvenios();

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-accent-light p-4 text-accent">
          {error}
        </div>
      )}
      <ConveniosManager initialConvenios={convenios} />
    </div>
  );
}
