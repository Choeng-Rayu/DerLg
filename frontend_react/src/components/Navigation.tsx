import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/app-store';
import { useLogout } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import {
  Home,
  Compass,
  CalendarCheck,
  Map,
  User,
  Menu,
  LogIn,
  LogOut,
  MessageSquare,
} from 'lucide-react';

export function Navigation() {
  const { t } = useTranslation();
  const location = useLocation();
  const user = useAppStore((s) => s.user);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const setChatOpen = useAppStore((s) => s.setChatOpen);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const logout = useLogout();

  const navItems = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/explore', label: t('nav.explore'), icon: Compass },
    { to: '/booking', label: t('nav.booking'), icon: CalendarCheck },
    { to: '/my-trips', label: t('nav.myTrips'), icon: Map },
    { to: '/profile', label: t('nav.profile'), icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:flex items-center justify-between px-6 py-3 bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <Link to="/" className="text-xl font-bold text-derlg-primary">
          DerLg
        </Link>
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(item.to)
                  ? 'bg-derlg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setChatOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            aria-label="Open AI Chat"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Avatar src={user.avatar || undefined} fallback={user.name} size="sm" />
              <button
                onClick={() => logout.mutate()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                <LogOut className="h-4 w-4" />
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" variant="outline">
                <LogIn className="h-4 w-4 mr-1" />
                {t('nav.login')}
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <Link to="/" className="text-lg font-bold text-derlg-primary">
          DerLg
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            aria-label="Open AI Chat"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-md hover:bg-gray-100">
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <Drawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} title="Menu">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                isActive(item.to)
                  ? 'bg-derlg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          <hr className="my-2" />
          {isAuthenticated && user ? (
            <button
              onClick={() => {
                logout.mutate();
                setMobileOpen(false);
              }}
              className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              {t('nav.logout')}
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <LogIn className="h-5 w-5" />
              {t('nav.login')}
            </Link>
          )}
        </div>
      </Drawer>
    </>
  );
}
