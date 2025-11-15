"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Eye, Monitor, Smartphone, Tablet, Globe, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ApiResponse } from "@/lib/types";

interface AnalyticsData {
  enabled: boolean;
  analytics?: {
    totalVisits: number;
    uniqueVisitors: number;
    pageViews: number;
    topPages: Array<{ path: string; views: number }>;
    visitsByDay: Array<{ date: string; visits: number }>;
    referrers: Array<{ source: string; visits: number }>;
    devices: {
      desktop: number;
      mobile: number;
      tablet: number;
    };
    lastUpdated: string;
  } | null;
  message?: string;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/analytics?period=${timeRange}`);
        if (response.ok) {
          const data = await response.json() as ApiResponse<AnalyticsData>;
          if (data.success && data.data) {
            setAnalyticsData(data.data);
          }
        }
      } catch (error) {
        console.error('Fel vid hämtning av analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500">Laddar analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData || !analyticsData.enabled) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Tillbaka till dashboard
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Analytics inte aktiverat</h2>
              <p className="text-gray-600">
                {analyticsData?.message || "Aktivera analytics i .env för att se besöksstatistik."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const analytics = analyticsData.analytics;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka till dashboard
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
                <p className="text-gray-600">Besöksstatistik och användarinsikter</p>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as "7d" | "30d" | "90d")}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="7d">Senaste 7 dagarna</option>
                <option value="30d">Senaste 30 dagarna</option>
                <option value="90d">Senaste 90 dagarna</option>
              </select>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Unika besökare</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {analytics ? analytics.uniqueVisitors.toLocaleString('sv-SE') : '0'}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Totalt besök</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {analytics ? analytics.totalVisits.toLocaleString('sv-SE') : '0'}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-5 h-5 text-purple-600" />
                <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Sidvisningar</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {analytics ? analytics.pageViews.toLocaleString('sv-SE') : '0'}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Senast uppdaterad</p>
              </div>
              <p className="text-sm font-medium text-gray-600">
                {analytics ? new Date(analytics.lastUpdated).toLocaleDateString('sv-SE', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Devices */}
          {analytics && analytics.devices && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Enheter</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Monitor className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Desktop</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.devices.desktop.toLocaleString('sv-SE')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Smartphone className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Mobil</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.devices.mobile.toLocaleString('sv-SE')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Tablet className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Surfplatta</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.devices.tablet.toLocaleString('sv-SE')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Pages */}
          {analytics && analytics.topPages && analytics.topPages.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Populäraste sidor</h2>
              <div className="space-y-3">
                {analytics.topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{page.path}</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{page.views.toLocaleString('sv-SE')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referrers */}
          {analytics && analytics.referrers && analytics.referrers.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Traffikkällor</h2>
              <div className="space-y-3">
                {analytics.referrers.map((referrer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">{referrer.source}</span>
                    <span className="text-sm font-bold text-indigo-600">{referrer.visits.toLocaleString('sv-SE')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}

