import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../services/store';
import { 
  ArrowRight, 
  Activity, 
  MapPin, 
  Wrench, 
  ShieldCheck,
  History,
  Phone,
  Clock,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { assets, tickets, parts } = useStore();

  const asset = assets.find(a => a.id === id);
  const assetTickets = tickets.filter(t => t.assetId === id);

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold text-gray-400">الأصل غير موجود</h2>
        <button onClick={() => navigate('/assets')} className="mt-4 text-blue-600 hover:underline">
          عودة لقائمة الأصول
        </button>
      </div>
    );
  }

  // --- Calculations ---
  const isWarrantyActive = new Date(asset.warrantyExpiry) > new Date();
  
  // Downtime: Sum of (ClosedAt - CreatedAt) for resolved tickets
  // Mock logic: Assuming random hours for demo if dates are close
  const totalDowntimeHours = assetTickets
    .filter(t => t.status === 'CLOSED' || t.status === 'RESOLVED')
    .reduce((acc, t) => {
      const start = new Date(t.createdAt).getTime();
      const end = t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now();
      // Convert ms to hours
      const hours = (end - start) / (1000 * 60 * 60);
      return acc + hours;
    }, 0);

  // Repair Costs: Estimate based on tickets
  // This is a rough estimation since we don't store exact cost in ticket history in this simplified model
  // We'll assume a base labor cost per ticket + estimated part cost
  const totalRepairCost = assetTickets.length * 150 + (assetTickets.length * 0.05 * asset.initialValue); 

  // Mock Health Data for Chart
  const healthHistory = [
    { date: 'يناير', score: 98 },
    { date: 'فبراير', score: 96 },
    { date: 'مارس', score: 92 },
    { date: 'أبريل', score: 88 },
    { date: 'مايو', score: asset.healthScore },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/assets')} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowRight size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{asset.name}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
             <span className="bg-gray-200 px-2 py-0.5 rounded text-gray-700">{asset.serialNumber}</span>
             <span className="flex items-center gap-1"><MapPin size={14} /> {asset.location}</span>
          </div>
        </div>
        <div className="mr-auto">
             <Link 
               to={`/tickets/new?assetId=${asset.id}`}
               className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors animate-pulse-slow"
             >
               <AlertTriangle size={18} />
               تسجيل عطل فوراً
             </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Analytics */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* KPI Cards */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Health */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-500">مؤشر الصحة</span>
                    <Activity size={20} className={asset.healthScore > 80 ? 'text-green-500' : 'text-yellow-500'} />
                 </div>
                 <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-bold text-gray-800">{asset.healthScore}%</span>
                   <span className="text-xs text-gray-400">/ 100</span>
                 </div>
                 <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3">
                    <div 
                      className={`h-1.5 rounded-full ${asset.healthScore > 80 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                      style={{ width: `${asset.healthScore}%` }}
                    ></div>
                 </div>
              </div>

              {/* Downtime */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-500">وقت التوقف</span>
                    <Clock size={20} className="text-red-500" />
                 </div>
                 <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-800">{Math.round(totalDowntimeHours)}</span>
                    <span className="text-xs text-gray-500">ساعة</span>
                 </div>
                 <p className="text-xs text-gray-400 mt-2">إجمالي فترات الأعطال</p>
              </div>

              {/* Cost */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-500">تكلفة الصيانة</span>
                    <DollarSign size={20} className="text-blue-500" />
                 </div>
                 <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-800">{Math.round(totalRepairCost).toLocaleString()}</span>
                    <span className="text-xs text-gray-500">ج.م</span>
                 </div>
                 <p className="text-xs text-gray-400 mt-2">
                    {(totalRepairCost / asset.initialValue * 100).toFixed(1)}% من قيمة الأصل
                 </p>
              </div>
           </div>

           {/* Health Chart */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 className="font-semibold text-gray-800 mb-4">تاريخ أداء المعدة</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={healthHistory}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                   <XAxis dataKey="date" axisLine={false} tickLine={false} />
                   <YAxis hide domain={[0, 100]} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                   />
                   <Line 
                     type="monotone" 
                     dataKey="score" 
                     stroke="#3B82F6" 
                     strokeWidth={3} 
                     dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} 
                   />
                 </LineChart>
               </ResponsiveContainer>
             </div>
           </div>

           {/* Timeline */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                 <History size={18} /> سجل الصيانة
               </h3>
             </div>
             <div className="p-6">
                <div className="relative border-r border-gray-200 mr-3 space-y-8">
                  {assetTickets.length > 0 ? (
                    assetTickets.map((ticket, idx) => (
                      <div key={ticket.id} className="relative pr-6">
                         <div className={`absolute -right-1.5 top-1 w-3 h-3 rounded-full border-2 border-white ${
                            ticket.status === 'CLOSED' ? 'bg-green-500' : 'bg-blue-500'
                         }`}></div>
                         
                         <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-bold text-gray-800">{ticket.title}</span>
                            <span className="text-xs text-gray-400 font-mono">
                               {new Date(ticket.createdAt).toLocaleDateString('ar-EG')}
                            </span>
                         </div>
                         
                         <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                         
                         {ticket.diagnosis && (
                           <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-700 border border-gray-100">
                             <strong>التشخيص/الحل:</strong> {ticket.diagnosis}
                           </div>
                         )}

                         <div className="mt-2 flex gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                               ticket.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                               {ticket.priority}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                               {ticket.status}
                            </span>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="pr-6 text-gray-500">لا توجد سجلات.</div>
                  )}
                </div>
             </div>
           </div>
        </div>

        {/* Right Column: Info & Supplier */}
        <div className="space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
              <div className="overflow-hidden">
                <img src={asset.image} alt={asset.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 space-y-4">
                 <div>
                    <span className="text-xs text-gray-500 block">التصنيف</span>
                    <span className="font-medium text-gray-800">{asset.category}</span>
                 </div>
                 <div>
                    <span className="text-xs text-gray-500 block">تاريخ الشراء</span>
                    <span className="font-medium text-gray-800">{new Date(asset.purchaseDate).toLocaleDateString('ar-EG')}</span>
                 </div>
                 <div>
                    <span className="text-xs text-gray-500 block">القيمة الأولية</span>
                    <span className="font-medium text-gray-800">{asset.initialValue.toLocaleString()} ج.م</span>
                 </div>
                 <div>
                    <span className="text-xs text-gray-500 block">حالة الضمان</span>
                    {isWarrantyActive ? (
                       <span className="text-green-600 font-bold text-sm">ساري حتى {new Date(asset.warrantyExpiry).toLocaleDateString('ar-EG')}</span>
                    ) : (
                       <span className="text-red-500 font-bold text-sm">منتهي</span>
                    )}
                 </div>
              </div>
           </div>

           <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">بيانات المورد</h3>
              <div className="space-y-4">
                 <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                       <Wrench size={20} />
                    </div>
                    <div>
                       <p className="text-sm text-gray-500">الشركة الموردة</p>
                       <p className="font-medium text-gray-800">{asset.supplier}</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-3">
                    <div className="bg-green-50 p-2 rounded-lg text-green-600">
                       <Phone size={20} />
                    </div>
                    <div>
                       <p className="text-sm text-gray-500">رقم التواصل</p>
                       <a href={`tel:${asset.supplierContact}`} className="font-medium text-gray-800 hover:text-blue-600 dir-ltr block text-right">
                         {asset.supplierContact}
                       </a>
                    </div>
                 </div>
                 {isWarrantyActive && (
                   <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 leading-relaxed">
                     <ShieldCheck size={16} className="inline mb-1 ml-1" />
                     هذا الأصل تحت الضمان. يرجى التواصل مع المورد قبل إجراء أي إصلاحات داخلية لتجنب فقدان الضمان.
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetails;