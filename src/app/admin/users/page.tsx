"use client";

import { useState, useEffect } from "react";
import { Users, Crown, User, Search, Download, Filter } from "lucide-react";
import { ApiResponse } from "@/lib/types";

interface UserWithPremium {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: 'free' | 'premium';
  subscriptionStatus: string | null;
  subscriptionStartedAt: string | null;
  subscriptionExpiresAt: string | null;
  subscriptionStripeId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface UsersData {
  stats: {
    total: number;
    premium: number;
    free: number;
    activePremium: number;
  };
  users: UserWithPremium[];
}

export default function AdminUsersPage() {
  const [usersData, setUsersData] = useState<UsersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'premium' | 'free'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const data = await response.json() as ApiResponse<UsersData>;
          if (data.success && data.data) {
            setUsersData(data.data);
          } else {
            console.error('Failed to fetch users:', data.error);
          }
        } else {
          console.error('Failed to fetch users:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = usersData?.users.filter(user => {
    // Filter by tier
    if (filter === 'premium' && user.subscriptionTier !== 'premium') return false;
    if (filter === 'free' && user.subscriptionTier !== 'free') return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.email.toLowerCase().includes(searchLower) ||
        (user.name && user.name.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  }) || [];

  const exportToCSV = () => {
    if (!usersData) return;
    
    const headers = ['Email', 'Namn', 'Premium', 'Status', 'Startad', 'Utgår', 'Skapad'];
    const rows = filteredUsers.map(user => [
      user.email,
      user.name || '',
      user.subscriptionTier === 'premium' ? 'Ja' : 'Nej',
      user.subscriptionStatus || '',
      user.subscriptionStartedAt ? new Date(user.subscriptionStartedAt).toLocaleDateString('sv-SE') : '',
      user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString('sv-SE') : '',
      user.createdAt ? new Date(user.createdAt).toLocaleDateString('sv-SE') : '',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `anvandare_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Laddar användare...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Användare & Premium</h1>
                <p className="text-gray-600">Översikt över alla användare och deras premium-status</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {usersData && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Totalt användare</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{usersData.stats.total}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Premium</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{usersData.stats.premium}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {usersData.stats.total > 0 
                    ? `${((usersData.stats.premium / usersData.stats.total) * 100).toFixed(1)}% av totalt`
                    : '0%'}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Gratis</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{usersData.stats.free}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="w-5 h-5 text-green-600" />
                  <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Aktiv Premium</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{usersData.stats.activePremium}</p>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Sök efter e-post eller namn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter buttons */}
              <div className="flex gap-2">
                {(['all', 'premium', 'free'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`
                      px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2
                      ${filter === f 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }
                    `}
                  >
                    <Filter className="w-4 h-4" />
                    {f === 'all' ? 'Alla' : f === 'premium' ? 'Premium' : 'Gratis'}
                  </button>
                ))}
              </div>

              {/* Export button */}
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Download className="w-4 h-4" />
                Exportera CSV
              </button>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg border border-gray-200">
            {filteredUsers.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  {searchTerm ? 'Inga användare matchar din sökning' : 'Inga användare hittades'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        E-post
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Namn
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Premium
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Startad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utgår
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Skapad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => {
                      const isPremium = user.subscriptionTier === 'premium';
                      const isActive = user.subscriptionStatus === 'active';
                      const expiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
                      const isExpired = expiresAt && expiresAt < new Date();
                      
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 break-all">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {user.name || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isPremium ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Crown className="w-3 h-3 mr-1" />
                                Premium
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Gratis
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isPremium ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isActive && !isExpired
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {isActive && !isExpired ? 'Aktiv' : isExpired ? 'Utgången' : 'Inaktiv'}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {user.subscriptionStartedAt 
                              ? new Date(user.subscriptionStartedAt).toLocaleDateString('sv-SE')
                              : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {expiresAt 
                              ? (
                                <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                                  {expiresAt.toLocaleDateString('sv-SE')}
                                </span>
                              )
                              : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {user.createdAt 
                              ? new Date(user.createdAt).toLocaleDateString('sv-SE')
                              : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 text-center">
              💡 <strong>Tips:</strong> Premium-användare betalar 99 kr/år för obegränsad historik, export-funktioner och avancerad analys.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
