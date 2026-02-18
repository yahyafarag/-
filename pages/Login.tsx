import React from 'react';
import { useStore } from '../services/store';
import { MOCK_USERS } from '../constants';
import { ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useStore();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">B.Laban EMS</h1>
          <p className="text-blue-100">Enterprise Maintenance System</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">Select User Persona</h2>
          <div className="space-y-3">
            {MOCK_USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => login(user.id)}
                className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
              >
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full mr-4 border border-gray-200" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800 group-hover:text-blue-700">{user.name}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{user.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;