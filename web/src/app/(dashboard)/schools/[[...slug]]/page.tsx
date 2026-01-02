import SchoolsRouter from './SchoolsRouter';

export function generateStaticParams() {
  return [{ slug: [''] }];
}

export default function SchoolsPage() {
  return <SchoolsRouter />;
}
