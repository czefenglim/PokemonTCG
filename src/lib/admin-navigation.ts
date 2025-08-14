// lib/admin-navigation.ts
import { Home, ShoppingBag, Gem } from "lucide-react";

export interface NavigationItem {
  id: string;
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  features?: string[];
  color?: string; // For gradient colors
}

export interface NavigationSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavigationItem[];
}

export const adminNavigation: NavigationSection[] = [
  {
    id: "overview",
    title: "Dashboard",
    icon: Home,
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        href: "/admin",
        icon: Home,
        description: "Main dashboard with stats and quick actions",
      },
    ],
  },
  {
    id: "management",
    title: "Management Tools",
    icon: Gem,
    items: [
      {
        id: "gem-packages",
        title: "Gem Packages",
        href: "/admin/gem-packages",
        icon: Gem,
        description:
          "Create, edit, and optimize gem packages with advanced pricing strategies and promotional tools",
        features: [
          "Package Creation",
          "Pricing Strategy",
          "Analytics",
          "Promotions",
        ],
        color: "from-blue-400 to-cyan-500",
      },
      {
        id: "merchandise",
        title: "Merchandise",
        href: "/admin/manage-merchandise",
        icon: ShoppingBag,
        description:
          "Complete merchandise lifecycle management with inventory tracking and order processing",
        features: [
          "Inventory Management",
          "Stock Alerts",
          "Order Processing",
          "Shipping",
        ],
        color: "from-purple-400 to-pink-500",
      },
      {
        id: "transaction",
        title: "View Transactions",
        href: "/admin/view-transaction",
        icon: ShoppingBag,
        description:
          "View and manage all transactions with detailed insights and filters",
        features: [
          "Transaction History",
          "User Management",
          "Merchandise Insights",
          "Order Tracking",
        ],
        color: "from-purple-400 to-pink-500",
      },
    ],
  },
];

// Helper functions for easier access
export const getMainManagementTools = () => {
  return (
    adminNavigation.find((section) => section.id === "management")?.items || []
  );
};

export const getQuickActions = () => {
  return [];
};

export const getAllNavigationItems = () => {
  return adminNavigation.flatMap((section) => section.items);
};

export const getNavigationItemById = (id: string) => {
  return getAllNavigationItems().find((item) => item.id === id);
};

export const getNavigationItemByHref = (href: string) => {
  return getAllNavigationItems().find((item) => item.href === href);
};
