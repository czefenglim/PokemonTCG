'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Package as PackageIcon,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  Sparkles,
  XCircle as XCircleIcon,
} from 'lucide-react';

// ---- Helpers (Stripe display) ----
const stripeLink = (id: string) => {
  if (!id) return '#';
  if (id.startsWith('cs_'))
    return `https://dashboard.stripe.com/checkout/sessions/${id}`;
  if (id.startsWith('pi_'))
    return `https://dashboard.stripe.com/payments/${id}`;
  if (id.startsWith('ch_'))
    return `https://dashboard.stripe.com/payments/${id}`;
  if (id.startsWith('re_')) return `https://dashboard.stripe.com/refunds/${id}`;
  return `https://dashboard.stripe.com/search?query=${encodeURIComponent(id)}`;
};

const maskId = (id: string) =>
  id.length <= 10 ? id : `${id.slice(0, 4)}…${id.slice(-4)}`;

// ---- Types from API shape ----
interface User {
  id: string;
  username: string | null;
  email: string;
}

interface GemPackage {
  id: string;
  amount: number;
  priceCents: number;
  currency: string;
  badge: string | null;
  popular: boolean;
  active: boolean;
  discountPercentage: number | null;
  createdAt?: string;
}

type PurchaseStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

interface GemPurchase {
  id: string;
  userId: string;
  packageId: string;
  amount: number;
  priceCents: number;
  currency: string;
  stripeId: string | null;
  status: PurchaseStatus;
  createdAt: string;
  completedAt: string | null;
  user: User;
  package: GemPackage;
}

interface TransactionResponse {
  transactions: GemPurchase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  // filters echo is ignored here
}

// ---- Component ----
const EnhancedGemPurchaseAdmin = () => {
  // data
  const [transactions, setTransactions] = useState<GemPurchase[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // ui
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // filters / sorting / paging
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'createdAt' | 'priceCents'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // stats (top cards)
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    conversionRate: 0,
  });

  const [selectedTransaction, setSelectedTransaction] =
    useState<GemPurchase | null>(null);

  // ---- Formatters ----
  const formatCurrency = (cents: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
      cents / 100
    );

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString();

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDateTime(dateString);
  };

  const getStatusConfig = (status: PurchaseStatus) => {
    const configs = {
      PENDING: {
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Clock,
      },
      COMPLETED: {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle,
      },
      FAILED: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
      REFUNDED: {
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: AlertCircle,
      },
      CANCELLED: {
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        icon: XCircle,
      },
    } as const;
    return configs[status] ?? configs.PENDING;
  };

  // ---- Data load ----
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
        sortBy,
        sortOrder,
        ...(searchTerm ? { search: searchTerm } : {}),
        ...(dateRange.start ? { startDate: dateRange.start } : {}),
        ...(dateRange.end ? { endDate: dateRange.end } : {}),
      });

      const res = await fetch(`/api/admin/gem-purchases?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');

      const data: TransactionResponse = await res.json();
      setTransactions(data.transactions);
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalStats = async () => {
    try {
      const params = new URLSearchParams({
        stats: 'true',
        ...(dateRange.start ? { startDate: dateRange.start } : {}),
        ...(dateRange.end ? { endDate: dateRange.end } : {}),
      });
      const res = await fetch(`/api/admin/gem-purchases?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      setTotalStats({
        totalRevenue: data.totalRevenue || 0,
        completedTransactions: data.completedTransactions || 0,
        pendingTransactions: data.pendingTransactions || 0,
        failedTransactions: data.failedTransactions || 0,
        conversionRate:
          data.totalTransactions > 0
            ? (data.completedTransactions / data.totalTransactions) * 100
            : 0,
      });
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, pageSize, sortBy, sortOrder, searchTerm, dateRange]);

  useEffect(() => {
    fetchTotalStats();
  }, [dateRange]);

  // ---- Export CSV ----
  const handleExport = async () => {
    try {
      setExporting(true);
      const baseParams: Record<string, string> = {
        sortBy,
        sortOrder,
        ...(searchTerm ? { search: searchTerm } : {}),
        ...(dateRange.start ? { startDate: dateRange.start } : {}),
        ...(dateRange.end ? { endDate: dateRange.end } : {}),
      };

      const pageSizeForExport = 100; // API cap
      let page = 1;
      let all: GemPurchase[] = [];

      for (;;) {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSizeForExport),
          ...baseParams,
        });
        const res = await fetch(
          `/api/admin/gem-purchases?${params.toString()}`
        );
        if (!res.ok) throw new Error('Failed to fetch for export');
        const data: TransactionResponse = await res.json();
        all = all.concat(data.transactions);
        if (page >= data.pagination.totalPages) break;
        page++;
      }

      const headers = [
        'id',
        'createdAt',
        'completedAt',
        'status',
        'userId',
        'username',
        'email',
        'packageId',
        'packageBadge',
        'packageAmount',
        'amount',
        'priceCents',
        'currency',
        'stripeId',
      ];

      const escapeCell = (v: unknown) => {
        const s = v == null ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };

      const lines = [headers.join(',')];
      for (const t of all) {
        lines.push(
          [
            t.id,
            t.createdAt,
            t.completedAt ?? '',
            t.status,
            t.user?.id ?? '',
            t.user?.username ?? '',
            t.user?.email ?? '',
            t.package?.id ?? '',
            t.package?.badge ?? '',
            t.package?.amount ?? '',
            t.amount,
            t.priceCents,
            t.currency,
            t.stripeId ?? '',
          ]
            .map(escapeCell)
            .join(',')
        );
      }

      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.download = `gem-transactions-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  // ---- UI ----
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center space-x-4 p-4 bg-white/10 rounded-lg border border-white/20">
            <div className="h-10 w-10 bg-white/20 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/20 rounded w-3/4" />
              <div className="h-3 bg-white/20 rounded w-1/2" />
            </div>
            <div className="h-6 w-20 bg-white/20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="p-8">
          <div className="mb-8">
            <div className="h-8 bg-white/20 rounded w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-white/20 rounded w-96 animate-pulse" />
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl backdrop-blur-xl border border-white/20">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Gem Transactions
                </h1>
                <p className="text-purple-200 text-lg">
                  Monitor and analyze all gem purchases
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchTransactions}
                disabled={loading}
                className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200 flex items-center space-x-2 text-white"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleExport}
                disabled={loading || exporting}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-60"
              >
                <Download
                  className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`}
                />
                <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative overflow-hidden bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200 mb-1">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(totalStats.totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200 mb-1">
                  Total Transactions
                </p>
                <p className="text-3xl font-bold text-white">
                  {pagination.total}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                <PackageIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200 mb-1">
                  Completed
                </p>
                <p className="text-3xl font-bold text-white">
                  {totalStats.completedTransactions}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200 mb-1">
                  Conversion Rate
                </p>
                <p className="text-3xl font-bold text-white">
                  {totalStats.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters (status filter removed) */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-purple-200" />
              <h3 className="text-lg font-semibold text-white">
                Filters & Search
              </h3>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1 text-sm text-purple-200 hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              {showFilters ? 'Hide' : 'Show'} Advanced
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
            {/* Search */}
            <div>
              <label
                htmlFor="search"
                className="block mb-1 text-sm text-purple-200"
              >
                Search
              </label>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-purple-300" />
                <input
                  id="search"
                  type="text"
                  placeholder="Search transactions..."
                  title="Search by transaction ID, Stripe ID, username, email, or package badge"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full pl-10 pr-4 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/10 focus:bg-white/20 transition-all duration-200 text-white placeholder-purple-300"
                />
              </div>
            </div>

            {/* Start date */}
            <div>
              <label
                htmlFor="startDate"
                className="block mb-1 text-sm text-purple-200"
              >
                Start date
              </label>
              <input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange((p) => ({ ...p, start: e.target.value }));
                  setCurrentPage(1);
                }}
                className="h-11 w-full px-4 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/10 focus:bg-white/20 transition-all duration-200 text-white"
              />
            </div>

            {/* End date */}
            <div>
              <label
                htmlFor="endDate"
                className="block mb-1 text-sm text-purple-200"
              >
                End date
              </label>
              <input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  setDateRange((p) => ({ ...p, end: e.target.value }));
                  setCurrentPage(1);
                }}
                className="h-11 w-full px-4 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/10 focus:bg-white/20 transition-all duration-200 text-white"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-purple-200">
                Showing {transactions.length} of {pagination.total} transactions
              </span>
            </div>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-11 px-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/10 text-sm text-white"
            >
              <option value={10} className="bg-purple-800">
                10 per page
              </option>
              <option value={25} className="bg-purple-800">
                25 per page
              </option>
              <option value={50} className="bg-purple-800">
                50 per page
              </option>
              <option value={100} className="bg-purple-800">
                100 per page
              </option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center space-x-3">
            <XCircleIcon className="w-5 h-5 text-red-400" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Table (status column removed) */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-white/20 to-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    <div
                      className="flex items-center space-x-1 cursor-pointer hover:text-white transition-colors"
                      onClick={() => {
                        setSortBy('createdAt');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <span>Date</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    <div
                      className="flex items-center space-x-1 cursor-pointer hover:text-white transition-colors"
                      onClick={() => {
                        setSortBy('priceCents');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <span>Amount</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    Payment
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8">
                      <LoadingSkeleton />
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <PackageIcon className="w-12 h-12 text-purple-300" />
                        <h3 className="text-lg font-medium text-white">
                          No transactions found
                        </h3>
                        <p className="text-purple-200">
                          Try adjusting your search criteria
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-white/5 transition-colors duration-150 group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">
                              {formatTimeAgo(t.createdAt)}
                            </span>
                            <span className="text-xs text-purple-300">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                                <span className="text-xs font-semibold text-white">
                                  {(t.user?.username ?? 'U')
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {t.user?.username ?? 'Unknown User'}
                              </div>
                              <div className="text-sm text-purple-300">
                                {t.user?.email ?? 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <div className="text-sm font-medium text-white">
                                  {t.package?.badge ||
                                    `${t.package?.amount} Gems`}
                                </div>
                                {t.package?.popular && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-300 border border-orange-500/30">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Popular
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-purple-300">
                                {t.amount} gems •{' '}
                                {formatCurrency(t.package?.priceCents || 0)}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-white">
                            {formatCurrency(t.priceCents, t.currency)}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {t.stripeId ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                              <a
                                href={stripeLink(t.stripeId)}
                                target="_blank"
                                rel="noreferrer"
                                title={t.stripeId}
                                className="font-mono text-purple-100 underline-offset-2 hover:underline"
                              >
                                {maskId(t.stripeId)}
                              </a>
                              <button
                                onClick={() =>
                                  navigator.clipboard.writeText(t.stripeId!)
                                }
                                className="text-xs px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/20"
                                title="Copy full ID"
                              >
                                Copy
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-full bg-purple-400" />
                              <span className="text-purple-400">
                                No payment ID
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-t border-white/10">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between w-full">
                <div>
                  <p className="text-sm text-purple-200">
                    Showing{' '}
                    <span className="font-medium text-white">
                      {(currentPage - 1) * pageSize + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium text-white">
                      {Math.min(currentPage * pageSize, pagination.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-white">
                      {pagination.total}
                    </span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-white/20 bg-white/10 text-sm font-medium text-purple-200 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-white/20 bg-white/10 text-sm font-medium text-white">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage(
                          Math.min(pagination.totalPages, currentPage + 1)
                        )
                      }
                      disabled={currentPage >= pagination.totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-white/20 bg-white/10 text-sm font-medium text-purple-200 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal (optional) */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-gradient-to-br from-purple-900/95 to-violet-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 flex justify-between items-center p-6 border-b border-white/20 bg-gradient-to-r from-purple-900/90 to-violet-900/90 backdrop-blur-xl rounded-t-2xl">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Transaction Details
                  </h3>
                  <p className="text-purple-200 mt-1">
                    Complete information about this transaction
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 text-purple-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* ...modal body unchanged for brevity... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left */}
                  <div className="space-y-6">
                    <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                      <label className="block text-sm font-semibold text-purple-200 mb-2">
                        Transaction ID
                      </label>
                      <p className="text-sm text-white font-mono break-all bg-white/10 px-3 py-2 rounded-lg border border-white/20">
                        {selectedTransaction.id}
                      </p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                      <label className="block text-sm font-semibold text-purple-200 mb-2">
                        Status
                      </label>
                      {(() => {
                        const cfg = getStatusConfig(selectedTransaction.status);
                        const Icon = cfg.icon;
                        return (
                          <span
                            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border ${cfg.color}`}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {selectedTransaction.status}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                      <label className="block text-sm font-semibold text-purple-200 mb-2">
                        User
                      </label>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                          <span className="text-sm font-semibold text-white">
                            {(selectedTransaction.user?.username ?? 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {selectedTransaction.user?.username ??
                              'Unknown User'}
                          </p>
                          <p className="text-xs text-purple-300">
                            {selectedTransaction.user?.email ?? 'No email'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="space-y-6">
                    <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                      <label className="block text-sm font-semibold text-purple-200 mb-2">
                        Package
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">
                            {selectedTransaction.package?.badge ||
                              `${selectedTransaction.package?.amount} Gems Package`}
                          </span>
                          {selectedTransaction.package?.popular && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-300 border border-orange-500/30">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-purple-300">
                          {selectedTransaction.amount} gems purchased
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                      <label className="block text-sm font-semibold text-purple-200 mb-2">
                        Amount
                      </label>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(
                          selectedTransaction.priceCents,
                          selectedTransaction.currency
                        )}
                      </p>
                    </div>

                    <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                      <label className="block text-sm font-semibold text-purple-200 mb-2">
                        Payment
                      </label>
                      {selectedTransaction.stripeId ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 bg-emerald-400 rounded-full" />
                          <a
                            href={stripeLink(selectedTransaction.stripeId)}
                            target="_blank"
                            rel="noreferrer"
                            title={selectedTransaction.stripeId}
                            className="text-sm text-white font-mono underline-offset-2 hover:underline"
                          >
                            {maskId(selectedTransaction.stripeId)}
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 bg-purple-400 rounded-full" />
                          <span className="text-sm text-purple-300">
                            No payment ID
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/20">
                  <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                    <label className="block text-sm font-semibold text-purple-200 mb-2">
                      Created At
                    </label>
                    <p className="text-sm text-white">
                      {formatDateTime(selectedTransaction.createdAt)}
                    </p>
                    <p className="text-xs text-purple-300 mt-1">
                      {formatTimeAgo(selectedTransaction.createdAt)}
                    </p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                    <label className="block text-sm font-semibold text-purple-200 mb-2">
                      Completed At
                    </label>
                    <p className="text-sm text-white">
                      {selectedTransaction.completedAt
                        ? formatDateTime(selectedTransaction.completedAt)
                        : 'Not completed yet'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedGemPurchaseAdmin;
