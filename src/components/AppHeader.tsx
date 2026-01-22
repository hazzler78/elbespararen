"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  LogOut, 
  LayoutDashboard, 
  Upload, 
  Home,
  Sparkles,
  Crown,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AppHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
}

export default function AppHeader({ showBackButton = false, backHref = "/" }: AppHeaderProps) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoadingPremium, setIsLoadingPremium] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hämta premium-status om användaren är inloggad
  useEffect(() => {
    if (user && !loading) {
      setIsLoadingPremium(true);
      fetch('/api/user/info', {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setIsPremium(data.data.isPremium || false);
          }
        })
        .catch(err => {
          console.error('Error fetching premium status:', err);
        })
        .finally(() => {
          setIsLoadingPremium(false);
        });
    } else {
      setIsPremium(false);
    }
  }, [user, loading]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  // Navigation items baserat på auth-status
  const getNavigationItems = () => {
    if (!user) {
      // Utloggad användare
      return [
        { href: "/", label: "Hem", icon: Home },
        { href: "/upload", label: "Analysera faktura", icon: Upload },
        { href: "/auth/signin", label: "Logga in", icon: User },
      ];
    }

    // Inloggad användare (gratis eller premium)
    const items = [
      { href: "/", label: "Hem", icon: Home },
      { href: "/upload", label: "Analysera faktura", icon: Upload },
      { href: "/dashboard", label: "Mitt Dashboard", icon: LayoutDashboard },
    ];

    // Lägg till premium-länk om inte premium
    if (!isPremium) {
      items.push({ href: "/premium", label: "Bli Premium", icon: Sparkles });
    }

    return items;
  };

  const navigationItems = getNavigationItems();
  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo och Back Button */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Tillbaka
              </Link>
            )}
            <Link href="/" className="flex items-center gap-2">
              <img src="/green_elchef.svg" alt="Elchef" className="w-6 h-6" />
              <span className="text-xl font-bold text-primary">Elbespararen</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                  ${isActive(item.href)
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu / Auth Button */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="animate-pulse bg-gray-200 rounded-full w-10 h-10"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* Premium Badge */}
                {isPremium && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-full text-sm font-semibold">
                    <Crown className="w-4 h-4" />
                    <span>Premium</span>
                  </div>
                )}
                
                {/* User Avatar/Info */}
                <div className="flex items-center gap-2">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || user.email || "User"}
                      className="w-10 h-10 rounded-full border-2 border-primary"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-primary">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Användare'}
                    </p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Logga ut"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <User className="w-4 h-4" />
                Logga in
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 py-4"
            >
              <nav className="flex flex-col gap-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive(item.href)
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                
                {/* Mobile User Section */}
                {user && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="px-4 py-2 flex items-center gap-3">
                      {user.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt={user.user_metadata?.full_name || user.email || "User"}
                          className="w-10 h-10 rounded-full border-2 border-primary"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-primary">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Användare'}
                        </p>
                        {isPremium && (
                          <div className="flex items-center gap-1 mt-1">
                            <Crown className="w-3 h-3 text-yellow-600" />
                            <span className="text-xs text-yellow-600 font-semibold">Premium</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Logga ut"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
