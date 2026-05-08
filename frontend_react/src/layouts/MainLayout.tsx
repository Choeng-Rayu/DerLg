import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { ToastProvider } from '@/components/ui/Toast';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <ToastProvider />
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-gray-100 py-6 px-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} DerLg. Cambodia travel made easy.
      </footer>
    </div>
  );
};
