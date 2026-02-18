import React, { useState, useEffect } from 'react';
import { useStore } from '../../services/store';
import { supabase } from '../../services/supabase';
import { 
  Map, 
  Users, 
  Clock, 
  Power, 
  Save, 
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { SystemConfig } from '../../types';

const SystemSettings: React.FC = () => {
  const { config, fetchSystemMetadata, user } = useStore();
  const [localConfig, setLocalConfig] = useState<SystemConfig>(config);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleChange = (key: keyof SystemConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    
    // Transform object to array of key-values for DB
    const updates = Object.entries(localConfig).map(([key, value]) => ({
      key,
      value
    }));

    const { error } = await supabase.from('system_config').upsert(updates);
    
    if (error) {
      alert('فشل حفظ الإعدادات');
    } else {
      await fetchSystemMetadata(); // Refresh store
      setHasChanges(false);
      alert('تم حفظ إعدادات النظام بنجاح');
    }
    setLoading(false);
  };

  if (user?.role !== 'ADMIN') return <div className="p-10 text-center text-red-500">وصول غير مصرح به</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إعدادات النظام العامة</h1>
          <p className="text-gray-500">التحكم في المنطق الأساسي للتطبيق.</p>
        </div>
        {hasChanges && (
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg transition-all font-bold animate-in fade-in"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save />}
            حفظ التغييرات
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Geofencing */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <Map size={24} />
            <h2 className="font-bold text-lg text-gray-800">النطاق الجغرافي (Geofence)</h2>
          </div>
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نصف قطر السياج (متر)</label>
                <input 
                  type="number"
                  value={localConfig.geofenceRadius}
                  onChange={(e) => handleChange('geofenceRadius', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                />
                <p className="text-xs text-gray-400 mt-1">المسافة القصوى المسموحة للفني لإتمام المهمة في الموقع.</p>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نطاق رؤية الفني (كم)</label>
                <input 
                  type="number"
                  value={localConfig.technicianRange}
                  onChange={(e) => handleChange('technicianRange', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                />
                <p className="text-xs text-gray-400 mt-1">يظهر للفني البلاغات غير المسندة ضمن هذا النطاق فقط.</p>
             </div>
          </div>
        </div>

        {/* Workload & SLA */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4 text-orange-600">
            <Clock size={24} />
            <h2 className="font-bold text-lg text-gray-800">قواعد العمل & SLA</h2>
          </div>
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى للبلاغات النشطة للفني</label>
                <div className="relative">
                  <input 
                    type="number"
                    // Adding a default if not in config type yet, assuming config handles any key
                    value={(localConfig as any).maxActiveTickets || 5}
                    onChange={(e) => handleChange('maxActiveTickets' as any, parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-mono text-lg pl-12"
                  />
                  <Users className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تنبيه التأخير (ساعات)</label>
                <input 
                  type="number"
                  value={localConfig.slaHighPriorityHours}
                  onChange={(e) => handleChange('slaHighPriorityHours', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-mono text-lg"
                />
                <p className="text-xs text-gray-400 mt-1">يتم تعليم البلاغ كـ "متأخر" إذا تجاوز هذا الوقت دون حل.</p>
             </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="md:col-span-2 bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center justify-between">
           <div className="flex gap-4">
              <div className="bg-red-100 p-3 rounded-full h-fit text-red-600">
                 <Power size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-lg text-red-900">وضع الصيانة (System Maintenance)</h3>
                 <p className="text-sm text-red-700 max-w-lg">
                    عند التفعيل، سيتوقف النظام عن استقبال بلاغات جديدة. يستخدم هذا الوضع عند إجراء تحديثات أو جرد سنوي.
                 </p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <span className={`font-bold text-sm ${localConfig.maintenanceMode ? 'text-red-600' : 'text-gray-500'}`}>
                 {localConfig.maintenanceMode ? 'مفعل' : 'معطل'}
              </span>
              <button 
                onClick={() => handleChange('maintenanceMode', !localConfig.maintenanceMode)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                   localConfig.maintenanceMode ? 'bg-red-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                   localConfig.maintenanceMode ? 'translate-x-1' : 'translate-x-7'
                }`} />
              </button>
           </div>
        </div>

        {/* AI Settings */}
        <div className="md:col-span-2 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-md text-white">
           <div className="flex justify-between items-center">
              <div>
                 <h3 className="font-bold text-xl mb-1">الذكاء الاصطناعي (Gemini AI)</h3>
                 <p className="text-indigo-100 opacity-80 text-sm">تحليل تلقائي للأعطال واقتراح الحلول للفنيين.</p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                 <span className="font-bold text-sm">الحالة:</span>
                 <button 
                   onClick={() => handleChange('enableAIAnalysis', !config.enableAIAnalysis)}
                   className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                     config.enableAIAnalysis ? 'bg-green-400 text-green-900 shadow' : 'bg-gray-400/50 text-white'
                   }`}
                 >
                   {config.enableAIAnalysis ? 'نشط ON' : 'متوقف OFF'}
                 </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SystemSettings;