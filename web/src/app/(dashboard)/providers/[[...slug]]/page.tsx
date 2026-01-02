import ProvidersRouter from './ProvidersRouter';

export function generateStaticParams() {
  return [{ slug: [''] }];
}

export default function ProvidersPage() {
  return <ProvidersRouter />;
}
