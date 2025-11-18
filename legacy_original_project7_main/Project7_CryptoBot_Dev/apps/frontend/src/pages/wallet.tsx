import React from 'react';
import PageShell from '../components/layout/PageShell';
import WalletDashboard from '../components/WalletDashboard';

export default function WalletPage() {
  return (
    <PageShell title="Wallet">
      <WalletDashboard />
    </PageShell>
  );
}