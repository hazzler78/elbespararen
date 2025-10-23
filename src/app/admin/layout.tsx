"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Users, 
  TrendingUp, 
  Zap, 
  ArrowRight, 
  Menu, 
  X,
  Settings,
  BarChart3
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: Home,
    description: "Översikt och statistik"
  },
  {
    name: "Leverantörer",
    href: "/admin/providers",
    icon: Zap,
    description: "Hantera elleverantörer"
  },
  {
    name: "Prisuppdateringar",
    href: "/admin/price-updates",
    icon: TrendingUp,
    description: "Automatiska prisuppdateringar"
  },
  {
    name: "Bytförfrågningar",
    href: "/admin/switch-requests",
    icon: ArrowRight,
    description: "Hantera bytförfrågningar"
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:z-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => {
                    console.log(`[Admin] Navigating to: ${item.href}`);
                    setSidebarOpen(false);
                  }}
                  style={{ pointerEvents: 'auto' }}
                >
                  <item.icon className={`mr-3 w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500 truncate">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Elbespararen Admin v1.0
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => {
                console.log('[Admin] Opening sidebar');
                setSidebarOpen(true);
              }}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              type="button"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <div className="text-sm text-gray-500">
                  Välkommen till admin-panelen
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
