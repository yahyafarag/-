import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, AlertCircle, Clock, MapPin } from 'lucide-react';
import { TicketPriority, TicketStatus } from '../types';

const TicketList: React.FC = () => {
  const { tickets, assets } = useStore();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredTickets = tickets.filter(ticket => {
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
      case 'RESOLVED': return 'text-green-600 bg-green-50';
      case 'CLOSED': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tickets</h1>
          <p className="text-gray-500">Manage and track maintenance requests.</p>
        </div>
        <Link 
          to="/tickets/new" 
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} className="mr-2" />
          New Ticket
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={20} />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTickets.length === 0 ? (
           <div className="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
             <p className="text-gray-500">No tickets found.</p>
           </div>
        ) : (
          filteredTickets.map(ticket => {
            const asset = assets.find(a => a.id === ticket.assetId);
            return (
              <Link 
                key={ticket.id} 
                to={`/tickets/${ticket.id}`}
                className="block bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-sm text-gray-400">#{ticket.id}</span>
                      <h3 className="font-semibold text-gray-800">{ticket.title}</h3>
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
                  </div>
                  
                  <div className="flex items-center gap-4 md:flex-col md:items-end md:gap-1">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TicketList;