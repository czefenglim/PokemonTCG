'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  Crown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Home,
  LogOut,
  AlertTriangle,
  Wifi,
  WifiOff,
  Activity,
} from 'lucide-react';
import { getMainManagementTools } from '@/lib/admin/navigation/admin-navigation';

interface AdminSidebarProps {
  className?: string;
}

export default function AdminSidebar({ className = '' }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const pathname = usePathname();

  // Get management tools from shared config
  const managementTools = getMainManagementTools();

  // Monitor online status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  /**
   * Check if the current route is active
   */
  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  /**
   * Handle logout with improved UX
   */
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({
        callbackUrl: '/login',
        redirect: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  /**
   * Enhanced Logout Confirmation Modal
   */
  const LogoutConfirmationModal = () => {
    if (!showLogoutConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl p-6 border border-white/10 max-w-sm w-full shadow-2xl transform animate-in zoom-in-95 duration-300">
          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-0.5">Sign Out</h3>
              <p className="text-slate-300 text-sm">End your admin session?</p>
            </div>
          </div>

          {/* Modal Content */}
          <div className="mb-6 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium text-sm">
                Active Session
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              You'll be signed out of your admin session. Any unsaved changes
              may be lost.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleLogoutCancel}
              disabled={isLoggingOut}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 hover:border-white/20 text-sm"
            >
              Stay Signed In
            </button>
            <button
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
              className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-3 px-4 rounded-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-red-500/25 text-sm"
            >
              {isLoggingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Enhanced Collapsed Sidebar
   */
  const CollapsedSidebar = () => (
    <div className="flex flex-col h-full w-full">
      {/* Collapsed Header */}
      <div className="border-b border-white/10 pb-3">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setIsCollapsed(false)}
            className="group relative w-10 h-10 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 overflow-hidden"
            title="Expand sidebar"
          >
            <img
              src="https://i.pinimg.com/236x/7d/bf/bc/7dbfbcb77d477f570f8f2e87c2b35e18.jpg"
              alt="Pikachu"
              className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-200"
            />
            <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          </button>

          {/* Current time indicator */}
          <div className="text-xs text-white/50 font-mono">
            {currentTime.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>

      {/* Collapsed Navigation */}
      <div className="flex-1 pt-2 space-y-8">
        {/* Dashboard */}
        <div className="relative group">
          <Link
            href="/admin"
            className={`relative w-full h-10 flex items-center justify-center rounded-xl transition-all duration-300 overflow-hidden ${
              isActive('/admin')
                ? 'bg-gradient-to-r from-blue-500/40 to-purple-600/40 text-white shadow-md border border-blue-400/30'
                : 'text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10'
            }`}
          >
            <Home
              className={`w-5 h-5 transition-all duration-200 ${
                isActive('/admin') ? 'scale-105' : 'group-hover:scale-105'
              }`}
            />
            {isActive('/admin') && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 animate-pulse"></div>
            )}
          </Link>

          {/* Enhanced Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-slate-900/95 backdrop-blur-xl text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap pointer-events-none shadow-xl border border-white/10 z-50">
            <div className="font-semibold">Dashboard</div>
            <div className="text-slate-300 text-xs mt-1">
              Overview & Analytics
            </div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 border-6 border-transparent border-r-slate-900/95"></div>
          </div>
        </div>

        {/* Management Tools */}
        {managementTools.map((tool, index) => {
          const IconComponent = tool.icon;
          const isToolActive = isActive(tool.href);

          return (
            <div key={tool.id} className="relative group">
              <Link
                href={tool.href}
                className={`relative w-full h-10 flex items-center justify-center rounded-xl transition-all duration-300 overflow-hidden ${
                  isToolActive
                    ? 'bg-gradient-to-r from-blue-500/40 to-purple-600/40 text-white shadow-md border border-blue-400/30'
                    : 'text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10'
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <IconComponent
                  className={`w-5 h-5 transition-all duration-200 ${
                    isToolActive ? 'scale-105' : 'group-hover:scale-105'
                  }`}
                />
                {isToolActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 animate-pulse"></div>
                )}
              </Link>

              {/* Enhanced Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-slate-900/95 backdrop-blur-xl text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none w-64 shadow-xl border border-white/10 z-50">
                <div className="font-semibold">{tool.title}</div>
                <div className="text-slate-300 text-xs mt-1 leading-relaxed">
                  {tool.description}
                </div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 border-6 border-transparent border-r-slate-900/95"></div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Enhanced Collapsed Footer */}
      <div className="border-t border-white/10 pt-2 space-y-2">
        {/* System Status */}
        <div className="relative group w-full h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
              isOnline
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-md'
                : 'bg-gradient-to-r from-red-400 to-red-500'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-3 h-3 text-white" />
            ) : (
              <WifiOff className="w-3 h-3 text-white" />
            )}
          </div>

          {/* System Status Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-slate-900/95 backdrop-blur-xl text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap pointer-events-none shadow-xl border border-white/10 z-50">
            <div className="font-semibold">System Status</div>
            <div
              className={`text-xs mt-1 ${
                isOnline ? 'text-green-300' : 'text-red-300'
              }`}
            >
              {isOnline ? 'All systems operational' : 'Connection offline'}
            </div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 border-6 border-transparent border-r-slate-900/95"></div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="relative group">
          <button
            onClick={handleLogoutClick}
            className="w-full h-10 flex items-center justify-center rounded-xl transition-all duration-300 text-red-300 hover:text-red-200 hover:bg-red-500/20 border border-transparent hover:border-red-500/30"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 group-hover:scale-105 transition-transform duration-200" />
          </button>

          {/* Logout Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-slate-900/95 backdrop-blur-xl text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap pointer-events-none shadow-xl border border-white/10 z-50">
            <div className="font-semibold text-red-300">Sign Out</div>
            <div className="text-slate-300 text-xs mt-1">
              End your admin session
            </div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 border-6 border-transparent border-r-slate-900/95"></div>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Enhanced Expanded Sidebar
   */
  const ExpandedSidebar = () => (
    <div className="flex flex-col h-full">
      {/* Enhanced Header */}
      <div className="border-b border-white/10 pb-4">
        <button
          onClick={() => setIsCollapsed(true)}
          className="group flex items-center gap-3 w-full hover:bg-white/5 rounded-xl p-2 transition-all duration-300"
        >
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
              <img
                src="https://i.pinimg.com/236x/7d/bf/bc/7dbfbcb77d477f570f8f2e87c2b35e18.jpg"
                alt="Pikachu"
                className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-200"
              />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          </div>

          <div className="flex-1 text-left">
            <h2 className="text-lg font-bold text-white mb-0.5 group-hover:text-yellow-200 transition-colors duration-200">
              PokéChain
            </h2>
            <p className="text-sm text-purple-200/80 font-medium">
              Admin Panel
            </p>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <ChevronLeft className="w-4 h-4 text-white/50 group-hover:text-white transition-colors duration-200" />
          </div>
        </button>

        {/* Status Bar */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-400' : 'bg-red-400'
              } animate-pulse`}
            ></div>
            <span className="text-white/60">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="text-white/60 font-mono">
            {currentTime.toLocaleTimeString('en-US', {
              hour12: true,
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all duration-200 shadow-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Enhanced Navigation */}
      <nav className="flex-1 overflow-y-auto pt-3">
        <div className="space-y-4">
          {/* Dashboard */}
          <Link
            href="/admin"
            onClick={() => setIsMobileOpen(false)}
            className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
              isActive('/admin')
                ? 'bg-gradient-to-r from-blue-500/30 to-purple-600/30 text-white border border-blue-400/40 shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10'
            }`}
          >
            <div
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                isActive('/admin')
                  ? 'bg-blue-500/30 shadow-md'
                  : 'bg-white/10 group-hover:bg-white/20'
              }`}
            >
              <Home className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-sm">Dashboard</span>
              <p className="text-xs text-white/50 mt-0.5">
                Overview & Analytics
              </p>
            </div>
            {isActive('/admin') && (
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
          </Link>

          {/* Enhanced Divider */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <span className="text-xs text-white/40 font-bold tracking-wider">
              MANAGEMENT
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          {/* Management Tools */}
          {managementTools.map((tool, index) => {
            const IconComponent = tool.icon;
            const isToolActive = isActive(tool.href);

            return (
              <Link
                key={tool.id}
                href={tool.href}
                onClick={() => setIsMobileOpen(false)}
                className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  isToolActive
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-600/30 text-white border border-blue-400/40 shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    isToolActive
                      ? 'bg-blue-500/30 shadow-md'
                      : 'bg-white/10 group-hover:bg-white/20'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {tool.title}
                  </div>
                  <div className="text-xs text-white/50 truncate mt-0.5">
                    {tool.description}
                  </div>
                </div>
                {isToolActive && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Enhanced Footer */}
      <div className="border-t border-white/10 pt-3 space-y-3">
        {/* System Status */}
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/10">
          <div
            className={`p-1.5 rounded-lg transition-all duration-300 ${
              isOnline
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-md'
                : 'bg-gradient-to-r from-red-400 to-red-500'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-4 h-4 text-white" />
            ) : (
              <WifiOff className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">System Status</p>
            <p
              className={`text-xs mt-0.5 ${
                isOnline ? 'text-green-300' : 'text-red-300'
              }`}
            >
              {isOnline ? 'All systems operational' : 'Connection offline'}
            </p>
          </div>
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? 'bg-green-400' : 'bg-red-400'
            } animate-pulse`}
          ></div>
        </div>

        {/* Enhanced Logout Button */}
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-red-500/10 to-rose-500/10 hover:from-red-500/20 hover:to-rose-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl transition-all duration-300 text-red-300 hover:text-red-200 shadow-md hover:shadow-red-500/10"
        >
          <div className="p-1.5 bg-red-500/20 rounded-lg">
            <LogOut className="w-4 h-4" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold">Sign Out</p>
            <p className="text-xs text-red-300/70 mt-0.5">
              End your admin session
            </p>
          </div>
          <ChevronRight className="w-3 h-3 opacity-50" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal />

      {/* Enhanced Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 text-white shadow-xl hover:bg-white/20 transition-all duration-300 hover:scale-105"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Enhanced Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-[55] animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Enhanced Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-r border-white/10 transition-all duration-500 ease-in-out relative z-[100] shadow-2xl ${
          isCollapsed ? 'w-24 px-3 pt-4 pb-8' : 'w-64 px-4 pt-6 pb-10'
        }`}
      >
        {isCollapsed ? <CollapsedSidebar /> : <ExpandedSidebar />}
      </aside>

      {/* Enhanced Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-64 px-6 pt-6 pb-10 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-r border-white/10 z-[58] transition-all duration-500 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ExpandedSidebar />
      </aside>
    </>
  );
}
