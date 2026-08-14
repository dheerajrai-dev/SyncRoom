import React from 'react';
import { Navbar } from './Navbar';

export interface AppShellProps {
  children: React.ReactNode;
  hideNavbar?: boolean;
}

export function AppShell({ children, hideNavbar = false }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-500/30 selection:text-blue-200">
      {!hideNavbar && <Navbar />}
      <main className="flex-1 flex flex-col relative w-full">
        {children}
      </main>
    </div>
  );
}
