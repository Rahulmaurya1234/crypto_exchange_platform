import { Users, CheckCircle, Clock, XCircle, ShieldCheck, Shield } from 'lucide-react';

const UserStatsCards = ({ stats }: { stats: any }) => {
  const cards = [
    { label: 'Total Users', value: stats.total, icon: Users, color: 'indigo' },
    { label: 'Active', value: stats.active, icon: CheckCircle, color: 'green' },
    { label: 'Suspended', value: stats.suspended, icon: Clock, color: 'yellow' },
    { label: 'Banned', value: stats.banned, icon: XCircle, color: 'red' },
    { label: 'Instant Sellers', value: stats.instantSellers, icon: ShieldCheck, color: 'emerald' },
    { label: 'KYC Approved', value: stats.kycApproved, icon: Shield, color: 'blue' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">{label}</p>
              <p className={`text-2xl font-bold mt-1 text-${color}-600`}>{value}</p>
            </div>
            <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex-center`}>
              <Icon className={`w-6 h-6 text-${color}-600`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserStatsCards;