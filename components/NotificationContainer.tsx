
import React from 'react';
import { useStore } from '../services/store';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useStore();

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((note) => (
        <div 
          key={note.id}
          className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-lg border animate-in slide-in-from-left-5 duration-300 min-w-[300px] ${
            note.type === 'success' ? 'bg-white border-green-100 text-green-800' :
            note.type === 'error' ? 'bg-white border-red-100 text-red-800' :
            'bg-white border-blue-100 text-blue-800'
          }`}
        >
          <div className={`p-2 rounded-full ${
             note.type === 'success' ? 'bg-green-100' :
             note.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
             {note.type === 'success' && <CheckCircle size={20} className="text-green-600" />}
             {note.type === 'error' && <AlertCircle size={20} className="text-red-600" />}
             {note.type === 'info' && <Info size={20} className="text-blue-600" />}
          </div>
          
          <div className="flex-1">
             <p className="font-bold text-sm">
                {note.type === 'success' ? 'نجاح' : note.type === 'error' ? 'خطأ' : 'تنبيه'}
             </p>
             <p className="text-xs opacity-90">{note.message}</p>
          </div>

          <button onClick={() => removeNotification(note.id)} className="text-gray-400 hover:text-gray-600">
             <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
