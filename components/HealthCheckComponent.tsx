
import React from 'react';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

export interface HealthCheck {
  id: string;
  name: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'PASS' | 'FAIL';
  count?: number;
  fixable: boolean;
}

interface HealthCheckComponentProps {
  check: HealthCheck;
  onFix: (id: string) => void;
}

const HealthCheckComponent: React.FC<HealthCheckComponentProps> = ({ check, onFix }) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-blue-200 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-4">
         <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            check.status === 'PENDING' ? 'bg-gray-100 text-gray-400' :
            check.status === 'PASS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
         }`}>
            {check.status === 'PENDING' ? <RefreshCw className="animate-spin" size={20} /> : 
             check.status === 'PASS' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
         </div>
         <div>
            <h3 className="font-bold text-gray-800">{check.name}</h3>
            <p className="text-sm text-gray-500">{check.description}</p>
         </div>
      </div>

      <div className="flex items-center gap-6">
         {check.status === 'FAIL' && check.count !== undefined && check.count > 0 && (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
               {check.count} حالات
            </span>
         )}
         
         {check.status === 'FAIL' ? (
             check.fixable ? (
                <button 
                  onClick={() => onFix(check.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                   إصلاح تلقائي
                </button>
             ) : (
                <span className="text-xs text-gray-400 font-medium">يتطلب تدخل يدوي</span>
             )
         ) : check.status === 'PASS' ? (
            <span className="text-xs text-green-600 font-bold flex items-center gap-1">
               <CheckCircle size={12} /> لا مشاكل
            </span>
         ) : (
            <span className="text-xs text-gray-400 font-medium italic">جاري الفحص...</span>
         )}
      </div>
    </div>
  );
};

export default HealthCheckComponent;
