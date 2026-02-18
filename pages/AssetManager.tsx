import React from 'react';
import { useStore } from '../services/store';
import { Activity, Battery, Calendar, MapPin } from 'lucide-react';

const AssetManager: React.FC = () => {
  const { assets } = useStore();

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-bold text-gray-800">Asset Management</h1>
          <p className="text-gray-500">Monitor asset health and details.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {assets.map(asset => (
            <div key={asset.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gray-100 relative">
                <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3">
                   <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
                     asset.status === 'ACTIVE' ? 'bg-green-500 text-white' : 
                     asset.status === 'BROKEN' ? 'bg-red-500 text-white' : 
                     'bg-yellow-500 text-white'
                   }`}>
                     {asset.status}
                   </span>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{asset.name}</h3>
                  <p className="text-gray-500 text-sm">{asset.serialNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Activity size={14} /> Health Score
                    </div>
                    <div className="flex items-end gap-1">
                      <span className={`text-xl font-bold ${
                        asset.healthScore > 80 ? 'text-green-600' :
                        asset.healthScore > 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>{asset.healthScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                      <div 
                        className={`h-1.5 rounded-full ${
                           asset.healthScore > 80 ? 'bg-green-500' :
                           asset.healthScore > 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} 
                        style={{ width: `${asset.healthScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Calendar size={14} /> Warranty
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      {new Date(asset.warrantyExpiry).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-500 pt-2 border-t border-gray-100">
                  <MapPin size={16} className="mr-1" />
                  {asset.location}
                </div>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
};

export default AssetManager;