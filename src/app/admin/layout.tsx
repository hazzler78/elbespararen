"use client";

import { useState, useEffect } from "react";
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
  Lock,
  Newspaper,
  MessageCircle,
  MapPin,
  FileText,
  Sparkles
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
  },
  {
    name: "Nyheter",
    href: "/admin/news",
    icon: Newspaper,
    description: "Hantera nyheter och pressmeddelanden"
  },
  {
    name: "Chat-meddelanden",
    href: "/admin/chat",
    icon: MessageCircle,
    description: "Visa och analysera AI-chattmeddelanden"
  },
  {
    name: "Postnummer Analytics",
    href: "/admin/postal-code-analytics",
    icon: MapPin,
    description: "Spåra postnummer och områdesval"
  },
  {
    name: "Fakturaanalyser",
    href: "/admin/bill-analyses",
    icon: FileText,
    description: "Granska AI-analyser och besparingsuppskattningar"
  },
  {
    name: "Sätt Premium",
    href: "/admin/set-premium",
    icon: Sparkles,
    description: "Sätt premium-status för användare"
  },
  {
    name: "Användare & Premium",
    href: "/admin/users",
    icon: Users,
    description: "Visa alla användare och premium-status"
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/session", { credentials: "same-origin" });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setIsAuthenticated(Boolean(data?.authenticated));
        }
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(data?.error || "Fel lösenord. Försök igen.");
        setPassword("");
        return;
      }
      setIsAuthenticated(true);
      setPassword("");
    } catch {
      setError("Kunde inte logga in. Försök igen.");
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
  };

  // Show password prompt if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-blue-100 rounded-full p-3 mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Åtkomst</h1>
            <p className="text-gray-600 text-center">Ange lösenord för att komma åt admin-panelen</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Lösenord
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ange lösenord"
                autoFocus
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60"
            >
              {isSubmitting ? "Loggar in..." : "Logga in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — always fixed so it sits beside content, not above it */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white shadow-sm transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Elbespararen</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
            aria-label="Stäng meny"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {navigation.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-800"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    isActive
                      ? "text-blue-700"
                      : "text-gray-400 group-hover:text-gray-600"
                  }`}
                />
                <span className="min-w-0">
                  <span className="block font-medium leading-tight">{item.name}</span>
                  <span className="mt-0.5 block text-xs font-normal text-gray-500 leading-snug">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-gray-200 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            Logga ut
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
            aria-label="Öppna meny"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm text-gray-500 lg:block">Admin</div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            Online
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
