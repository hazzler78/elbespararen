"use client";

import { useAuth } from "@/hooks/useAuth";
import { User, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded-full w-10 h-10"></div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/auth/signin"
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        <User className="w-4 h-4" />
        Logga in
      </Link>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      {user.user_metadata?.avatar_url ? (
        <img
          src={user.user_metadata.avatar_url}
          alt={user.user_metadata?.full_name || user.email || "User"}
          className="w-10 h-10 rounded-full"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
      <div className="hidden sm:block">
        <p className="text-sm font-medium text-gray-900">
          {user.user_metadata?.full_name || user.email}
        </p>
      </div>
      <button
        onClick={handleSignOut}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Logga ut"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
