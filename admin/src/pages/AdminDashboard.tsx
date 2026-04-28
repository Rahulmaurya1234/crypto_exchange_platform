import { useState, useMemo } from "react";
import {
    Loader2,
    Users,
    FileCheck,
    Shield,
    TrendingUp,
    Clock,
    RefreshCw,
    Activity,
    DollarSign,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { 
    useGetPlatformOverviewQuery, 
    useGetAnalyticsDashboardStatsQuery, 
    useGetAdminNotificationsQuery 
} from "../store/api/adminApi";
import { RevenueLineChart } from "../components/dashboard/RevenueLineChart";
import { VolumeBarChart } from "../components/dashboard/VolumeBarChart";
import { KYCPieChart } from "../components/dashboard/KYCPieChart";
import { Card } from "../components/common/Card";

export default function AdminDashboardUI() {
    const [timeRange, setTimeRange] = useState('7days');
    
    // Fetch real data
    const { 
        data: overviewData, 
        isLoading: isLoadingOverview, 
        refetch: refetchOverview 
    } = useGetPlatformOverviewQuery();
    
    const { 
        data: analyticsData, 
        isLoading: isLoadingAnalytics, 
        refetch: refetchAnalytics 
    } = useGetAnalyticsDashboardStatsQuery({ range: timeRange });
    
    const { 
        data: activityData, 
        isLoading: isLoadingActivity, 
        refetch: refetchActivity 
    } = useGetAdminNotificationsQuery({ page: 1, limit: 10 });

    const handleRefresh = () => {
        refetchOverview();
        refetchAnalytics();
        refetchActivity();
    };

    const isLoading = isLoadingOverview || isLoadingAnalytics || isLoadingActivity;
    const overview = overviewData?.data?.overview;
    const analytics = analyticsData?.data;
    const notifications = activityData?.data?.notifications || [];

    const statsCards = useMemo(() => [
        {
            title: "Total Volume",
            value: `₹${(analytics?.summary?.totalVolume || 0).toLocaleString()}`,
            change: "+12.5%",
            trend: "up",
            icon: TrendingUp,
            color: "green",
            description: "Settled trade volume"
        },
        {
            title: "Platform Revenue",
            value: `₹${(analytics?.summary?.totalRevenue || 0).toLocaleString()}`,
            change: "+8.2%",
            trend: "up",
            icon: DollarSign,
            color: "indigo",
            description: "Accumulated fees"
        },
        {
            title: "Active Users",
            value: (overview?.users?.active || 0).toLocaleString(),
            change: "+5.1%",
            trend: "up",
            icon: Users,
            color: "blue",
            description: "Currently active accounts"
        },
        {
            title: "KYC Pending",
            value: (overview?.kyc?.pending || 0).toLocaleString(),
            change: "-2.4%",
            trend: "down",
            icon: FileCheck,
            color: "yellow",
            description: "Verifications in queue"
        }
    ], [overview, analytics]);

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <p className="text-gray-500 font-medium animate-pulse">Synchronizing platform data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Intelligence</span>
                    </h1>
                    <p className="text-gray-500 text-lg mt-2">Real-time metrics and operational oversight</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                        {['7days', '30days', 'allTime'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                                    timeRange === range 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {range === '7days' ? '1W' : range === '30days' ? '1M' : 'ALL'}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={handleRefresh}
                        className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Premium KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, idx) => (
                    <Card key={idx} className="relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-500`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-bold ${stat.trend === 'up' ? 'text-green-600' : 'text-amber-600'}`}>
                                    {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    {stat.change}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{stat.title}</h3>
                                <p className="text-3xl font-black text-gray-900 mt-1">{stat.value}</p>
                                <p className="text-gray-400 text-xs mt-2">{stat.description}</p>
                            </div>
                        </div>
                        <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-${stat.color}-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </Card>
                ))}
            </div>

            {/* Main Charts Architecture */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Revenue Performance</h3>
                            <p className="text-gray-400 text-sm">Platform earnings over time</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                                <span className="w-3 h-3 rounded-full bg-indigo-500" /> Revenue
                            </span>
                        </div>
                    </div>
                    <div className="h-[350px]">
                        <RevenueLineChart data={analytics?.series?.volumeAndRevenue || []} />
                    </div>
                </Card>

                <Card className="p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">KYC Distribution</h3>
                    <p className="text-gray-400 text-sm mb-8">Identity verification status</p>
                    <div className="h-[350px]">
                        <KYCPieChart data={analytics?.series?.kyc || []} />
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Card className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Trade Dynamics</h3>
                            <p className="text-gray-400 text-sm">Daily volume fluctuations</p>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <VolumeBarChart data={analytics?.series?.volumeAndRevenue || []} />
                    </div>
                </Card>

                {/* Activity Flux */}
                <Card className="overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">System Activity</h3>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase">Live Feed</span>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-gray-50">
                        {notifications.length > 0 ? (
                            notifications.map((item: any) => (
                                <div key={item._id} className="p-5 hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 p-2 rounded-xl scale-90 group-hover:scale-100 transition-transform ${
                                            item.type === 'dispute' ? 'bg-red-50 text-red-600' :
                                            item.type === 'kyc' ? 'bg-amber-50 text-amber-600' :
                                            'bg-blue-50 text-blue-600'
                                        }`}>
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-2 font-semibold uppercase tracking-widest flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(item.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-sm font-medium">No recent signals found</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
