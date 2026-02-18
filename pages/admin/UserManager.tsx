
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useStore } from '../../services/store';
import { useConfirm } from '../../components/ConfirmModal';
import { 
  Users, 
  Search, 
  UserPlus, 
  MoreVertical, 
  Shield, 
  Ban, 
  CheckCircle, 
  User as UserIcon,
  Filter,
  X
} from 'lucide-react';
import { Role } from '../../types';

const UserManager: React.FC = () => {
  const { user, showNotification } = useStore();
  const { confirm, ConfirmationDialog } = useConfirm();
  
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*, branches(name)');
    setProfiles(data || []);
    setLoading(false);
  };

  const fetchBranches = async () => {
    const { data } = await supabase.from('branches').select('id, name');
    setBranches(data || []);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = { 
      full_name: formData.full_name,
      role: formData.role,
      phone: formData.phone,
      branch_id: formData.branch_id,
      is_active: formData.is_active
    };

    if (editingUser) {
       // Update existing profile
       const { error } = await supabase.from('profiles').update(payload).eq('id', editingUser.id);
       if (error) {
         showNotification('error', 'فشل التحديث: ' + error.message);
       } else {
         showNotification('success', 'تم تحديث بيانات المستخدم');
       }
    } else {
       showNotification('info', "لإضافة مستخدم جديد، يجب إنشاء حساب في Auth أولاً. هذه الميزة تتطلب صلاحيات Supabase Admin.");
    }
    
    setIsModalOpen(false);
    setEditingUser(null);
    fetchUsers();
  };

  const toggleStatus = (user: any) => {
    const isActivating = !user.is_active;
    
    confirm({
      title: isActivating ? 'تفعيل الحساب' : 'تعطيل الحساب',
      type: isActivating ? 'info' : 'danger',
      confirmText: isActivating ? 'تفعيل' : 'تعطيل',
      message: (
        <div>
          <p className="text-gray-600 mb-2">
            هل أنت متأكد من رغبتك في <strong>{isActivating ? 'تفعيل' : 'تعطيل'}</strong> حساب المستخدم التالي؟
          </p>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {user.full_name ? user.full_name[0] : <UserIcon size={20} />}
             </div>
             <div>
                <p className="font-bold text-gray-800">{user.full_name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
             </div>
          </div>
        </div>
      ),
      onConfirm: async () => {
        const { error } = await supabase.from('profiles').update({ is_active: isActivating }).eq('id', user.id);
        if (error) {
           showNotification('error', 'فشل تغيير الحالة');
        } else {
           showNotification('success', `تم ${isActivating ? 'تفعيل' : 'تعطيل'} الحساب بنجاح`);
           fetchUsers();
        }
      }
    });
  };

  const openModal = (user?: any) => {
    setEditingUser(user || null);
    setFormData(user || { is_active: true, role: 'TECHNICIAN' });
    setIsModalOpen(true);
  };

  const filteredUsers = profiles.filter(u => {
     const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           u.phone?.includes(searchTerm);
     const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
     return matchesSearch && matchesRole;
  });

  if (user?.role !== 'ADMIN') return <div className="p-10 text-center text-red-500">وصول غير مصرح به</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6 space-y-6">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
          <p className="text-gray-500">التحكم في الحسابات، الصلاحيات، وحالة النشاط.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-md transition-all"
        >
          <UserPlus size={20} />
          مستخدم جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
         <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو الهاتف..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
         </div>
         <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={20} />
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-900"
            >
               <option value="ALL">جميع الأدوار</option>
               <option value="ADMIN">مدير نظام (Admin)</option>
               <option value="MANAGER">مدير فرع (Manager)</option>
               <option value="TECHNICIAN">فني (Technician)</option>
            </select>
         </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">المستخدم</th>
              <th className="px-6 py-4">الدور</th>
              <th className="px-6 py-4">الفرع / المنطقة</th>
              <th className="px-6 py-4 text-center">الحالة</th>
              <th className="px-6 py-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map(profile => (
              <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {profile.full_name ? profile.full_name[0] : <UserIcon size={20} />}
                     </div>
                     <div>
                        <div className="font-bold text-gray-800">{profile.full_name || 'بدون اسم'}</div>
                        <div className="text-xs text-gray-400 font-mono">{profile.phone || 'لا يوجد هاتف'}</div>
                     </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2.5 py-1 text-xs rounded-full font-bold border ${
                      profile.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      profile.role === 'MANAGER' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      'bg-blue-100 text-blue-700 border-blue-200'
                   }`}>
                      {profile.role}
                   </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                   {profile.branches?.name || '-'}
                </td>
                <td className="px-6 py-4 text-center">
                   {profile.is_active ? (
                     <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle size={12} /> نشط
                     </span>
                   ) : (
                     <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-full">
                        <Ban size={12} /> محظور
                     </span>
                   )}
                </td>
                <td className="px-6 py-4 text-center">
                   <div className="flex justify-center gap-2">
                      <button onClick={() => openModal(profile)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg text-sm font-bold">
                         تعديل
                      </button>
                      <button 
                        onClick={() => toggleStatus(profile)}
                        className={`p-2 rounded-lg text-sm font-bold ${profile.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                         {profile.is_active ? 'حظر' : 'تفعيل'}
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">لا يوجد مستخدمين.</div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog />

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800">
                   {editingUser ? 'تعديل المستخدم' : 'مستخدم جديد'}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              
              <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">الاسم الكامل</label>
                    <input 
                      required
                      type="text" 
                      value={formData.full_name || ''}
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف</label>
                    <input 
                      type="text" 
                      value={formData.phone || ''}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dir-ltr text-right bg-white text-gray-900"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">الدور (Role)</label>
                       <select 
                         value={formData.role || 'TECHNICIAN'}
                         onChange={e => setFormData({...formData, role: e.target.value as Role})}
                         className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                       >
                          <option value="ADMIN">Admin</option>
                          <option value="MANAGER">Manager</option>
                          <option value="TECHNICIAN">Technician</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">الفرع</label>
                       <select 
                         value={formData.branch_id || ''}
                         onChange={e => setFormData({...formData, branch_id: e.target.value})}
                         className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                       >
                          <option value="">غير محدد</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      checked={formData.is_active !== false}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="text-gray-700 font-bold select-none">حساب نشط (Active)</label>
                 </div>

                 <button 
                   type="submit"
                   className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 mt-4"
                 >
                   حفظ التغييرات
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
