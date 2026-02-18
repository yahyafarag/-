
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../services/store';
import { supabase } from '../services/supabase';
import Sidebar from './Sidebar';
import PullToRefresh from './PullToRefresh';
import { Menu, Bell, Search, Megaphone, X } from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout, fetchSystemMetadata } = useStore();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    fetchActiveAnnouncement();
  }, [location.pathname]); // Re-check on nav change

  const fetchActiveAnnouncement = async () => {
    if (!user) return;
    
    // Fetch latest active announcement targeted at this user
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .or(`target_audience.eq.ALL,target_audience.eq.${user.role}`)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      // Simple check to see if user dismissed it locally (could use localStorage)
      const dismissed = localStorage.getItem(`dismissed_announcement_${data[0].id}`);
      if (!dismissed) {
        setAnnouncement(data[0]);
      }
    }
  };

  const dismissAnnouncement = () => {
    if (announcement) {
      localStorage.setItem(`dismissed_announcement_${announcement.id}`, 'true');
      setAnnouncement(null);
    }
  };

  const handleRefresh = async () => {
    await fetchSystemMetadata();
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-cairo" dir="rtl">
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setSidebarOpen} 
        user={user} 
        logout={logout} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-sm z-20 relative shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-1.5 w-64">
               <Search size={18} className="text-gray-400 ml-2" />
               <input 
                 type="text" 
                 placeholder="بحث سريع..." 
                 className="bg-transparent border-none outline-none text-sm w-full"
               />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-left hidden sm:block">
               <p className="text-xs text-gray-400">آخر تحديث</p>
               <p className="text-sm font-medium dir-ltr">{new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <button className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 rounded-full">
              <Bell size={20} />
              <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Global Announcement Banner */}
        {announcement && (
          <div className={`px-4 py-3 text-white flex justify-between items-center shadow-md animate-in slide-in-from-top z-10 shrink-0 ${
            announcement.priority === 'CRITICAL' ? 'bg-red-600' : 'bg-indigo-600'
          }`}>
             <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-full">
                   <Megaphone size={18} className="text-white" />
                </div>
                <div>
                   <span className="font-bold text-sm ml-2">{announcement.title}:</span>
                   <span className="text-sm opacity-90">{announcement.body}</span>
                </div>
             </div>
             <button onClick={dismissAnnouncement} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded">
                <X size={18} />
             </button>
          </div>
        )}

        {/* Page Content Wrapped in PullToRefresh */}
        <main className="flex-1 overflow-hidden relative">
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="p-6 animate-fade-in-up pb-24 lg:pb-6">
              <Outlet />
            </div>
          </PullToRefresh>
        </main>
      </div>
    </div>
  );
};

export default Layout;
