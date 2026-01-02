'use client';

import { useParams } from 'next/navigation';
import ProvidersListClient from './ProvidersListClient';
import ProviderDetailClient from './ProviderDetailClient';
import EditProviderClient from './EditProviderClient';

export default function ProvidersRouter() {
  const params = useParams();
  const slug = params.slug as string[] | undefined;

  // No slug = list view
  if (!slug || slug.length === 0) {
    return <ProvidersListClient />;
  }

  // [id, 'edit'] = edit view
  if (slug.length === 2 && slug[1] === 'edit') {
    return <EditProviderClient providerId={slug[0]} />;
  }

  // [id] = detail view
  if (slug.length === 1) {
    return <ProviderDetailClient providerId={slug[0]} />;
  }

  // Unknown route - show not found
  return (
    <div className="p-8 text-center">
      <p className="text-gray-500">Page not found</p>
    </div>
  );
}
