import React, { useState, useEffect } from 'react';
import { useStore } from '../services/store';
import { FormField } from '../types';
import { Plus, Trash2, GripVertical, Save, Lock, RefreshCw, Map, Clock, Zap } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const { config, ticketSchema, saveSystemConfig, saveTicketSchema, user, isLoading } = useStore();
  const [localConfig, setLocalConfig] = useState(config);
  const [localSchema, setLocalSchema] = useState(ticketSchema);
  const [isDirty, setIsDirty] = useState(false);

  // Sync local state when store updates (e.g. after fetch)
  useEffect(() => {
    setLocalConfig(config);
    setLocalSchema(ticketSchema);
  }, [config, ticketSchema]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Lock size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-semibold">الدخول مقيد</p>
        <p className="text-sm">هذه الصفحة مخصصة لمديري النظام فقط.</p>
      </div>
    );
  }

  const handleConfigChange = (key: keyof typeof config, value: any) => {
    setLocalConfig({ ...localConfig, [key]: value });
    setIsDirty(true);
  };

  const handleAddField = () => {
    const newField: FormField = {
      key: `field_${Date.now()}`,
      label: 'حقل جديد',
      type: 'text',
      required: false
    };
    setLocalSchema({
      ...localSchema,
      fields: [...localSchema.fields, newField]
    });
    setIsDirty(true);
  };

  const handleUpdateField = (index: number, key: keyof FormField, value: any) => {
    const updatedFields = [...localSchema.fields];
    updatedFields[index] = { ...updatedFields[index], [key]: value };
    setLocalSchema({ ...localSchema, fields: updatedFields });
    setIsDirty(true);
  };

  const handleDeleteField = (index: number) => {
    if(window.confirm("هل أنت متأكد من حذف هذا الحقل؟")) {
      const updatedFields = localSchema.fields.filter((_, i) => i !== index);
      setLocalSchema({ ...localSchema, fields: updatedFields });
      setIsDirty(true);
    }
  };

  const saveChanges = async () => {
    await Promise.all([
      saveSystemConfig(localConfig),
      saveTicketSchema(localSchema)
    ]);
    setIsDirty(false);
    alert('تم حفظ إعدادات النظام وتحديث النماذج بنجاح.');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">إعدادات النظام (Sovereign)</h1>
        <p className="text-gray-500 mt-2">التحكم المركزي في قواعد العمل، النطاقات الجغرافية، ونماذج الصيانة.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: System Configurations */}
        <div className="xl:col-span-1 space-y-6">
           
           {/* Geofence & Range */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
               <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                 <Map size={20} />
               </div>
               <h2 className="font-bold text-gray-800">النطاق الجغرافي</h2>
             </div>
             
             <div className="space-y-5">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">النطاق الجغرافي المسموح (متر)</label>
                 <div className="relative">
                   <input 
                    type="number" 
                    value={localConfig.geofenceRadius}
                    onChange={(e) => handleConfigChange('geofenceRadius', parseInt(e.target.value))}
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                   />
                   <span className="absolute left-4 top-2.5 text-gray-400 text-sm font-medium">متر</span>
                 </div>
                 <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">المسافة القصوى المسموحة بين الفني والفرع لفتح تذكرة صيانة.</p>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">نطاق رؤية الفنيين (كم)</label>
                 <div className="relative">
                   <input 
                    type="number" 
                    value={localConfig.technicianRange || 50}
                    onChange={(e) => handleConfigChange('technicianRange', parseInt(e.target.value))}
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                   />
                   <span className="absolute left-4 top-2.5 text-gray-400 text-sm font-medium">كم</span>
                 </div>
                 <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">نطاق البلاغات التي تظهر للفني في قائمته (للبلاغات غير المسندة).</p>
               </div>
             </div>
           </div>

           {/* SLA Settings */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
               <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                 <Clock size={20} />
               </div>
               <h2 className="font-bold text-gray-800">اتفاقية مستوى الخدمة (SLA)</h2>
             </div>
             
             <div className="space-y-4">
                <div className="p-3 rounded-xl border border-red-100 bg-red-50/50">
                   <label className="block text-sm font-bold text-red-800 mb-2">أولوية حرجة / عالية (ساعات)</label>
                   <input 
                    type="number" 
                    value={localConfig.slaHighPriorityHours}
                    onChange={(e) => handleConfigChange('slaHighPriorityHours', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-red-500 focus:border-red-500"
                   />
                </div>

                <div className="p-3 rounded-xl border border-yellow-100 bg-yellow-50/50">
                   <label className="block text-sm font-bold text-yellow-800 mb-2">أولوية متوسطة (ساعات)</label>
                   <input 
                    type="number" 
                    value={localConfig.slaMediumPriorityHours || 24}
                    onChange={(e) => handleConfigChange('slaMediumPriorityHours', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-yellow-200 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                   />
                </div>

                <div className="p-3 rounded-xl border border-green-100 bg-green-50/50">
                   <label className="block text-sm font-bold text-green-800 mb-2">أولوية منخفضة (ساعات)</label>
                   <input 
                    type="number" 
                    value={localConfig.slaLowPriorityHours || 72}
                    onChange={(e) => handleConfigChange('slaLowPriorityHours', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-green-500 focus:border-green-500"
                   />
                </div>
             </div>
           </div>

           {/* AI Toggle */}
           <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white">
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                     <Zap size={18} className="text-yellow-300" />
                     الذكاء الاصطناعي
                   </h3>
                   <p className="text-blue-100 text-sm opacity-90">تفعيل التحليل التلقائي للأعطال.</p>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input 
                      type="checkbox" 
                      name="toggle" 
                      id="toggle" 
                      checked={localConfig.enableAIAnalysis}
                      onChange={(e) => handleConfigChange('enableAIAnalysis', e.target.checked)}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-6 checked:border-green-400"
                      style={{ right: localConfig.enableAIAnalysis ? '0' : 'auto', left: localConfig.enableAIAnalysis ? 'auto' : '0' }}
                    />
                    <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-blue-900 cursor-pointer"></label>
                </div>
             </div>
           </div>
        </div>

        {/* Right Column: Form Builder */}
        <div className="xl:col-span-2">
           <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-100 pb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">محرر النماذج الديناميكية</h2>
                <p className="text-sm text-gray-500 mt-1">تخصيص الحقول التي تظهر للفني عند إغلاق التذكرة أو تشخيصها.</p>
              </div>
              <button 
                onClick={handleAddField}
                className="flex items-center text-sm px-5 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-bold shadow-sm"
              >
                <Plus size={18} className="ml-2" /> إضافة حقل جديد
              </button>
            </div>

            <div className="space-y-4">
              {localSchema.fields.map((field, index) => (
                <div key={index} className="flex flex-col gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200 group hover:border-blue-300 transition-all hover:shadow-md">
                  
                  <div className="flex items-start gap-4">
                      <div className="hidden md:flex items-center justify-center h-8 w-8 text-gray-400 cursor-move hover:text-gray-600 bg-white rounded-lg border border-gray-200 mt-6">
                        <GripVertical size={16} />
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-4">
                            <label className="text-xs font-semibold text-gray-500 block mb-1.5">اسم الحقل (Label)</label>
                            <input 
                              type="text" 
                              value={field.label}
                              onChange={(e) => handleUpdateField(index, 'label', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              placeholder="مثال: قراءة العداد"
                            />
                          </div>
                          
                          <div className="md:col-span-3">
                            <label className="text-xs font-semibold text-gray-500 block mb-1.5">المفتاح (DB Key)</label>
                            <input 
                              type="text" 
                              value={field.key}
                              onChange={(e) => handleUpdateField(index, 'key', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono text-xs bg-white text-gray-600 dir-ltr text-right"
                              placeholder="field_key"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className="text-xs font-semibold text-gray-500 block mb-1.5">نوع المدخل</label>
                            <select 
                              value={field.type}
                              onChange={(e) => handleUpdateField(index, 'type', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                            >
                              <option value="text">نص (Text)</option>
                              <option value="number">رقم (Number)</option>
                              <option value="checkbox">مربع اختيار (Check)</option>
                              <option value="select">قائمة منسدلة (Select)</option>
                              <option value="textarea">نص طويل (Area)</option>
                              <option value="date">تاريخ (Date)</option>
                            </select>
                          </div>

                          <div className="md:col-span-2 flex items-end pb-2 justify-end">
                              <button 
                                onClick={() => handleDeleteField(index)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="حذف الحقل"
                              >
                                <Trash2 size={18} />
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* Extended Options row */}
                  <div className="pl-0 md:pl-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                     {field.type === 'select' && (
                       <div>
                         <label className="text-xs font-semibold text-gray-500 block mb-1.5">الخيارات (مفصولة بفاصلة)</label>
                         <input
                           type="text"
                           placeholder="مثال: جيد, متوسط, تالف"
                           value={field.options?.join(',') || ''}
                           onChange={(e) => handleUpdateField(index, 'options', e.target.value.split(','))}
                           className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                         />
                       </div>
                     )}
                     <div className="flex items-center pt-2">
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              checked={field.required}
                              onChange={(e) => handleUpdateField(index, 'required', e.target.checked)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${field.required ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${field.required ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                          <span className="mr-3 text-sm font-medium text-gray-600">هذا الحقل إلزامي</span>
                        </label>
                     </div>
                  </div>
                </div>
              ))}
              
              {localSchema.fields.length === 0 && (
                <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3 text-gray-400">
                    <Plus size={24} />
                  </div>
                  <p>لا توجد حقول معرفة حالياً.</p>
                  <button onClick={handleAddField} className="text-blue-600 hover:underline mt-2 text-sm">أضف الحقل الأول</button>
                </div>
              )}
            </div>
           </div>
        </div>
      </div>

      {/* Floating Save Button */}
      {isDirty && (
        <div className="fixed bottom-6 left-6 z-10 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <button 
            onClick={saveChanges}
            disabled={isLoading}
            className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-full shadow-xl hover:bg-green-700 hover:scale-105 transition-all disabled:opacity-70 disabled:scale-100 font-bold text-lg"
          >
            {isLoading ? (
               <RefreshCw size={22} className="animate-spin" />
            ) : (
               <Save size={22} />
            )}
            {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;