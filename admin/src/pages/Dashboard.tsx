// src/pages/Dashboard.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  FileCheck, 
  Lock, 
  CheckCircle2, 
  DollarSign, 
  Headphones,
  Activity,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { useGetAnalyticsDashboardStatsQuery } from '../store/api/adminApi';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Card } from '../components/common/Card';
import { RevenueLineChart } from '../components/dashboard/RevenueLineChart';
import { VolumeBarChart } from '../components/dashboard/VolumeBarChart';
import { KYCPieChart } from '../components/dashboard/KYCPieChart';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon: Icon, color }) => {
  const bgColor = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
    indigo: 'bg-indigo-50 border-indigo-200',
  }[color] || 'bg-gray-50 border-gray-200';

  const textColor = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
  }[color];

  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 ${bgColor} p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bgColor.replace('50', '100')} ${textColor}`}>
          <Icon className="w-7 h-7" />
        </div>
        {change && (
          <div className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
            {change}
          </div>
        )}
      </div>
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('7days');
  const { data: response, isLoading, error } = useGetAnalyticsDashboardStatsQuery({ range: timeRange });

  if (isLoading) {
    return <LoadingSpinner text="Loading platform stats..." />;
  }

  if (error || !response?.data) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-xl text-gray-600">Failed to load dashboard data</p>
      </div>
    );
  }

  const { series, summary } = response.data;

  return (
    <div className="space-y-8">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2 text-lg">Real-time platform statistics and performance</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Time Range Filter */}
          <div className="relative flex-1 md:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="block w-full pl-10 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl border border-gray-200 bg-white shadow-sm appearance-none cursor-pointer"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="allTime">All Time</option>
            </select>
          </div>
          
          <div className="hidden md:flex items-center gap-3 bg-green-50 text-green-700 px-6 py-3 rounded-xl border-2 border-green-200">
            <ShieldCheck className="w-6 h-6" />
            <div>
              <p className="text-sm font-medium">System Status</p>
              <p className="font-bold">Operational</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Trade Volume"
          value={`₹${(summary?.totalVolume || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Platform Revenue"
          value={`₹${(summary?.totalRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={DollarSign}
          color="indigo"
        />
        <StatCard
          title="New Users"
          value={(summary?.newUsers || 0).toLocaleString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Trades"
          value={series?.volumeAndRevenue?.reduce((sum: number, item: any) => sum + (item.tradesCount || 0), 0).toLocaleString() || '0'}
          icon={CheckCircle2}
          color="green"
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="flex flex-col col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 border-l-4 border-indigo-500 pl-3">
              Platform Revenue
            </h3>
          </div>
          <div className="flex-1">
            <RevenueLineChart data={series?.volumeAndRevenue || []} />
          </div>
        </Card>

        <Card className="flex flex-col col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 border-l-4 border-emerald-500 pl-3">
              Trade Volume
            </h3>
          </div>
          <div className="flex-1">
            <VolumeBarChart data={series?.volumeAndRevenue || []} />
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KYC Distribution Chart */}
        <Card className="lg:col-span-1 flex flex-col h-full">
          <h3 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-purple-500 pl-3">
            KYC Status Distribution
          </h3>
          <div className="flex-1 flex w-full">
            <KYCPieChart data={series?.kyc || []} />
          </div>
        </Card>

        {/* Quick Actions Placeholder */}
        <Card className="lg:col-span-2">
          <h3 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-blue-500 pl-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/kyc')}
              className="col-span-1 p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition text-center group flex flex-col items-center justify-center"
            >
              <FileCheck className="w-8 h-8 text-indigo-600 mb-3 group-hover:scale-110 transition" />
              <span className="text-sm font-semibold text-gray-700">Review KYCs</span>
            </button>
            <button 
              onClick={() => navigate('/disputes')}
              className="col-span-1 p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-red-500 hover:bg-red-50 transition text-center group flex flex-col items-center justify-center"
            >
              <AlertCircle className="w-8 h-8 text-red-600 mb-3 group-hover:scale-110 transition" />
              <span className="text-sm font-semibold text-gray-700">Resolve Disputes</span>
            </button>
            <button 
              onClick={() => navigate('/escrow')}
              className="col-span-1 p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition text-center group flex flex-col items-center justify-center"
            >
              <Lock className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition" />
              <span className="text-sm font-semibold text-gray-700">Manage Escrow</span>
            </button>
            <button 
              onClick={() => navigate('/users')}
              className="col-span-1 p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-green-500 hover:bg-green-50 transition text-center group flex flex-col items-center justify-center"
            >
              <Users className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition" />
              <span className="text-sm font-semibold text-gray-700">View Users</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};