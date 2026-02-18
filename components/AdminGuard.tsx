import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../services/store';
import { Lock } from 'lucide-react';

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-600 p-4 text-center">
        <div className="bg-red-100 p-6 rounded-full mb-4">
          <Lock size={64} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">وصول مرفوض (Access Denied)</h1>
        <p className="text-lg mb-6">ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة.</p>
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow hover:bg-blue-700 transition-colors"
        >
          عودة للخلف
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;