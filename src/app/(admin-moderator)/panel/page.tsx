'use client';

import {
  BarChart3,
  CheckCircle,
  FileCheck,
  Flag,
  Megaphone,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import Link from 'next/link';

const ModeratorDashboard = () => {
  const tabs = [
    {
      id: 'verification-requests',
      title: 'Verification Requests',
      description: 'Review user identity verification documents and approve or decline requests',
      icon: <FileCheck className="h-6 w-6" />,
      href: '/panel/verification-requests',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      id: 'ad-moderation',
      title: 'Ad Moderation',
      description: 'Review, approve, reject ads across all categories',
      icon: <CheckCircle className="h-6 w-6" />,
      href: '/panel/ads',
      color: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      id: 'reports',
      title: 'Reports & Complaints',
      description: 'Handle user reports about content and users',
      icon: <Flag className="h-6 w-6" />,
      href: '/panel/reports',
      color: 'bg-red-50 text-red-600 border-red-200',
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage users, roles, and restrictions',
      icon: <Users className="h-6 w-6" />,
      href: '/panel/users',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'Create and manage system-wide announcements',
      icon: <Megaphone className="h-6 w-6" />,
      href: '/panel/announcements',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Platform statistics and insights',
      icon: <BarChart3 className="h-6 w-6" />,
      href: '/panel/analytics',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Moderator tools configuration',
      icon: <Settings className="h-6 w-6" />,
      href: '/panel/settings',
      color: 'bg-gray-50 text-gray-600 border-gray-200',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Moderator Panel</h1>
          </div>
          <p className="text-lg text-gray-600">
            Manage verification requests, moderate content, and oversee platform operations
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tabs.map((tab) => (
            <Link key={tab.id} href={tab.href} className="block group">
              <div
                className={`
                p-6 rounded-lg border-2 transition-all duration-200
                hover:shadow-lg hover:scale-105 hover:-translate-y-1
                ${tab.color}
              `}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{tab.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-2 group-hover:underline">
                      {tab.title}
                    </h3>
                    <p className="text-sm opacity-80">{tab.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">-</div>
              <div className="text-sm text-gray-600">Pending Verifications</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">-</div>
              <div className="text-sm text-gray-600">Pending Ads</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">-</div>
              <div className="text-sm text-gray-600">Open Reports</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">-</div>
              <div className="text-sm text-gray-600">Processed Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeratorDashboard;
