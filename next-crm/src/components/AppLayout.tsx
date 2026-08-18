'use client'

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Toaster } from 'sonner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Dummy user for now, this will be fetched from Supabase Auth & DB
  const mockUser = { name: 'Hibban', role: 'lord' };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar 
        user={mockUser}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        permissions={{}}
        pendingUsersCount={0}
        pendingApprovalsCount={0}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
          {children}
        </div>
      </main>
      
      <Toaster position="top-right" richColors />
    </div>
  );
}
