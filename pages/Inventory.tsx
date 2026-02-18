import React from 'react';
import { useStore } from '../services/store';
import { AlertTriangle, Package } from 'lucide-react';

const Inventory: React.FC = () => {
  const { parts } = useStore();

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
          <p className="text-gray-500">Manage spare parts and stock levels.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Part Info</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Category</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Stock Level</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Unit Price</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parts.map(part => {
                  const isLowStock = part.stock <= part.minStock;
                  return (
                    <tr key={part.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={part.image} alt={part.name} className="w-10 h-10 rounded-md object-cover border border-gray-200" />
                          <div>
                            <p className="font-medium text-gray-800">{part.name}</p>
                            <p className="text-xs text-gray-400">ID: {part.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{part.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className="font-medium text-gray-800">{part.stock}</span>
                           <span className="text-xs text-gray-400">/ {part.minStock} min</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-800">
                        ${part.price}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isLowStock ? (
                          <span className="inline-flex items-center px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full font-medium">
                            <AlertTriangle size={12} className="mr-1" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full font-medium">
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
};

export default Inventory;