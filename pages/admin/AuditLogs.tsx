import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useStore } from '../../services/store';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  RefreshCw, 
  Trash2, 
  Edit, 
  Eye, 
  LogIn
} from 'lucide-react';

const AuditLogs: React.FC = () => {
  const { user } = useStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    // Join with profiles to get user names
    const { data } = await supabase
      .from('audit_logs')
      .select('*, profiles(full_name, role)')
      .order('created_at', { ascending: false })
      .limit(100);
    
    setLogs(data || []);
    setLoading(false);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('DELETE')) return <Trash2 size={16} />;
    if (action.includes('UPDATE')) return <Edit size={16} />;
    if (action.includes('LOGIN')) return <LogIn size={16} />;
    return <Eye size={16} />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700';
    if (action.includes('UPDATE')) return 'bg-orange-100 text-orange-700';
    if (action.includes('STATUS')) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const filteredLogs = logs.filter(log => filter === 'ALL' || log.action.includes(filter));

  if (user?.role !== 'ADMIN') return <div className="p-10 text-center text-red-500">وصول غير مصرح به</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldAlert className="text-red-600" />
            سجل العمليات (Audit Log)
          </h1>
          <p className="text-gray-500">سجل غير قابل للتعديل لجميع العمليات الحساسة في النظام.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="تحديث"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
         <Filter size={20} className="text-gray-400" />
         <div className="flex gap-2">
            {['ALL', 'DELETE', 'UPDATE', 'STATUS', 'LOGIN'].map(f => (
               <button
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                   filter === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                 }`}
               >
                 {f === 'ALL' ? 'الكل' : f}
               </button>
            ))}
         </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
               <tr>
                  <th className="px-6 py-4">العملية</th>
                  <th className="px-6 py-4">المستخدم</th>
                  <th className="px-6 py-4">المورد المستهدف</th>
                  <th className="px-6 py-4">التفاصيل</th>
                  <th className="px-6 py-4 text-left">التوقيت</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {filteredLogs.map(log => (
                 <tr key={log.id} className="hover:bg-gray-50/50 transition-colors font-mono">
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-bold ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                          {log.action}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                       <div className="font-bold">{log.profiles?.full_name || 'System'}</div>
                       <div className="text-[10px] text-gray-400">{log.profiles?.role}</div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 text-xs">
                          {log.target_resource} #{log.target_id?.slice(0, 5)}
                       </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-gray-500" title={JSON.stringify(log.details)}>
                       {JSON.stringify(log.details)}
                    </td>
                    <td className="px-6 py-4 text-left text-gray-400 dir-ltr">
                       {new Date(log.created_at).toLocaleString('en-US')}
                    </td>
                 </tr>
               ))}
               {filteredLogs.length === 0 && (
                  <tr>
                     <td colSpan={5} className="p-8 text-center text-gray-400">لا توجد سجلات مطابقة.</td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default AuditLogs;