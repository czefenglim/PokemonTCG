'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { getMainManagementTools } from '@/lib/admin-navigation';

interface AdminSidebarProps {
  className?: string;
}

export default function AdminSidebar({ className = '' }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

  // Get management tools from shared config
  const managementTools = getMainManagementTools();

  /**
   * Check if the current route is active
   * @param href - The route to check
   * @returns boolean indicating if route is active
   */
  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  /**
   * Handle logout confirmation
   * Shows the logout confirmation dialog
   */
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  /**
   * Handle logout cancellation
   * Hides the logout confirmation dialog
   */
  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  /**
   * Handle logout confirmation
   * Performs the actual logout using NextAuth
   */
  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({
        callbackUrl: '/login', // Redirect to login page after logout
        redirect: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  /**
   * Logout Confirmation Modal Component
   * Custom designed confirmation dialog matching the app's theme
   */
  const LogoutConfirmationModal = () => {
    if (!showLogoutConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md w-full shadow-2xl">
          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Confirm Logout</h3>
              <p className="text-white/60 text-sm">
                Are you sure you want to sign out?
              </p>
            </div>
          </div>

          {/* Modal Content */}
          <div className="mb-6">
            <p className="text-white/80 text-sm leading-relaxed">
              You will be signed out of your admin session and redirected to the
              login page. Any unsaved changes may be lost.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleLogoutCancel}
              disabled={isLoggingOut}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
   * Collapsed Sidebar Component
   * Minimized version of the sidebar with icons only
   */
  const CollapsedSidebar = () => (
    <div className="flex flex-col h-full w-full">
      {/* Collapsed Header */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full flex items-center justify-center p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
          title="Expand sidebar"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
            <Crown className="w-4 h-4 text-white" />
          </div>
        </button>
      </div>

      {/* Collapsed Navigation */}
      <div className="flex-1 p-2 space-y-2">
        {/* Dashboard */}
        <div className="relative group">
          <Link
            href="/admin"
            className={`w-full h-12 flex items-center justify-center rounded-lg transition-all duration-200 ${
              isActive('/admin')
                ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Home className="w-5 h-5" />
          </Link>

          {/* Tooltip */}
          <div
            className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none shadow-2xl border border-gray-700"
            style={{ zIndex: 99999 }}
          >
            Dashboard
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-gray-900"></div>
          </div>
        </div>

        {/* Management Tools */}
        {managementTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <div key={tool.id} className="relative group">
              <Link
                href={tool.href}
                className={`w-full h-12 flex items-center justify-center rounded-lg transition-all duration-200 ${
                  isActive(tool.href)
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <IconComponent className="w-5 h-5" />
              </Link>

              {/* Tooltip */}
              <div
                className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none w-64 shadow-2xl border border-gray-700"
                style={{ zIndex: 99999 }}
              >
                <div className="font-medium">{tool.title}</div>
                <div className="text-xs text-gray-300 mt-1 leading-relaxed">
                  {tool.description}
                </div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-gray-900"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapsed Footer with Logout */}
      <div className="p-2 border-t border-white/10 space-y-2">
        {/* System Status */}
        <div className="relative group w-full h-12 flex items-center justify-center bg-white/5 rounded-lg">
          <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>

          {/* System Status Tooltip */}
          <div
            className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none shadow-2xl border border-gray-700"
            style={{ zIndex: 99999 }}
          >
            <div className="font-medium">System Status</div>
            <div className="text-xs text-green-300">
              All systems operational
            </div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-gray-900"></div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="relative group">
          <button
            onClick={handleLogoutClick}
            className="w-full h-12 flex items-center justify-center rounded-lg transition-all duration-200 text-red-300 hover:text-red-200 hover:bg-red-500/20"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>

          {/* Logout Tooltip */}
          <div
            className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none shadow-2xl border border-gray-700"
            style={{ zIndex: 99999 }}
          >
            <div className="font-medium text-red-300">Sign Out</div>
            <div className="text-xs text-gray-300">End your admin session</div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-gray-900"></div>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Expanded Sidebar Component
   * Full version of the sidebar with labels and descriptions
   */
  const ExpandedSidebar = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <button
          onClick={() => setIsCollapsed(true)}
          className="flex items-center gap-3 w-full hover:bg-white/5 rounded-lg p-2 transition-all duration-200"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <h2 className="text-lg font-bold text-white">Pokemon TCG</h2>
            <p className="text-xs text-purple-200">Admin Panel</p>
          </div>
          <ChevronLeft className="w-4 h-4 text-white/50" />
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-6 right-6 p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {/* Dashboard */}
          <Link
            href="/admin"
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
              isActive('/admin')
                ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-500/50'
                : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>

          {/* Divider */}
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="h-px flex-1 bg-white/10"></div>
            <span className="text-xs text-white/50 font-medium">
              MANAGEMENT
            </span>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>

          {/* Management Tools */}
          {managementTools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                  isActive(tool.href)
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-500/50'
                    : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{tool.title}</div>
                  <div className="text-xs text-white/50 truncate">
                    {tool.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer with System Status and Logout */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {/* System Status */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div>
            <p className="text-sm font-medium text-white">System Status</p>
            <p className="text-xs text-green-300">All systems operational</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl transition-all duration-200 text-red-300 hover:text-red-200"
        >
          <LogOut className="w-5 h-5" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Sign Out</p>
            <p className="text-xs text-red-300/70">End your admin session</p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal />

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white shadow-xl"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[55]"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white/10 backdrop-blur-md border-r border-white/20 transition-all duration-300 relative z-[100] ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {isCollapsed ? <CollapsedSidebar /> : <ExpandedSidebar />}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-80 bg-white/10 backdrop-blur-md border-r border-white/20 z-[58] transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ExpandedSidebar />
      </aside>
    </>
  );
}
