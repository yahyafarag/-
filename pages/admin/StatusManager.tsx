import React, { useState, useEffect } from 'react';
import { useStore } from '../../services/store';
import { supabase } from '../../services/supabase';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertOctagon, 
  Save, 
  RotateCcw,
  Shield
} from 'lucide-react';

interface StatusConfig {
  key: string; // The DB Enum Value (OPEN, IN_PROGRESS...)
  label: string;
  color: string;
  isTerminal: boolean; // closes ticket?
  allowedRoles: string[]; // Who can move TO this status
  description?: string;
}

const DEFAULT_STATUS_CONFIG: StatusConfig[] = [
  { key: 'OPEN', label: 'مفتوح', color: '#EAB308', isTerminal: false, allowedRoles: ['ADMIN', 'MANAGER'], description: 'بلاغ جديد بانتظار التعيين' },
  { key: 'IN_PROGRESS', label: 'جاري العمل', color: '#3B82F6', isTerminal: false, allowedRoles: ['TECHNICIAN', 'ADMIN'], description: 'الفني يعمل على الإصلاح' },
  { key: 'PENDING_PARTS', label: 'بانتظار قطع', color: '#F97316', isTerminal: false, allowedRoles: ['TECHNICIAN', 'ADMIN'], description: 'العمل متوقف لعدم توفر قطع' },
  { key: 'RESOLVED', label: 'تم الحل', color: '#10B981', isTerminal: true, allowedRoles: ['TECHNICIAN', 'ADMIN'], description: 'تم الإصلاح وبانتظار الإغلاق النهائي' },
  { key: 'CLOSED', label: 'مغلق', color: '#6B7280', isTerminal: true, allowedRoles: ['MANAGER', 'ADMIN'], description: 'تم التحقق والأرشفة' },
];

const StatusManager: React.FC = () => {
  const { user, fetchSystemMetadata } = useStore();
  const [statuses, setStatuses] = useState<StatusConfig[]>(DEFAULT_STATUS_CONFIG);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    // Try to fetch custom config from system_config
    const { data } = await supabase.from('system_config').select('value').eq('key', 'status_metadata').single();
    if (data?.value) {
      setStatuses(data.value);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('system_config').upsert({
      key: 'status_metadata',
      value: statuses
    });
    setLoading(false);
    if (error) {
      alert('فشل الحفظ');
    } else {
      setIsDirty(false);
      alert('تم تحديث سير العمل بنجاح');
      fetchSystemMetadata(); // Refresh global store
    }
  };

  const updateStatus = (index: number, updates: Partial<StatusConfig>) => {
    const newStatuses = [...statuses];
    newStatuses[index] = { ...newStatuses[index], ...updates };
    setStatuses(newStatuses);
    setIsDirty(true);
  };

  const toggleRole = (statusIndex: number, role: string) => {
    const status = statuses[statusIndex];
    const newRoles = status.allowedRoles.includes(role)
      ? status.allowedRoles.filter(r => r !== role)
      : [...status.allowedRoles, role];
    updateStatus(statusIndex, { allowedRoles: newRoles });
  };

  if (user?.role !== 'ADMIN') return <div className="p-10 text-center text-red-500">وصول غير مصرح به</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20 p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة حالات العمل (Workflow)</h1>
          <p className="text-gray-500">تخصيص مسميات الحالات، الألوان، وصلاحيات التغيير.</p>
        </div>
        {isDirty && (
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-md transition-all font-bold animate-pulse-slow"
          >
            <Save size={20} />
            حفظ التغييرات
          </button>
        )}
      </div>

      <div className="space-y-4">
        {statuses.map((status, index) => (
          <div key={status.key} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Icon & Color */}
            <div className="flex flex-col items-center gap-2">
               <input 
                 type="color" 
                 value={status.color}
                 onChange={(e) => updateStatus(index, { color: e.target.value })}
                 className="w-12 h-12 rounded-xl cursor-pointer border-2 border-gray-200 p-1"
               />
               <span className="text-xs font-mono text-gray-400">{status.key}</span>
            </div>

            {/* Details */}
            <div className="flex-1 w-full space-y-4 md:space-y-0 md:grid md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">اسم الحالة (عربي)</label>
                  <input 
                    type="text" 
                    value={status.label}
                    onChange={(e) => updateStatus(index, { label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-gray-800"
                  />
                  <input 
                    type="text" 
                    value={status.description}
                    onChange={(e) => updateStatus(index, { description: e.target.value })}
                    className="w-full mt-2 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500"
                    placeholder="وصف مختصر..."
                  />
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                    <Shield size={12} />
                    الصلاحيات (من يستطيع التحويل لهذه الحالة؟)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['ADMIN', 'MANAGER', 'TECHNICIAN'].map(role => (
                      <button
                        key={role}
                        onClick={() => toggleRole(index, role)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                          status.allowedRoles.includes(role)
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-gray-50 text-gray-400 border-gray-200'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2">
                     <input 
                       type="checkbox" 
                       id={`terminal-${index}`}
                       checked={status.isTerminal}
                       onChange={(e) => updateStatus(index, { isTerminal: e.target.checked })}
                       className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                     />
                     <label htmlFor={`terminal-${index}`} className="text-sm font-medium text-gray-700 select-none">
                       حالة نهائية (تغلق البلاغ)
                     </label>
                  </div>
               </div>
            </div>

            {/* Preview Badge */}
            <div className="hidden md:block min-w-[120px] text-center">
               <span className="block text-xs text-gray-400 mb-2">معاينة</span>
               <span 
                 className="inline-block px-3 py-1 rounded-full text-sm font-bold text-white shadow-sm"
                 style={{ backgroundColor: status.color }}
               >
                 {status.label}
               </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm flex items-start gap-3">
        <AlertOctagon className="shrink-0 mt-0.5" size={18} />
        <p>
          <strong>ملاحظة هامة:</strong> الحالات الأساسية (DB Keys) ثابتة في قاعدة البيانات لضمان سلامة التقارير. يمكنك هنا تخصيص الأسماء والألوان والصلاحيات فقط.
        </p>
      </div>
    </div>
  );
};

export default StatusManager;