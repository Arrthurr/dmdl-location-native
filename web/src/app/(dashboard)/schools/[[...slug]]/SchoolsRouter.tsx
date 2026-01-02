'use client';

import { useParams } from 'next/navigation';
import SchoolsListClient from './SchoolsListClient';
import SchoolDetailClient from './SchoolDetailClient';
import EditSchoolClient from './EditSchoolClient';
import NewSchoolClient from './NewSchoolClient';

export default function SchoolsRouter() {
  const params = useParams();
  const slug = params.slug as string[] | undefined;

  // No slug = list view
  if (!slug || slug.length === 0) {
    return <SchoolsListClient />;
  }

  // ['new'] = new school form
  if (slug.length === 1 && slug[0] === 'new') {
    return <NewSchoolClient />;
  }

  // [id, 'edit'] = edit view
  if (slug.length === 2 && slug[1] === 'edit') {
    return <EditSchoolClient schoolId={slug[0]} />;
  }

  // [id] = detail view
  if (slug.length === 1) {
    return <SchoolDetailClient schoolId={slug[0]} />;
  }

  // Unknown route - show not found
  return (
    <div className="p-8 text-center">
      <p className="text-gray-500">Page not found</p>
    </div>
  );
}
