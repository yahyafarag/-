
import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertCircle, 
  Clock, 
  MapPin, 
  CheckCircle,
  Star,
  MessageSquare
} from 'lucide-react';
import { TicketPriority, TicketStatus, Ticket } from '../types';

const TicketList: React.FC = () => {
  const { tickets, assets, user, rateAndCloseTicket } = useStore();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  
  // Rating Modal State
  const [ratingTicket, setRatingTicket] = useState<Ticket | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingNote, setRatingNote] = useState('');

  // Manager Logic: 
  // 1. Show tickets for their branch only.
  // 2. Hide CLOSED tickets (only show active + RESOLVED waiting for confirmation).
  // 3. Show "Confirm & Rate" for RESOLVED tickets.
  const isManager = user?.role === 'MANAGER';

  const filteredTickets = tickets.filter(ticket => {
    const asset = assets.find(a => a.id === ticket.assetId);
    
    // Filter 1: Ownership/Branch
    if (isManager) {
      if (asset?.branchId !== user?.branchId) return false;
      // Filter 2: Hide CLOSED
      if (ticket.status === 'CLOSED') return false;
    }

    const matchesSearch = ticket.title.toLowerCase().includes(search.toLowerCase()) || 
                          ticket.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || ticket.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const getPriorityColor = (p: TicketPriority) => {
    switch (p) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getStatusColor = (s: TicketStatus) => {
    switch (s) {
      case 'OPEN': return 'text-yellow-600 bg-yellow-50';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50';
      case 'RESOLVED': return 'text-purple-600 bg-purple-50';
      case 'CLOSED': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const handleRatingSubmit = () => {
    if (ratingTicket) {
      rateAndCloseTicket(ratingTicket.id, ratingValue, ratingNote);
      setRatingTicket(null);
      setRatingValue(5);
      setRatingNote('');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isManager ? 'بلاغاتي' : 'قائمة البلاغات'}</h1>
          <p className="text-gray-500">
            {isManager 
              ? 'متابعة الأعطال الجارية وتأكيد الإصلاح.' 
              : 'إدارة وتتبع جميع طلبات الصيانة.'}
          </p>
        </div>
        <Link 
          to="/tickets/new" 
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-bold"
        >
          <Plus size={20} className="ml-2" />
          إبلاغ عن عطل جديد
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="بحث في البلاغات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={20} />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="OPEN">مفتوح (Open)</option>
            <option value="IN_PROGRESS">جاري العمل (In Progress)</option>
            <option value="RESOLVED">تم الحل (Resolved)</option>
            {!isManager && <option value="CLOSED">مغلق (Closed)</option>}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTickets.length === 0 ? (
           <div className="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
             <p className="text-gray-500">لا توجد بلاغات.</p>
           </div>
        ) : (
          filteredTickets.map(ticket => {
            const asset = assets.find(a => a.id === ticket.assetId);
            const isResolved = ticket.status === 'RESOLVED';

            return (
              <div 
                key={ticket.id} 
                className={`block bg-white p-6 rounded-xl shadow-sm border transition-all ${
                  isResolved && isManager ? 'border-purple-200 ring-1 ring-purple-200' : 'border-gray-100'
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <Link to={`/tickets/${ticket.id}`} className="space-y-2 flex-1 group">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-sm text-gray-400 dir-ltr">#{ticket.id.slice(-6)}</span>
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{ticket.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-1">{ticket.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <AlertCircle size={14} /> {asset?.name || 'Unknown Asset'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {asset?.location || 'Unknown Location'}
                      </span>
                    </div>
                  </Link>
                  
                  <div className="flex items-center gap-4 md:flex-col md:items-end md:gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status === 'RESOLVED' ? 'تم الإصلاح (بانتظار التأكيد)' : ticket.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {new Date(ticket.createdAt).toLocaleDateString('ar-EG')}
                    </span>

                    {/* Manager Action Button */}
                    {isManager && isResolved && (
                      <button 
                        onClick={() => setRatingTicket(ticket)}
                        className="mt-2 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold shadow hover:bg-purple-700 transition-colors animate-pulse-slow"
                      >
                        <CheckCircle size={16} /> تأكيد واستلام
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rating Modal */}
      {ratingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
              <div className="bg-purple-600 p-6 text-white text-center">
                 <CheckCircle size={48} className="mx-auto mb-2 opacity-90" />
                 <h3 className="text-xl font-bold">تأكيد استلام الإصلاح</h3>
                 <p className="text-purple-100 text-sm">يرجى تقييم أداء الفني لإغلاق البلاغ</p>
              </div>
              
              <div className="p-6 space-y-6">
                 {/* Stars */}
                 <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                       <button 
                         key={star}
                         onClick={() => setRatingValue(star)}
                         className={`transition-transform hover:scale-110 ${star <= ratingValue ? 'text-yellow-400' : 'text-gray-200'}`}
                       >
                          <Star size={32} fill={star <= ratingValue ? "currentColor" : "none"} />
                       </button>
                    ))}
                 </div>
                 <p className="text-center text-sm font-bold text-gray-600">
                    {ratingValue === 5 ? 'ممتاز' : ratingValue === 4 ? 'جيد جداً' : ratingValue === 3 ? 'جيد' : 'بحاجة لتحسين'}
                 </p>

                 {/* Feedback */}
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظاتك (اختياري)</label>
                    <div className="relative">
                       <MessageSquare className="absolute top-3 right-3 text-gray-400" size={18} />
                       <textarea 
                         rows={3}
                         value={ratingNote}
                         onChange={(e) => setRatingNote(e.target.value)}
                         className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                         placeholder="اكتب تعليقك هنا..."
                       ></textarea>
                    </div>
                 </div>

                 <div className="flex gap-3">
                    <button 
                      onClick={() => setRatingTicket(null)}
                      className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                       إلغاء
                    </button>
                    <button 
                      onClick={handleRatingSubmit}
                      className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg"
                    >
                       تأكيد وإغلاق
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TicketList;
