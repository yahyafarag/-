import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useStore } from '../../services/store';
import { Shield, Check, X, Lock, Save, Loader2, AlertTriangle } from 'lucide-react';
import { Role } from '../../types';

const PERMISSION_KEYS = [
  { key: 'ticket.delete', label: 'حذف البلاغات', category: 'البلاغات' },
  { key: 'ticket.view_cost', label: 'عرض التكاليف المالية', category: 'البلاغات' },
  { key: 'ticket.edit_closed', label: 'تعديل البلاغات المغلقة', category: 'البلاغات' },
  { key: 'inventory.manage', label: 'تعديل رصيد المخزون', category: 'المخزون' },
  { key: 'inventory.view_price', label: 'عرض أسعار الشراء', category: 'المخزون' },
  { key: 'assets.delete', label: 'حذف الأصول', category: 'الأصول' },
  { key: 'reports.export', label: 'تصدير التقارير (Excel)', category: 'عام' },
  { key: 'users.manage', label: 'إدارة المستخدمين', category: 'الإدارة' },
  { key: 'settings.manage', label: 'تغيير إعدادات النظام', category: 'الإدارة' },
];

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'TECHNICIAN'];

const PermissionManager: React.FC = () => {
  const { fetchSystemMetadata } = useStore();
  const [matrix, setMatrix] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    const { data } = await supabase.from('role_permissions').select('*');
    if (data) {
      const map: Record<string, boolean> = {};
      data.forEach(row => {
        map[`${row.role}:${row.permission_key}`] = row.is_allowed;
      });
      setMatrix(map);
    }
    setLoading(false);
  };

  const togglePermission = (role: Role, key: string) => {
    // FAILSAFE: Prevent Admin from locking themselves out of critical features
    if (role === 'ADMIN' && (key === 'users.manage' || key === 'settings.manage')) {
      alert("⚠️ إجراء أمني: لا يمكن إلغاء هذه الصلاحية عن المدير العام لضمان سلامة النظام.");
      return;
    }

    const matrixKey = `${role}:${key}`;
    setMatrix(prev => ({
      ...prev,
      [matrixKey]: !prev[matrixKey]
    }));
  };

  const saveChanges = async () => {
    setSaving(true);
    const upserts = [];
    
    for (const role of ROLES) {
      for (const perm of PERMISSION_KEYS) {
        const matrixKey = `${role}:${perm.key}`;
        // Only save explicitly defined values, default false
        const isAllowed = matrix[matrixKey] || false;
        upserts.push({
          role,
          permission_key: perm.key,
          is_allowed: isAllowed
        });
      }
    }

    const { error } = await supabase.from('role_permissions').upsert(upserts, { onConflict: 'role,permission_key' });
    
    if (error) {
      alert("فشل حفظ الصلاحيات: " + error.message);
    } else {
      await fetchSystemMetadata(); // Update global store
      alert("تم تحديث مصفوفة الصلاحيات بنجاح ✅");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-blue-600" />
            مصفوفة الصلاحيات (Permission Matrix)
          </h1>
          <p className="text-gray-500 mt-1">التحكم المركزي في صلاحيات الوصول لكل دور وظيفي.</p>
        </div>
        <button 
          onClick={saveChanges}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg transition-all font-bold disabled:opacity-70"
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          حفظ التغييرات
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
             <Loader2 size={32} className="animate-spin mb-3 text-blue-500" />
             جاري تحميل المصفوفة...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-900 text-white text-sm">
                <tr>
                  <th className="px-6 py-4 w-1/3">الصلاحية / الميزة</th>
                  {ROLES.map(role => (
                    <th key={role} className="px-6 py-4 text-center w-1/6">
                      {role === 'ADMIN' ? 'Admin' : role === 'MANAGER' ? 'Manager' : 'Technician'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {PERMISSION_KEYS.map((perm) => (
                  <tr key={perm.key} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{perm.label}</div>
                      <div className="text-xs text-gray-400 font-mono mt-1 bg-gray-100 inline-block px-1.5 py-0.5 rounded">{perm.key}</div>
                    </td>
                    {ROLES.map(role => {
                      const isAllowed = matrix[`${role}:${perm.key}`];
                      const isLocked = role === 'ADMIN' && (perm.key === 'users.manage' || perm.key === 'settings.manage');
                      
                      return (
                        <td key={role} className="px-6 py-4 text-center bg-gray-50/30">
                          <button
                            onClick={() => togglePermission(role, perm.key)}
                            disabled={isLocked}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all mx-auto duration-200 border ${
                              isLocked 
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : isAllowed 
                                  ? 'bg-green-100 text-green-600 border-green-200 hover:scale-110 shadow-sm' 
                                  : 'bg-white text-gray-300 border-gray-200 hover:border-red-300 hover:text-red-300'
                            }`}
                          >
                            {isLocked ? <Lock size={18} /> : isAllowed ? <Check size={24} className="stroke-[3]" /> : <X size={20} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-800">
         <AlertTriangle className="shrink-0" />
         <div className="text-sm">
            <strong>تنبيه هام:</strong> إزالة صلاحية <code>ticket.view_cost</code> ستخفي جميع الأسعار والتكاليف المالية من واجهة المستخدم لهذا الدور فوراً.
         </div>
      </div>
    </div>
  );
};

export default PermissionManager;