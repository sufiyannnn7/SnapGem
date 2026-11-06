import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Warehouse,
  Tags,
  ShoppingBasket,
  Users,
  DollarSign,
  BarChart3,
  Image as ImageIcon,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutTemplate,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminLayout() {
  const { logout, profile } = useAuth();
  const location = useLocation();
  
  // Mobile check: default closed on mobile, open on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile after navigation
  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: ShoppingBag },
    { name: 'Inventory', href: '/admin/inventory', icon: Warehouse },
    { name: 'Categories', href: '/admin/categories', icon: Tags },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBasket },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Expenses', href: '/admin/expenses', icon: DollarSign },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Homepage Builder', href: '/admin/homepage-builder', icon: LayoutTemplate },
    { name: 'Media Library', href: '/admin/media', icon: ImageIcon },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 overflow-hidden font-sans relative">
      
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Drawer */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed md:static inset-y-0 left-0 w-64 h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col shadow-xl md:shadow-none z-40 shrink-0"
          >
            {/* Header Brand */}
            <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-zinc-800 justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-foreground text-background font-bold flex items-center justify-center text-xs shadow-sm">
                  SG
                </div>
                <span className="text-base font-serif font-bold tracking-tight text-foreground">SnapGem Admin</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden" 
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navigation.map((item) => {
                const isActive = 
                  location.pathname === item.href || 
                  (item.href === '/admin/dashboard' && location.pathname === '/admin') ||
                  (location.pathname.startsWith(item.href) && item.href !== '/admin' && item.href !== '/admin/dashboard');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={handleNavClick}
                    className={`group flex items-center px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                      isActive
                        ? 'bg-foreground text-background shadow-md'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className={`mr-3 h-4 w-4 flex-shrink-0 ${isActive ? 'text-background' : 'text-zinc-400 group-hover:text-foreground'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            {/* User Info & Logout */}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
              <div className="flex items-center mb-3 px-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border">
                  {profile?.full_name?.charAt(0) || 'A'}
                </div>
                <div className="ml-3 truncate">
                  <p className="text-xs font-bold text-foreground truncate">{profile?.full_name || 'Admin'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Store Admin</p>
                </div>
              </div>
              <Button onClick={logout} variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs">
                <LogOut className="mr-2.5 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex h-16 items-center justify-between px-4 sm:px-6 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate hidden sm:block">
              Store Manager
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Link 
              to="/" 
              target="_blank" 
              className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Live Store</span> <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
