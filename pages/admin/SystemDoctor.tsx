
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
} from 'lucide-react';
import HealthCheckComponent, { HealthCheck } from '../../components/HealthCheckComponent';

const CHECKS: HealthCheck[] = [
  { id: 'orphaned_tickets', name: 'بلاغات يتيمة', description: 'بلاغات بدون فرع أو أصل مرتبط', severity: 'HIGH', status: 'PENDING', fixable: false },
  { id: 'broken_logic_closed', name: 'أخطاء إغلاق', description: 'بلاغات مغلقة بدون تاريخ إغلاق', severity: 'MEDIUM', status: 'PENDING', fixable: true },
  { id: 'negative_stock', name: 'مخزون بالسالب', description: 'قطع غيار برصيد أقل من صفر', severity: 'HIGH', status: 'PENDING', fixable: true },
  { id: 'stale_tickets', name: 'بلاغات مهملة', description: 'بلاغات مفتوحة لأكثر من 30 يوم', severity: 'LOW', status: 'PENDING', fixable: false },
  { id: 'ghost_assets', name: 'أصول تائهة', description: 'أصول غير مرتبطة بأي فرع', severity: 'MEDIUM', status: 'PENDING', fixable: false },
];

const SystemDoctor: React.FC = () => {
  const [checks, setChecks] = useState<HealthCheck[]>(CHECKS);
  const [isRunning, setIsRunning] = useState(false);
  const [healthScore, setHealthScore] = useState(100);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const newChecks = [...checks];
    let failCount = 0;

    // 1. Check Orphaned Tickets (Mock query logic)
    const { count: orphanedCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).is('asset_id', null);
    newChecks[0].status = (orphanedCount || 0) > 0 ? 'FAIL' : 'PASS';
    newChecks[0].count = orphanedCount || 0;
    if (orphanedCount) failCount++;

    // 2. Check Broken Logic
    const { count: logicCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'CLOSED').is('closed_at', null);
    newChecks[1].status = (logicCount || 0) > 0 ? 'FAIL' : 'PASS';
    newChecks[1].count = logicCount || 0;
    if (logicCount) failCount++;

    // 3. Negative Stock
    const { count: stockCount } = await supabase.from('spare_parts').select('*', { count: 'exact', head: true }).lt('current_stock', 0);
    newChecks[2].status = (stockCount || 0) > 0 ? 'FAIL' : 'PASS';
    newChecks[2].count = stockCount || 0;
    if (stockCount) failCount++;

    // 4. Stale Tickets
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: staleCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'OPEN').lt('created_at', thirtyDaysAgo.toISOString());
    newChecks[3].status = (staleCount || 0) > 0 ? 'FAIL' : 'PASS';
    newChecks[3].count = staleCount || 0;
    if (staleCount) failCount++;

    // 5. Ghost Assets
    const { count: ghostCount } = await supabase.from('maintenance_assets').select('*', { count: 'exact', head: true }).is('branch_id', null);
    newChecks[4].status = (ghostCount || 0) > 0 ? 'FAIL' : 'PASS';
    newChecks[4].count = ghostCount || 0;
    if (ghostCount) failCount++;

    setChecks(newChecks);
    setHealthScore(Math.max(0, 100 - (failCount * 20)));
    setIsRunning(false);
  };

  const fixIssue = async (checkId: string) => {
    if (checkId === 'broken_logic_closed') {
      if(confirm("سيتم تحديث تاريخ الإغلاق لجميع البلاغات المغلقة بالتوقيت الحالي. هل أنت متأكد؟")) {
        await supabase.from('tickets').update({ closed_at: new Date().toISOString() }).eq('status', 'CLOSED').is('closed_at', null);
        runDiagnostics();
      }
    } else if (checkId === 'negative_stock') {
      if(confirm("سيتم تصفير المخزون لجميع القطع ذات الرصيد السالب. هل أنت متأكد؟")) {
        // Requires a stored procedure or loop in real app, simplistic approach here is tricky without RPC
        // Assuming we mock success for UI demo
        alert("يرجى تشغيل وظيفة التصحيح من قاعدة البيانات مباشرة (RPC required).");
      }
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="max-w-5xl mx-auto pb-20 p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-red-600" />
            طبيب النظام (System Doctor)
          </h1>
          <p className="text-gray-500">فحص سلامة البيانات واكتشاف الأخطاء المنطقية.</p>
        </div>
        <button 
          onClick={runDiagnostics}
          disabled={isRunning}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all font-bold"
        >
          <RefreshCw size={20} className={isRunning ? 'animate-spin' : ''} />
          إعادة الفحص
        </button>
      </div>

      {/* Health Score Card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
         <div className={`absolute top-0 right-0 w-2 h-full ${healthScore > 80 ? 'bg-green-500' : healthScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
         
         <div className="flex-1">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">{healthScore}%</h2>
            <p className="text-gray-500 font-medium">مؤشر صحة النظام العام</p>
            <div className="w-full bg-gray-100 h-3 rounded-full mt-4 overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ease-out ${healthScore > 80 ? 'bg-green-500' : healthScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                 style={{ width: `${healthScore}%` }}
               ></div>
            </div>
         </div>

         <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
               <CheckCircle size={18} />
               {checks.filter(c => c.status === 'PASS').length} سليم
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg">
               <XCircle size={18} />
               {checks.filter(c => c.status === 'FAIL').length} أخطاء
            </div>
         </div>
      </div>

      {/* Checks List */}
      <div className="grid grid-cols-1 gap-4">
         {checks.map(check => (
           <HealthCheckComponent key={check.id} check={check} onFix={fixIssue} />
         ))}
      </div>
    </div>
  );
};

export default SystemDoctor;
