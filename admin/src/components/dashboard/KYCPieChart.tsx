import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface KYCPieChartProps {
  data: any[];
}

export const KYCPieChart: React.FC<KYCPieChartProps> = ({ data }) => {
  // Format and aggregate data to match standard KYC statuses if needed
  // Handle empty or missing cases
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-500">No KYC data available.</p>
      </div>
    );
  }

  const COLORS: Record<string, string> = {
    'approved': '#10b981', // green
    'pending': '#f59e0b',  // amber
    'rejected': '#ef4444', // red
    'not_submitted': '#9ca3af', // gray
    'submitted': '#3b82f6', // blue
    'resubmit_required': '#f97316', // orange
    'under_review': '#8b5cf6' // purple
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: data.fill }}
          ></div>
          <div>
            <p className="text-sm text-gray-500 capitalize">{data.name.replace('_', ' ')}</p>
            <p className="font-bold text-gray-900">{data.value} Users</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for very small slices

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="h-[350px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={110}
            innerRadius={60}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.name] || '#CBD5E1'} 
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            layout="horizontal" 
            verticalAlign="bottom" 
            align="center"
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span className="text-sm text-gray-600 capitalize">{value.replace('_', ' ')}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center Label (Optional) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
        <span className="text-sm text-gray-500 font-medium">Total DB</span>
        <span className="text-2xl font-bold text-gray-900">
          {data.reduce((sum, item) => sum + item.value, 0)}
        </span>
      </div>
    </div>
  );
};
