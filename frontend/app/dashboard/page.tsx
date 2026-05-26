import { Suspense } from 'react';
import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-8">Loading…</div>}>
      <DashboardClient />
    </Suspense>
  );
}
