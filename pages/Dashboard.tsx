import React from 'react';
import { useStore } from '../services/store';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { tickets, assets } = useStore();

  // Stats
  const openTickets = tickets.filter(t => t.status === 'OPEN').length;
  const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const critical = tickets.filter(t => t.priority === 'CRITICAL' && t.status !== 'CLOSED').length;
  const avgHealth = Math.round(assets.reduce((acc, curr) => acc + curr.healthScore, 0) / assets.length);

  // Chart Data
  const statusData = [
    { name: 'Open', value: openTickets },
    { name: 'In Progress', value: inProgress },
    { name: 'Resolved', value: tickets.filter(t => t.status === 'RESOLVED').length },
    { name: 'Closed', value: tickets.filter(t => t.status === 'CLOSED').length },
  ];

  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#6B7280'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Operational Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time overview of maintenance operations.</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm text-gray-500">System Status</p>
          <p className="text-sm font-medium text-green-600 flex items-center justify-end">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Operational
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Tickets</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{openTickets + inProgress}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Activity size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Critical Issues</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{critical}</p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Asset Health</p>
              <p className={`text-3xl font-bold mt-1 ${avgHealth < 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                {avgHealth}%
              </p>
            </div>
            <div className={`p-3 rounded-lg ${avgHealth < 70 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Resolution</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">4.2h</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Clock size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ticket Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-sm text-gray-600 mt-2">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }}></span>
                {entry.name}: {entry.value}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Workload</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { day: 'Mon', tickets: 12 },
                  { day: 'Tue', tickets: 19 },
                  { day: 'Wed', tickets: 15 },
                  { day: 'Thu', tickets: 22 },
                  { day: 'Fri', tickets: 18 },
                  { day: 'Sat', tickets: 8 },
                  { day: 'Sun', tickets: 5 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} />
                <Bar dataKey="tickets" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;