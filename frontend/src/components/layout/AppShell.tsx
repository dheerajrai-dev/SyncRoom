import React from 'react';
import { Navbar } from './Navbar';

export interface AppShellProps {
  children: React.ReactNode;
  hideNavbar?: boolean;
}

export function AppShell({ children, hideNavbar = false }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F2E9] text-[#1A1815] selection:bg-[#FBE9D6] selection:text-[#D9720F]">
      {!hideNavbar && <Navbar />}
      <main className="flex-1 flex flex-col relative w-full">
        {children}
      </main>
    </div>
  );
}
