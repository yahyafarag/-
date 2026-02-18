import React, { useState } from 'react';
import { useStore } from '../../services/store';
import { useNavigate } from 'react-router-dom';
import { Ticket, TicketStatus } from '../../types';
import { Clock, MapPin, AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react';

const MyTickets: React.FC = () => {
  const { tickets, user, assets } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'NEW' | 'ACTIVE' | 'CLOSED'>('NEW');

  // Filter tickets for this technician
  const myTickets = tickets.filter(t => 
    t.technicianId === user?.id || !t.technicianId // Show unassigned too if needed, simplified here
  );

  const filteredTickets = myTickets.filter(t => {
    if (activeTab === 'NEW') return t.status === 'OPEN';
    if (activeTab === 'ACTIVE') return t.status === 'IN_PROGRESS' || t.status === 'PENDING_PARTS';
    if (activeTab === 'CLOSED') return t.status === 'RESOLVED' || t.status === 'CLOSED';
    return false;
  });

  const getPriorityBadge = (priority: string) => {
    if (priority === 'CRITICAL' || priority === 'HIGH') {
      return <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full animate-pulse">عالية جداً</span>;
    }
    return <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">عادية</span>;
  };

  return (
    <div className="pb-20">
      <div className="bg-white p-6 shadow-sm mb-4">
        <h1 className="text-2xl font-bold text-gray-800">مهامي</h1>
        <p className="text-gray-500">قائمة البلاغات المسندة إليك</p>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-2 mb-6 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('NEW')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'NEW' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 border border-gray-100'
          }`}
        >
          جديدة ({myTickets.filter(t => t.status === 'OPEN').length})
        </button>
        <button 
          onClick={() => setActiveTab('ACTIVE')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'ACTIVE' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-gray-500 border border-gray-100'
          }`}
        >
          جاري التنفيذ ({myTickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PENDING_PARTS').length})
        </button>
        <button 
          onClick={() => setActiveTab('CLOSED')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'CLOSED' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-white text-gray-500 border border-gray-100'
          }`}
        >
          مكتملة
        </button>
      </div>

      {/* List */}
      <div className="px-4 space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12 opacity-50">
             <CheckCircle size={48} className="mx-auto mb-2 text-gray-300" />
             <p>لا يوجد بلاغات في هذه القائمة</p>
          </div>
        ) : (
          filteredTickets.map(ticket => {
            const asset = assets.find(a => a.id === ticket.assetId);
            return (
              <div 
                key={ticket.id}
                onClick={() => navigate(`/job/${ticket.id}`)}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer relative overflow-hidden"
              >
                {/* Priority Stripe */}
                <div className={`absolute top-0 right-0 w-1.5 h-full ${
                  ticket.priority === 'CRITICAL' ? 'bg-red-500' : 
                  ticket.priority === 'HIGH' ? 'bg-orange-500' : 'bg-blue-500'
                }`}></div>

                <div className="flex justify-between items-start mb-3 pr-3">
                   <h3 className="font-bold text-gray-800 text-lg leading-tight">{ticket.title}</h3>
                   {getPriorityBadge(ticket.priority)}
                </div>

                <div className="space-y-2 pr-3">
                  <div className="flex items-center text-gray-500 text-sm">
                    <AlertCircle size={16} className="ml-2 text-blue-500" />
                    <span className="truncate">{asset?.name}</span>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <MapPin size={16} className="ml-2 text-red-500" />
                    <span className="truncate">{asset?.location}</span>
                  </div>
                  <div className="flex items-center text-gray-400 text-xs mt-2">
                    <Clock size={14} className="ml-2" />
                    {new Date(ticket.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center pr-3">
                   <span className="text-sm font-semibold text-blue-600">اضغط لبدء العمل</span>
                   <div className="bg-gray-50 p-1.5 rounded-full">
                     <ChevronLeft size={18} className="text-gray-400" />
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyTickets;