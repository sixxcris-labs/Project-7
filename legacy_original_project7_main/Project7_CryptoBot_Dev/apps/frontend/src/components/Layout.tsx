import React from 'react';
import SideNav from './SideNav';
import TopBar from './TopBar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout">
      <SideNav />
      <div className="dashboard-content">
        <TopBar />
        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
