
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useStore } from '../../services/store';
import { 
  Megaphone, 
  Send, 
  Trash2, 
  BellRing, 
  Users, 
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Role } from '../../types';

const Announcements: React.FC = () => {
  const { user } = useStore();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New Announcement Form
  const [form, setForm] = useState({
    title: '',
    body: '',
    target_audience: 'ALL',
    priority: 'NORMAL',
    expires_in_days: 7
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });
    setList(data || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + form.expires_in_days);

    const { error } = await supabase.from('announcements').insert([{
      title: form.title,
      body: form.body,
      target_audience: form.target_audience,
      priority: form.priority,
      created_by: user?.id,
      expires_at: expiresAt.toISOString(),
      is_active: true
    }]);

    if (error) {
      alert('فشل الإرسال: ' + error.message);
    } else {
      alert('تم إرسال التعميم بنجاح');
      setForm({ title: '', body: '', target_audience: 'ALL', priority: 'NORMAL', expires_in_days: 7 });
      fetchAnnouncements();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التعميم؟ سيختفي من لوحة تحكم المستخدمين.')) {
      await supabase.from('announcements').delete().eq('id', id);
      fetchAnnouncements();
    }
  };

  if (user?.role !== 'ADMIN') return <div className="p-10 text-center text-red-500">وصول غير مصرح به</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20 p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Megaphone className="text-blue-600" />
          مركز التعاميم (Broadcasts)
        </h1>
        <p className="text-gray-500">إرسال تنبيهات وتعاميم لجميع موظفي النظام.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Creator Form */}
        <div className="lg:col-span-1">
           <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 sticky top-6">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <Send size={18} className="text-blue-600" /> تعميم جديد
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">العنوان</label>
                    <input 
                      required
                      type="text" 
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                      placeholder="مثال: تحديث سياسة الصيانة"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">نص التعميم</label>
                    <textarea 
                      required
                      rows={4}
                      value={form.body}
                      onChange={e => setForm({...form, body: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                      placeholder="اكتب التفاصيل هنا..."
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                       <label className="block text-xs font-bold text-gray-500 mb-1">الجمهور المستهدف</label>
                       <select 
                         value={form.target_audience}
                         onChange={e => setForm({...form, target_audience: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                       >
                         <option value="ALL">الجميع</option>
                         <option value="TECHNICIAN">الفنيين فقط</option>
                         <option value="MANAGER">مدراء الفروع فقط</option>
                         <option value="ADMIN">الإدارة فقط</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 mb-1">الأهمية</label>
                       <select 
                         value={form.priority}
                         onChange={e => setForm({...form, priority: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                       >
                         <option value="NORMAL">عادية</option>
                         <option value="CRITICAL">عاجلة / حرجة</option>
                       </select>
                    </div>
                 </div>

                 <button 
                   type="submit"
                   className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 mt-2 flex items-center justify-center gap-2 transition-transform active:scale-95"
                 >
                   <Send size={18} /> إرسال للجميع
                 </button>
              </form>
           </div>
        </div>

        {/* History List */}
        <div className="lg:col-span-2 space-y-4">
           <h3 className="font-bold text-gray-600 px-2">التعاميم النشطة</h3>
           {list.length === 0 ? (
             <div className="p-10 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                لا توجد تعاميم سابقة.
             </div>
           ) : (
             list.map(item => (
               <div key={item.id} className={`bg-white p-5 rounded-xl shadow-sm border relative overflow-hidden group transition-all hover:shadow-md ${
                 item.priority === 'CRITICAL' ? 'border-red-100' : 'border-gray-100'
               }`}>
                  {/* Critical Stripe */}
                  {item.priority === 'CRITICAL' && (
                    <div className="absolute top-0 right-0 w-1 h-full bg-red-500"></div>
                  )}

                  <div className="flex justify-between items-start mb-2 pl-10">
                     <h4 className="font-bold text-gray-800 text-lg">{item.title}</h4>
                     <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        item.target_audience === 'ALL' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                     }`}>
                        {item.target_audience === 'ALL' ? 'عام' : item.target_audience}
                     </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 whitespace-pre-line leading-relaxed">
                    {item.body}
                  </p>

                  <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-50 pt-3">
                     <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Users size={12} /> {item.profiles?.full_name}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(item.created_at).toLocaleDateString('ar-EG')}</span>
                     </div>
                     <button 
                       onClick={() => handleDelete(item.id)}
                       className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                     >
                       <Trash2 size={16} />
                     </button>
                  </div>
               </div>
             ))
           )}
        </div>

      </div>
    </div>
  );
};

export default Announcements;
