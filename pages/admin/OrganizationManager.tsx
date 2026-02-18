
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useStore } from '../../services/store';
import { useConfirm } from '../../components/ConfirmModal';
import { 
  Building2, 
  Map as MapIcon, 
  MapPin, 
  Store, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';

type EntityType = 'BRAND' | 'SECTOR' | 'AREA' | 'BRANCH';

const OrganizationManager: React.FC = () => {
  const { user, showNotification } = useStore();
  const { confirm, ConfirmationDialog } = useConfirm();
  
  const [activeTab, setActiveTab] = useState<EntityType>('BRAND');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [parents, setParents] = useState<any>({ brands: [], sectors: [], areas: [] });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
    fetchParents();
  }, [activeTab]);

  const fetchParents = async () => {
    const { data: brands } = await supabase.from('brands').select('id, name');
    const { data: sectors } = await supabase.from('sectors').select('id, name, brand_id');
    const { data: areas } = await supabase.from('areas').select('id, name, sector_id');
    setParents({ brands: brands || [], sectors: sectors || [], areas: areas || [] });
  };

  const fetchData = async () => {
    setLoading(true);
    let query;
    switch (activeTab) {
      case 'BRAND':
        query = supabase.from('brands').select('*');
        break;
      case 'SECTOR':
        query = supabase.from('sectors').select('*, brands(name)');
        break;
      case 'AREA':
        query = supabase.from('areas').select('*, sectors(name, brands(name))');
        break;
      case 'BRANCH':
        query = supabase.from('branches').select('*, areas(name, sectors(name))');
        break;
    }
    const { data: res } = await query!;
    setData(res || []);
    setLoading(false);
  };

  const handleDelete = (item: any) => {
    confirm({
      title: 'حذف عنصر هيكلي',
      type: 'danger',
      message: (
        <div className="space-y-3">
          <p className="text-gray-600">
            هل أنت متأكد من حذف <strong>{item.name}</strong>؟
          </p>
          <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>تحذير: هذا الإجراء قد يؤدي إلى حذف أو تعطيل السجلات المرتبطة بهذا العنصر (مثل الأصول والبلاغات).</p>
          </div>
        </div>
      ),
      confirmText: 'نعم، حذف نهائي',
      onConfirm: async () => {
        let table = activeTab === 'BRAND' ? 'brands' : activeTab === 'SECTOR' ? 'sectors' : activeTab === 'AREA' ? 'areas' : 'branches';
        const { error } = await supabase.from(table).delete().eq('id', item.id);
        
        if (error) {
          showNotification('error', 'لا يمكن الحذف: يوجد سجلات مرتبطة بهذا العنصر.');
        } else {
          showNotification('success', 'تم الحذف بنجاح');
          fetchData();
        }
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let table = activeTab === 'BRAND' ? 'brands' : activeTab === 'SECTOR' ? 'sectors' : activeTab === 'AREA' ? 'areas' : 'branches';
    
    const payload = { ...formData };
    
    let error;
    if (editingItem) {
      const { error: err } = await supabase.from(table).update(payload).eq('id', editingItem.id);
      error = err;
    } else {
      const { error: err } = await supabase.from(table).insert([payload]);
      error = err;
    }
    
    if (error) {
      showNotification('error', `فشل الحفظ: ${error.message}`);
    } else {
      showNotification('success', 'تم حفظ البيانات بنجاح');
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({});
      fetchData();
    }
  };

  const openModal = (item?: any) => {
    setEditingItem(item || null);
    setFormData(item || {});
    setIsModalOpen(true);
  };

  if (user?.role !== 'ADMIN') return <div className="p-10 text-center text-red-500">وصول غير مصرح به</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الهيكل التنظيمي</h1>
          <p className="text-gray-500">إدارة العلامات التجارية، القطاعات، المناطق، والفروع.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-md transition-all"
        >
          <Plus size={20} />
          إضافة جديد
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('BRAND')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'BRAND' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Building2 size={18} /> العلامات التجارية
        </button>
        <button 
           onClick={() => setActiveTab('SECTOR')}
           className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'SECTOR' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <MapIcon size={18} /> القطاعات
        </button>
        <button 
           onClick={() => setActiveTab('AREA')}
           className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'AREA' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <MapPin size={18} /> المناطق
        </button>
        <button 
           onClick={() => setActiveTab('BRANCH')}
           className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'BRANCH' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Store size={18} /> الفروع
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
             <Loader2 size={32} className="animate-spin mb-2" />
             جاري التحميل...
          </div>
        ) : (
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">الاسم</th>
                {activeTab !== 'BRAND' && <th className="px-6 py-4">يتبع لـ</th>}
                <th className="px-6 py-4">المعرف (ID)</th>
                <th className="px-6 py-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                    {activeTab === 'BRAND' && item.logo_url && (
                      <img src={item.logo_url} className="w-8 h-8 rounded-full border border-gray-200" />
                    )}
                    {item.name}
                  </td>
                  {activeTab !== 'BRAND' && (
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {activeTab === 'SECTOR' && item.brands?.name}
                      {activeTab === 'AREA' && (
                        <span className="flex items-center gap-1">
                          {item.sectors?.name} <ChevronRight size={12} /> {item.sectors?.brands?.name}
                        </span>
                      )}
                      {activeTab === 'BRANCH' && item.areas?.name}
                    </td>
                  )}
                  <td className="px-6 py-4 font-mono text-xs text-gray-400 dir-ltr text-right">{item.id.slice(0, 8)}...</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <button onClick={() => openModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                       <button onClick={() => handleDelete(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">لا توجد بيانات مضافة بعد.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog />

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-900">
                   {editingItem ? 'تعديل' : 'إضافة'} 
                   {activeTab === 'BRAND' ? ' علامة تجارية' : activeTab === 'SECTOR' ? ' قطاع' : activeTab === 'AREA' ? ' منطقة' : ' فرع'}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">الاسم</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name || ''}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                    />
                 </div>

                 {/* Parents Selection */}
                 {activeTab === 'SECTOR' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">البراند</label>
                      <select 
                        required
                        value={formData.brand_id || ''}
                        onChange={e => setFormData({...formData, brand_id: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                      >
                        <option value="">اختر البراند...</option>
                        {parents.brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                 )}

                 {activeTab === 'AREA' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">القطاع</label>
                      <select 
                        required
                        value={formData.sector_id || ''}
                        onChange={e => setFormData({...formData, sector_id: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                      >
                        <option value="">اختر القطاع...</option>
                        {parents.sectors.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                 )}

                 {activeTab === 'BRANCH' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">المنطقة</label>
                      <select 
                        required
                        value={formData.area_id || ''}
                        onChange={e => setFormData({...formData, area_id: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                      >
                        <option value="">اختر المنطقة...</option>
                        {parents.areas.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                 )}

                 <button 
                   type="submit"
                   className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 mt-4"
                 >
                   حفظ البيانات
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManager;
