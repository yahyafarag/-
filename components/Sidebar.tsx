
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import { 
  LayoutDashboard, 
  Ticket, 
  Settings, 
  Box, 
  Wrench, 
  LogOut, 
  X,
  ClipboardList,
  LucideIcon,
  GitMerge,
  FileText,
  Building2,
  Users,
  Tags,
  Shield,
  ShieldAlert,
  Megaphone,
  Activity,
  Database
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
  logout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, user, logout }) => {
  const navigate = useNavigate();
  const [listHeight, setListHeight] = useState(500);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calculate available height for the list
  useEffect(() => {
    const updateHeight = () => {
      // Total height - header (64px) - footer (approx 76px) - padding
      const h = window.innerHeight - 140; 
      setListHeight(Math.max(200, h));
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const displayItems = useMemo(() => {
    // Define navigation structure
    const navItems: { icon: LucideIcon; label: string; path: string; roles?: string[]; subItem?: boolean }[] = [
      { icon: LayoutDashboard, label: 'لوحة المعلومات', path: '/' },
      { icon: Ticket, label: 'البلاغات', path: '/tickets' },
      { icon: Wrench, label: 'الأصول والمعدات', path: '/assets' },
      { icon: Box, label: 'المخزن', path: '/inventory' },
    ];

    // Role-based injections
    if (user?.role === 'TECHNICIAN') {
       navItems.unshift({ icon: ClipboardList, label: 'مهامي', path: '/my-tickets', roles: ['TECHNICIAN'] });
    }

    // Admin Items
    const adminItems = [
      { icon: Settings, label: 'إعدادات النظام', path: '/settings', roles: ['ADMIN'] },
      // Core Admin
      { icon: Building2, label: 'الهيكل التنظيمي', path: '/settings/org', roles: ['ADMIN'], subItem: true },
      { icon: Users, label: 'المستخدمين', path: '/settings/users', roles: ['ADMIN'], subItem: true },
      { icon: Tags, label: 'القوائم والتصنيفات', path: '/settings/categories', roles: ['ADMIN'], subItem: true },
      { icon: FileText, label: 'نماذج البلاغات', path: '/settings/forms', roles: ['ADMIN'], subItem: true },
      { icon: GitMerge, label: 'سير العمل (Workflow)', path: '/settings/status', roles: ['ADMIN'], subItem: true },
      // God Mode
      { icon: Shield, label: 'الصلاحيات (Permissions)', path: '/settings/permissions', roles: ['ADMIN'], subItem: true },
      { icon: ShieldAlert, label: 'سجل العمليات (Audit)', path: '/settings/audit', roles: ['ADMIN'], subItem: true },
      { icon: Megaphone, label: 'التعاميم (Broadcasts)', path: '/settings/announcements', roles: ['ADMIN'], subItem: true },
      { icon: Activity, label: 'طبيب النظام (System Doctor)', path: '/settings/doctor', roles: ['ADMIN'], subItem: true },
      { icon: Database, label: 'استيراد البيانات (AI)', path: '/settings/import', roles: ['ADMIN'], subItem: true },
    ];

    return user?.role === 'ADMIN' ? [...navItems, ...adminItems] : navItems;
  }, [user?.role]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = displayItems[index];
    const IconComponent = item.icon;
    
    return (
      <div style={style} className="px-4 py-1">
        <NavLink
          to={item.path}
          onClick={() => setIsOpen(false)}
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group h-full ${
              isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 translate-x-[-4px]' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            } ${item.subItem ? 'mr-4 text-xs' : ''}`
          }
        >
          <IconComponent size={item.subItem ? 16 : 20} className="ml-3 shrink-0" />
          <span className={`font-medium truncate ${item.subItem ? 'text-xs' : 'text-sm'}`}>{item.label}</span>
        </NavLink>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 right-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800">
          <span className="text-xl font-bold tracking-wider text-blue-400">بي.لبن EMS</span>
          <button 
            onClick={() => setIsOpen(false)} 
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 mt-2" ref={containerRef}>
          <List
            height={listHeight}
            itemCount={displayItems.length}
            itemSize={60} // Approx height of item + padding
            width="100%"
            direction="rtl"
          >
            {Row}
          </List>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center mb-4 px-2">
            <img 
              src={user?.avatar || 'https://via.placeholder.com/40'} 
              alt="User" 
              className="w-10 h-10 rounded-full ml-3 border-2 border-slate-700 shadow-md object-cover" 
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'مستخدم'}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role?.toLowerCase() || 'guest'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-red-400 bg-red-400/10 rounded-xl hover:bg-red-400/20 transition-colors"
          >
            <LogOut size={18} className="ml-2" />
            تسجيل خروج
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
