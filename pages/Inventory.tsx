
import React, { useState } from 'react';
import { useStore } from '../services/store';
import { AlertTriangle, Package, History, Plus, Minus, Search, X } from 'lucide-react';
import { Part } from '../types';

const Inventory: React.FC = () => {
  const { parts, updatePartStock } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'ADD' | 'REMOVE'>('ADD');

  const filteredParts = parts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdjustStock = () => {
    if (!selectedPart) return;
    const change = adjustType === 'ADD' ? adjustAmount : -adjustAmount;
    updatePartStock(selectedPart.id, change);
    setSelectedPart(null);
    setAdjustAmount(1);
  };

  return (
    <div className="space-y-6 pb-20">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">المخزون وقطع الغيار</h1>
            <p className="text-gray-500">مراقبة مستويات المخزون وإدارة القطع.</p>
          </div>
          <div className="relative">
             <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
             <input 
               type="text" 
               placeholder="بحث عن قطعة..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64 bg-white text-gray-900 placeholder-gray-400"
             />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">تفاصيل القطعة</th>
                  <th className="px-6 py-4">الفئة</th>
                  <th className="px-6 py-4 text-center">الرصيد الحالي</th>
                  <th className="px-6 py-4 text-center">السعر (ج.م)</th>
                  <th className="px-6 py-4 text-center">الحالة</th>
                  <th className="px-6 py-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredParts.map(part => {
                  const isLowStock = part.stock <= part.minStock;
                  return (
                    <tr key={part.id} className={`hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-red-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg border border-gray-200 p-1 bg-white">
                            <img src={part.image} alt={part.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{part.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{part.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{part.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                           <span className={`text-lg font-bold ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>
                             {part.stock}
                           </span>
                           <span className="text-xs text-gray-400">الحد الأدنى: {part.minStock}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-800">
                        {part.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isLowStock ? (
                          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-bold animate-pulse">
                            <AlertTriangle size={12} className="ml-1" />
                            نقص مخزون
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">
                            متوفر
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                         <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setSelectedPart(part)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-bold border border-blue-200"
                            >
                              تعديل الرصيد
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="سجل الحركات">
                              <History size={18} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Adjust Stock Modal */}
        {selectedPart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                   <h3 className="font-bold text-gray-800">تعديل المخزون</h3>
                   <button onClick={() => setSelectedPart(null)} className="text-gray-400 hover:text-gray-600">
                     <X size={20} />
                   </button>
                </div>
                
                <div className="p-6">
                   <div className="flex items-center gap-3 mb-6">
                      <img src={selectedPart.image} className="w-12 h-12 rounded-lg border" />
                      <div>
                         <p className="font-bold text-gray-800">{selectedPart.name}</p>
                         <p className="text-sm text-gray-500">الرصيد الحالي: {selectedPart.stock}</p>
                      </div>
                   </div>

                   <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                      <button 
                        onClick={() => setAdjustType('ADD')}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
                           adjustType === 'ADD' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'
                        }`}
                      >
                         <Plus size={16} className="inline ml-1" /> إضافة (شراء)
                      </button>
                      <button 
                        onClick={() => setAdjustType('REMOVE')}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
                           adjustType === 'REMOVE' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'
                        }`}
                      >
                         <Minus size={16} className="inline ml-1" /> صرف / تالف
                      </button>
                   </div>

                   <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">الكمية</label>
                      <input 
                        type="number" 
                        min="1"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(Math.max(1, parseInt(e.target.value)))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                      />
                   </div>

                   <button 
                     onClick={handleAdjustStock}
                     className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${
                        adjustType === 'ADD' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                     }`}
                   >
                     تأكيد {adjustType === 'ADD' ? 'الإضافة' : 'الخصم'}
                   </button>
                </div>
             </div>
          </div>
        )}
    </div>
  );
};

export default Inventory;
