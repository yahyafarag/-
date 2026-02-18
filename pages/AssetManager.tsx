
import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  QrCode, 
  Trash2, 
  Eye, 
  Activity,
  MapPin,
  X,
  Printer
} from 'lucide-react';
import { Asset } from '../types';
import { useConfirm } from '../components/ConfirmModal';

const AssetManager: React.FC = () => {
  const { assets, addAsset, deleteAsset } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<Asset | null>(null);
  
  // Confirmation Hook
  const { confirm, ConfirmationDialog } = useConfirm();

  // Filter Assets
  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.branchId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // New Asset State
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    name: '',
    serialNumber: '',
    category: 'عام',
    status: 'ACTIVE',
    location: '',
    initialValue: 0,
    healthScore: 100
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const asset: Asset = {
      ...newAsset as Asset,
      id: `a${Date.now()}`,
      branchId: 'b1', // Default branch
      purchaseDate: new Date().toISOString(),
      warrantyExpiry: new Date(Date.now() + 31536000000).toISOString(), // +1 Year
      supplier: 'مورد محلي',
      supplierContact: '-',
      image: 'https://picsum.photos/seed/new/400/300'
    };
    addAsset(asset);
    setIsAddModalOpen(false);
    setNewAsset({ name: '', serialNumber: '', category: 'عام', status: 'ACTIVE', location: '', initialValue: 0, healthScore: 100 });
  };

  const handleDelete = (asset: Asset) => {
    confirm({
      title: 'حذف المعدة',
      type: 'danger',
      message: (
        <div className="space-y-4">
          <p className="text-gray-600">هل أنت متأكد من رغبتك في حذف هذه المعدة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-red-500 font-semibold">اسم المعدة</span>
              <span className="font-bold text-gray-900 text-lg">{asset.name}</span>
            </div>
            <div className="h-px bg-red-200 my-3"></div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-red-500 font-semibold">الرقم التسلسلي</span>
              <span className="font-mono text-gray-700 bg-white/50 px-2 py-1 rounded inline-block w-fit text-sm">{asset.serialNumber}</span>
            </div>
          </div>
        </div>
      ),
      confirmText: 'نعم، حذف',
      cancelText: 'تراجع',
      onConfirm: async () => {
        await deleteAsset(asset.id);
      }
    });
  };

  const handlePrintQR = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة الأصول والمعدات</h1>
          <p className="text-gray-500">سجل كامل بجميع ماكينات ومعدات الفروع.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          إضافة معدة
        </button>
      </div>

      {/* Search & Stats */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
         <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="بحث باسم المعدة، الرقم التسلسلي..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
            />
         </div>
         <div className="flex gap-4 text-sm text-gray-500 items-center px-2">
            <span>العدد الكلي: <strong>{assets.length}</strong></span>
            <span className="h-4 w-px bg-gray-300"></span>
            <span className="text-green-600">نشط: <strong>{assets.filter(a => a.status === 'ACTIVE').length}</strong></span>
         </div>
      </div>

      {/* Assets Data Grid (Table) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">اسم المعدة / الموديل</th>
                <th className="px-6 py-4">الفرع / الموقع</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-center">مؤشر الصحة</th>
                <th className="px-6 py-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAssets.map(asset => (
                <tr key={asset.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                        <img src={asset.image} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{asset.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{asset.serialNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="text-sm text-gray-800 font-medium">{asset.branchId === 'b1' ? 'الفرع الرئيسي' : asset.branchId}</div>
                     <div className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={10} /> {asset.location}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      asset.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      asset.status === 'BROKEN' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {asset.status === 'ACTIVE' ? 'نشط' : asset.status === 'BROKEN' ? 'عطلان' : 'صيانة'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                       <span className={`text-sm font-bold ${
                         asset.healthScore > 80 ? 'text-green-600' : 
                         asset.healthScore > 50 ? 'text-yellow-600' : 'text-red-600'
                       }`}>
                         {asset.healthScore}%
                       </span>
                       <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1">
                          <div 
                            className={`h-full rounded-full ${
                              asset.healthScore > 80 ? 'bg-green-500' : 
                              asset.healthScore > 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} 
                            style={{ width: `${asset.healthScore}%` }}
                          />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => setSelectedAssetForQR(asset)}
                         className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                         title="QR Code"
                       >
                         <QrCode size={18} />
                       </button>
                       <Link 
                         to={`/assets/${asset.id}`}
                         className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                         title="التفاصيل"
                       >
                         <Eye size={18} />
                       </Link>
                       <button 
                         onClick={() => handleDelete(asset)}
                         className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                         title="حذف"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAssets.length === 0 && (
          <div className="p-8 text-center text-gray-500">لا توجد نتائج مطابقة للبحث.</div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationDialog />

      {/* QR Code Modal */}
      {selectedAssetForQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
               <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                 <h3 className="font-bold">البطاقة الرقمية للمعدة</h3>
                 <button onClick={() => setSelectedAssetForQR(null)} className="hover:bg-white/20 rounded-full p-1">
                   <X size={20} />
                 </button>
               </div>
               
               <div className="p-8 flex flex-col items-center text-center">
                 <div className="bg-white p-2 border-2 border-dashed border-gray-300 rounded-xl mb-4 shadow-inner">
                   {/* Using Public QR API */}
                   <img 
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/#/assets/${selectedAssetForQR.id}`} 
                     alt="Asset QR Code" 
                     className="w-48 h-48"
                   />
                 </div>
                 
                 <h2 className="text-xl font-bold text-gray-800">{selectedAssetForQR.name}</h2>
                 <p className="text-gray-500 mb-1 font-mono text-sm">{selectedAssetForQR.serialNumber}</p>
                 <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold mt-2 inline-block">
                   {selectedAssetForQR.location}
                 </span>

                 <button 
                   onClick={handlePrintQR}
                   className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors w-full justify-center font-bold shadow-lg"
                 >
                   <Printer size={18} />
                   طباعة الملصق
                 </button>
               </div>
            </div>
          </div>
      )}

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-gray-800">إضافة معدة جديدة</h3>
               <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                 <X size={20} />
               </button>
             </div>
             
             <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">اسم المعدة</label>
                   <input 
                     required
                     type="text" 
                     value={newAsset.name}
                     onChange={e => setNewAsset({...newAsset, name: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                     placeholder="مثال: فرن غاز كبير"
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">الرقم التسلسلي</label>
                     <input 
                       required
                       type="text" 
                       value={newAsset.serialNumber}
                       onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
                     <select 
                       value={newAsset.category}
                       onChange={e => setNewAsset({...newAsset, category: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                     >
                       <option className="text-gray-900">عام</option>
                       <option className="text-gray-900">خلاطات</option>
                       <option className="text-gray-900">أفران</option>
                       <option className="text-gray-900">تبريد</option>
                       <option className="text-gray-900">تغليف</option>
                     </select>
                  </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">الموقع داخل الفرع</label>
                   <input 
                     type="text" 
                     value={newAsset.location}
                     onChange={e => setNewAsset({...newAsset, location: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                     placeholder="مثال: الدور الأرضي - قسم أ"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">القيمة الأولية (ج.م)</label>
                   <input 
                     type="number" 
                     value={newAsset.initialValue}
                     onChange={e => setNewAsset({...newAsset, initialValue: parseInt(e.target.value)})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                   />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                   <button 
                     type="button"
                     onClick={() => setIsAddModalOpen(false)}
                     className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                   >
                     إلغاء
                   </button>
                   <button 
                     type="submit"
                     className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                   >
                     حفظ البيانات
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManager;
