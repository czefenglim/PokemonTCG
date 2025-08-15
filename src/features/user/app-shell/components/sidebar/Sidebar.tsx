'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGems } from '@/features/user/buy-gems/contexts/GemContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDisconnect, useAccount, useConnect, useChainId } from 'wagmi';
import { signOut } from 'next-auth/react';
import clsx from 'clsx';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wallet,
  WifiOff,
  ChevronDown,
  Gem,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import ConfirmLogoutModal from '@/features/user/auth/components/ConfirmLogoutModal';
import { getFeaturesForSidebar } from '@/lib/user/config/features-config';

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { gems, gemsLoading } = useGems();

  // 🆕 Enhanced wallet state management
  const [connectionError, setConnectionError] = useState(null);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { disconnect } = useDisconnect();
  const { isConnected, isConnecting, isReconnecting, address } = useAccount();
  const chainId = useChainId();
  const {
    connect,
    connectors,
    error: connectError,
    isLoading,
    pendingConnector,
  } = useConnect({
    onError(error) {
      console.error('Connection error (hidden from user):', error);
      setConnectionError(getUserFriendlyError(error));
      setShowConnectionStatus(true);

      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setConnectionError(null);
        setShowConnectionStatus(false);
      }, 5000);
    },
    onSuccess() {
      setConnectionError(null);
      setShowConnectionStatus(false);
      setRetryCount(0);
    },
  });

  // Get navigation items from config
  const navItems = getFeaturesForSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🛡️ User-friendly error message converter
  const getUserFriendlyError = (error) => {
    if (!error) return null;

    const errorString = error.toString().toLowerCase();
    const errorMessage = error.message?.toLowerCase() || '';

    // Common RainbowKit/wagmi error patterns
    if (error.code === 4001 || errorMessage.includes('user rejected')) {
      return 'Connection cancelled. Click "Connect Wallet" when ready!';
    }

    if (error.code === -32002 || errorMessage.includes('already pending')) {
      return 'Please check MetaMask for a pending connection request.';
    }

    if (errorMessage.includes('connector not found')) {
      return 'Wallet not detected. Please install MetaMask and refresh the page.';
    }

    if (errorMessage.includes('network')) {
      return 'Network connection issue. Please check your internet connection.';
    }

    if (errorMessage.includes('timeout')) {
      return 'Connection timed out. Please try again.';
    }

    if (errorMessage.includes('metamask') && errorMessage.includes('install')) {
      return 'MetaMask is required. Please install MetaMask and refresh the page.';
    }

    // Fallback friendly message
    return 'Connection failed. Please check MetaMask and try again.';
  };

  // Close wallet menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showWalletMenu && !event.target.closest('.wallet-menu-container')) {
        setShowWalletMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWalletMenu]);

  const handleDisconnect = () => {
    try {
      disconnect();
      setShowWalletMenu(false);
      setConnectionError(null);
      setShowConnectionStatus(false);
    } catch (error) {
      console.error('Disconnect error:', error);
      // Usually disconnect doesn't fail, but just in case
    }
  };

  // 🔄 Retry connection function
  const handleRetryConnection = () => {
    setRetryCount((prev) => prev + 1);
    setConnectionError(null);
    setShowConnectionStatus(false);

    // Try to reconnect with MetaMask if available
    const metaMaskConnector = connectors.find(
      (connector) => connector.name === 'MetaMask'
    );

    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector });
    }
  };

  return (
    <aside
      className={clsx(
        'min-h-screen flex flex-col border-r border-white/10 transition-all duration-300 ease-in-out relative',
        collapsed ? 'w-20 px-3 pt-4 pb-8' : 'w-64 px-6 pt-6 pb-10'
      )}
    >
      {/* Logo Toggle */}
      <div className="relative mb-6">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="group flex items-center gap-3 w-full px-3 py-3 text-white hover:bg-white/5 rounded-xl transition-all duration-200 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 to-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          <div className="flex items-center gap-3 relative z-10 flex-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg overflow-hidden bg-white/5">
              <img
                src="https://cdn-icons-png.flaticon.com/512/188/188926.png"
                alt="Pokémon Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src =
                    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';
                  e.target.onerror = () => {
                    e.target.style.display = 'none';
                  };
                }}
              />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-white tracking-tight">
                PokéChain
              </span>
            )}
          </div>

          <div className="relative z-10 p-1 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'group flex items-center gap-3 px-3 py-3 rounded-xl relative transition-all duration-200 overflow-hidden',
                isActive
                  ? 'bg-gradient-to-r from-yellow-400/10 to-yellow-400/5 text-yellow-300 shadow-lg shadow-yellow-400/5'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-r-full" />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              <div className="relative z-10 flex items-center gap-3 w-full">
                <div
                  className={clsx(
                    'p-2 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-yellow-400/20 text-yellow-300'
                      : 'bg-white/5 group-hover:bg-white/10'
                  )}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {!collapsed && (
                  <span
                    className={clsx(
                      'font-medium truncate transition-all duration-200',
                      isActive ? 'font-semibold' : 'group-hover:translate-x-1'
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Elegant Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
        <div className="relative flex justify-center">
          <div className="bg-transparent px-2">
            <div className="w-2 h-2 bg-white/10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Enhanced Gems Balance */}
      {!collapsed && (
        <div className="relative group mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-yellow-500/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-400/20 rounded-lg">
                  <Gem size={16} className="text-yellow-300" />
                </div>
                <span className="text-yellow-300 font-semibold text-sm">
                  Gems
                </span>
              </div>
              <div className="flex items-center gap-1">
                {gemsLoading || gems === undefined ? (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-bold text-white/60 text-lg">...</span>
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-white text-lg">
                      {gems.toLocaleString()}
                    </span>
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Connection Status Banner - Only show for actual errors, not network issues */}
      {!collapsed && connectionError && !chainId && (
        <div className="mb-4">
          <div className="px-3 py-2 rounded-lg border bg-red-500/10 border-red-500/30 text-red-300 text-xs">
            <div className="flex items-center gap-2">
              <XCircle size={14} className="flex-shrink-0" />
              <span className="flex-1">{connectionError}</span>
              {retryCount < 3 && (
                <button
                  onClick={handleRetryConnection}
                  className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
                  title="Retry connection"
                >
                  <RefreshCw size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Connect Button with Better Error Handling */}
      <div className="mb-6 relative wallet-menu-container">
        {mounted ? (
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openConnectModal,
              openChainModal,
              authenticationStatus,
              mounted: connectButtonMounted,
            }) => {
              const ready =
                connectButtonMounted && authenticationStatus !== 'loading';
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === 'authenticated');

              // Show connection states
              const showConnecting =
                isConnecting || isReconnecting || isLoading;
              const showError = connectError && !showConnecting;

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                  className="w-full space-y-2"
                >
                  {connected ? (
                    <>
                      {/* Connected Wallet Button */}
                      <button
                        onClick={() => setShowWalletMenu(!showWalletMenu)}
                        type="button"
                        className={clsx(
                          'group relative flex items-center w-full px-3 py-3 rounded-xl transition-all duration-200 overflow-hidden bg-gradient-to-r from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20 border border-green-500/20',
                          collapsed ? 'justify-center' : 'justify-between'
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                        {collapsed ? (
                          <div className="relative z-10 w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            <CheckCircle size={16} />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 relative z-10">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                {account.displayName?.[0] || (
                                  <CheckCircle size={16} />
                                )}
                              </div>
                              <div className="flex flex-col items-start text-left w-full">
                                <span className="font-medium text-white text-sm">
                                  {account.displayName}
                                </span>
                                <span className="text-xs text-green-300">
                                  Connected {chain?.name || 'Unknown Network'}
                                </span>
                              </div>
                            </div>
                            <div className="relative z-10 flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                              <ChevronDown
                                size={16}
                                className={`text-white/60 transition-transform duration-200 ${
                                  showWalletMenu ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </>
                        )}
                      </button>

                      {/* Wallet Dropdown Menu */}
                      {showWalletMenu && !collapsed && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                          {/* Account Info */}
                          <div className="px-4 py-3 border-b border-white/10">
                            <p className="text-white text-sm font-medium truncate">
                              {account.displayName}
                            </p>
                            <p className="text-white/60 text-xs">
                              {chain?.name || 'Unknown Network'} •{' '}
                              {address?.slice(0, 6)}...{address?.slice(-4)}
                            </p>
                          </div>

                          {/* Switch Network (if chain is wrong) */}
                          {chainId !== 31337 && (
                            <button
                              onClick={() => {
                                openChainModal();
                                setShowWalletMenu(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-yellow-500/10 transition-colors text-left group"
                            >
                              <AlertTriangle
                                size={16}
                                className="text-yellow-400"
                              />
                              <div className="flex-1">
                                <span className="text-yellow-400 text-sm font-medium">
                                  Switch Network
                                </span>
                                <p className="text-yellow-400/60 text-xs">
                                  Connect to Localhost for pack opening
                                </p>
                              </div>
                            </button>
                          )}

                          {/* Disconnect Button */}
                          <button
                            onClick={handleDisconnect}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-left group"
                          >
                            <WifiOff
                              size={16}
                              className="text-red-400 group-hover:text-red-300"
                            />
                            <div className="flex-1">
                              <span className="text-red-400 group-hover:text-red-300 text-sm font-medium">
                                Disconnect Wallet
                              </span>
                              <p className="text-red-400/60 group-hover:text-red-300/60 text-xs">
                                Sign out from wallet
                              </p>
                            </div>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    // Connection Button with States
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setConnectionError(null);
                          setShowConnectionStatus(true);
                          openConnectModal();
                        }}
                        disabled={showConnecting}
                        type="button"
                        className={clsx(
                          'group relative flex items-center justify-center w-full px-4 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg overflow-hidden',
                          collapsed && 'justify-center',
                          showConnecting
                            ? 'bg-gradient-to-r from-blue-400 to-blue-500 cursor-not-allowed'
                            : showError
                            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-red-500/20'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 shadow-blue-500/20',
                          'text-white'
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                        <div className="relative z-10 flex items-center gap-2">
                          {showConnecting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              {!collapsed && <span>Connecting...</span>}
                            </>
                          ) : showError ? (
                            <>
                              <XCircle size={18} />
                              {!collapsed && <span>Retry Connection</span>}
                            </>
                          ) : (
                            <>
                              <Wallet size={18} />
                              {!collapsed && <span>Connect Wallet</span>}
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>
        ) : (
          <div className="flex items-center justify-center px-4 py-3 w-full bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {!collapsed && (
                <span className="text-white/60 text-sm">Loading...</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Enhanced Logout Button */}
      {!collapsed && (
        <div className="mt-auto">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="group relative flex items-center gap-3 w-full px-4 py-3 bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 text-red-300 hover:text-red-200 font-semibold rounded-xl transition-all duration-200 border border-red-500/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="p-1.5 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                <LogOut size={16} />
              </div>
              <span>Logout</span>
            </div>
          </button>

          <ConfirmLogoutModal
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={() => signOut({ callbackUrl: '/login' })}
          />
        </div>
      )}
    </aside>
  );
}
