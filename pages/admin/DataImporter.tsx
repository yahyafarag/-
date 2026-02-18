
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useStore } from '../../services/store';
import { parseImportData } from '../../services/geminiService';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Database, 
  CheckCircle, 
  Loader2, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

const DataImporter: React.FC = () => {
  const { user, fetchSystemMetadata } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [targetTable, setTargetTable] = useState<'assets' | 'branches'>('assets');
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  
  // Lookup Data for Resolution
  const [refData, setRefData] = useState<{branches: any[], areas: any[]}>({ branches: [], areas: [] });

  useEffect(() => {
    // Pre-fetch reference data to map Names -> UUIDs
    const loadRefs = async () => {
       const { data: b } = await supabase.from('branches').select('id, name');
       const { data: a } = await supabase.from('areas').select('id, name');
       setRefData({ branches: b || [], areas: a || [] });
    };
    loadRefs();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setProcessedData([]);
      setStep(1);
      setLog([]);
    }
  };

  const processFileLocally = async () => {
    if (!file) return;
    setLoading(true);
    setLog(prev => [...prev, "بدء قراءة الملف..."]);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);
      
      setLog(prev => [...prev, `تم استخراج ${json.length} صف. جاري التحليل بالذكاء الاصطناعي...`]);
      
      // 1. AI Mapping (Excel Headers -> DB Columns)
      let mappedData = await parseImportData(json as any[], targetTable);

      // 2. Smart Resolution (Names -> IDs)
      setLog(prev => [...prev, "جاري مطابقة الأسماء مع قاعدة البيانات (Smart Resolution)..."]);
      
      mappedData = mappedData.map(row => {
          // Resolve Branch Name -> UUID
          if (targetTable === 'assets' && row.branch_id && typeof row.branch_id === 'string') {
              const match = refData.branches.find(b => 
                  b.name.trim().toLowerCase() === row.branch_id.trim().toLowerCase() ||
                  b.name.includes(row.branch_id)
              );
              if (match) {
                  row.branch_id = match.id;
              } else {
                  // Fallback: Default to first branch if not found to prevent FK error
                  row.branch_id = refData.branches[0]?.id; 
              }
          }

          // Resolve Area Name -> UUID
          if (targetTable === 'branches' && row.area_id && typeof row.area_id === 'string') {
              const match = refData.areas.find(a => a.name === row.area_id);
              if (match) row.area_id = match.id;
              else delete row.area_id;
          }
          return row;
      });
      
      setProcessedData(mappedData);
      setLog(prev => [...prev, `تم تجهيز ${mappedData.length} سجل للرفع.`]);
      setStep(2);

    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء المعالجة");
    } finally {
      setLoading(false);
    }
  };

  const uploadToSupabase = async () => {
    if (processedData.length === 0) return;
    setLoading(true);
    const tableName = targetTable === 'assets' ? 'maintenance_assets' : 'branches';

    try {
      const { error } = await supabase.from(tableName).insert(processedData);
      if (error) throw error;
      
      await fetchSystemMetadata();
      setStep(3);
      setLog(prev => [...prev, "✅ تمت عملية الرفع بنجاح!"]);
    } catch (error: any) {
      alert("فشل الرفع: " + error.message);
      setLog(prev => [...prev, `❌ خطأ: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ADMIN') return <div className="p-10 text-center text-red-500">وصول غير مصرح به</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20 p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="text-blue-600" />
          استيراد البيانات الذكي
        </h1>
        <p className="text-gray-600">نظام استيراد البيانات الضخمة (Assets & Branches) من Excel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <label className="block text-sm font-bold text-gray-800 mb-2">1. نوع البيانات</label>
             <select 
               value={targetTable}
               onChange={(e) => setTargetTable(e.target.value as any)}
               className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900 font-medium"
               disabled={step > 1}
             >
               <option value="assets" className="text-gray-900">الأصول والمعدات (Assets)</option>
               <option value="branches" className="text-gray-900">الفروع (Branches)</option>
             </select>
             <p className="text-xs text-gray-500 mt-2">
                * ملاحظة: يجب أن تكون أسماء الفروع/المناطق مطابقة لما هو موجود في النظام للربط التلقائي.
             </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <label className="block text-sm font-bold text-gray-800 mb-2">2. ملف البيانات (Excel/CSV)</label>
             <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 relative">
                <input 
                  type="file" 
                  accept=".csv, .xlsx, .xls" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={step > 1}
                />
                <FileSpreadsheet className="mx-auto text-green-600 mb-2" size={32} />
                <p className="text-sm text-gray-700 font-medium">
                  {file ? file.name : "اضغط لرفع الملف"}
                </p>
             </div>
          </div>

          {step === 1 && (
            <button 
              onClick={processFileLocally}
              disabled={!file || loading}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
              معالجة وتحليل الملف
            </button>
          )}

          {step === 2 && (
             <div className="space-y-3">
               <button 
                 onClick={uploadToSupabase}
                 disabled={loading}
                 className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 flex justify-center items-center gap-2"
               >
                 {loading ? <Loader2 className="animate-spin" /> : <Database />}
                 تأكيد ورفع لقاعدة البيانات
               </button>
               <button 
                 onClick={() => setStep(1)}
                 className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200"
               >
                 <ArrowLeft className="inline ml-1" size={18} /> تراجع
               </button>
             </div>
          )}
          
          <div className="bg-slate-900 text-green-400 p-4 rounded-xl font-mono text-xs h-40 overflow-y-auto dir-ltr">
            {log.map((l, i) => <div key={i}>&gt; {l}</div>)}
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
           <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <h3 className="font-bold text-gray-900">معاينة البيانات المعالجة</h3>
             <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{processedData.length} سجل</span>
           </div>
           
           <div className="flex-1 overflow-auto p-4">
              {step === 2 && processedData.length > 0 ? (
                <div className="space-y-4">
                   <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex gap-2 text-yellow-800 text-sm">
                      <AlertTriangle size={18} className="shrink-0" />
                      <div>
                        تمت مطابقة أسماء الفروع/المناطق مع المعرفات (UUIDs). يرجى التأكد من صحة عمود <code>branch_id</code> أو <code>area_id</code> أدناه.
                      </div>
                   </div>
                   <table className="w-full text-sm text-right border-collapse">
                       <thead>
                         <tr className="bg-gray-100 sticky top-0">
                           {Object.keys(processedData[0]).map(k => (
                             <th key={k} className="p-2 border border-gray-200 whitespace-nowrap text-gray-800 font-bold">{k}</th>
                           ))}
                         </tr>
                       </thead>
                       <tbody>
                         {processedData.slice(0, 50).map((row, i) => (
                           <tr key={i} className="hover:bg-gray-50">
                             {Object.values(row).map((v: any, j) => (
                               <td key={j} className="p-2 border border-gray-200 truncate max-w-[150px] text-gray-900">{String(v)}</td>
                             ))}
                           </tr>
                         ))}
                       </tbody>
                   </table>
                </div>
              ) : step === 3 ? (
                <div className="flex flex-col items-center justify-center h-full text-green-600 space-y-4">
                  <CheckCircle size={64} />
                  <h3 className="text-2xl font-bold">تم الرفع بنجاح!</h3>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                   <FileSpreadsheet size={48} className="mb-4 opacity-20" />
                   <p>بانتظار الملف...</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DataImporter;
