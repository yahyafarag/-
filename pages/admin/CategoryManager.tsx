
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useStore } from '../../services/store';
import { 
  Tags, 
  Truck, 
  Wrench, 
  Plus, 
  X, 
  Save, 
  Trash2,
  Loader2
} from 'lucide-react';

type ListType = 'asset_categories' | 'part_categories' | 'suppliers';

const CategoryManager: React.FC = () => {
  const { user, fetchSystemMetadata } = useStore();
  const [activeList, setActiveList] = useState<ListType>('asset_categories');
  const [lists, setLists] = useState<Record<ListType, string[]>>({
    asset_categories: [],
    part_categories: [],
    suppliers: []
  });
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    setLoading(true);
    const { data } = await supabase.from('system_config').select('key, value').in('key', ['list_asset_categories', 'list_part_categories', 'list_suppliers']);
    
    const newLists: any = { ...lists };
    data?.forEach(row => {
      // Remove 'list_' prefix to match state keys
      const key = row.key.replace('list_', '') as ListType;
      if (newLists[key] !== undefined) {
        newLists[key] = row.value;
      }
    });
    setLists(newLists);
    setLoading(false);
  };

  const saveList = async (listKey: ListType, newList: string[]) => {
    const dbKey = `list_${listKey}`;
    const { error } = await supabase.from('system_config').upsert({
      key: dbKey,
      value: newList
    });
    
    if (error) {
      alert('فشل الحفظ');
    } else {
      setLists(prev => ({ ...prev, [listKey]: newList }));
    }
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    const updatedList = [...lists[activeList], newItem.trim()];
    await saveList(activeList, updatedList);
    setNewItem('');
  };

  const removeItem = async (index: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      const updatedList = lists[activeList].filter((_, i) => i !== index);
      await saveList(activeList, updatedList);
    }
  };

  if (user?.role !== 'ADMIN') return <div className="p-10 text-center text-red-500">وصول غير مصرح به</div>;

  const config = {
    asset_categories: { label: 'تصنيفات الأصول', icon: Tags, color: 'text-blue-600', bg: 'bg-blue-50' },
    part_categories: { label: 'تصنيفات قطع الغيار', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
    suppliers: { label: 'الموردين', icon: Truck, color: 'text-green-600', bg: 'bg-green-50' },
  };

  const ActiveIcon = config[activeList].icon;

  return (
    <div className="max-w-4xl mx-auto pb-20 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">إدارة القوائم والتصنيفات</h1>
        <p className="text-gray-500">التحكم في القوائم المنسدلة المستخدمة في النظام.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(config) as ListType[]).map(key => {
          const ItemIcon = config[key].icon;
          return (
            <button
              key={key}
              onClick={() => setActiveList(key)}
              className={`p-4 rounded-xl border text-right transition-all flex items-center gap-3 ${
                activeList === key 
                  ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-200' 
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className={`p-2 rounded-lg ${config[key].bg} ${config[key].color}`}>
                 <ItemIcon size={24} />
              </div>
              <div className="font-bold text-gray-700">{config[key].label}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
         <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className={`p-2 rounded-lg ${config[activeList].bg} ${config[activeList].color}`}>
               <ActiveIcon size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{config[activeList].label}</h2>
         </div>

         {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
         ) : (
           <div className="space-y-4">
              {/* Add Input */}
              <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={newItem}
                   onChange={e => setNewItem(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && addItem()}
                   className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                   placeholder={`أضف ${config[activeList].label.slice(0, -1)} جديد...`}
                 />
                 <button 
                   onClick={addItem}
                   disabled={!newItem.trim()}
                   className="px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                 >
                   إضافة
                 </button>
              </div>

              {/* List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                 {lists[activeList].length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
                       لا توجد عناصر مضافة.
                    </div>
                 ) : (
                   lists[activeList].map((item, idx) => (
                     <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 group hover:border-blue-200 transition-colors">
                        <span className="font-medium text-gray-900">{item}</span>
                        <button 
                          onClick={() => removeItem(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                   ))
                 )}
              </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default CategoryManager;
