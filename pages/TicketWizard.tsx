
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../services/store';
import { supabase } from '../services/supabase'; // Import supabase directly for hierarchy lookup
import DynamicForm from '../components/DynamicForm';
import { analyzeTicket } from '../services/geminiService';
import { Ticket, TicketPriority } from '../types';
import { ArrowRight, Sparkles, AlertTriangle, PhoneCall, MapPin, User, Calendar, Clock, Building, Map as MapIcon, Layers, Camera, Image as ImageIcon, X } from 'lucide-react';

const TicketWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preSelectedAssetId = searchParams.get('assetId');
  
  const navigate = useNavigate();
  const { tickets, assets, user, addTicket, updateTicket, config } = useStore();

  const isNew = !id || id === 'new';
  const existingTicket = tickets.find(t => t.id === id);

  // Core fields state
  const [coreData, setCoreData] = useState({
    title: existingTicket?.title || '',
    description: existingTicket?.description || '',
    assetId: existingTicket?.assetId || preSelectedAssetId || '',
    priority: existingTicket?.priority || 'MEDIUM' as TicketPriority,
    location: existingTicket?.location || { lat: 0, lng: 0 },
    faultType: existingTicket?.faultType || '',
    imageUrl: existingTicket?.imageUrl || ''
  });

  // Hierarchy Data (Auto-filled)
  const [hierarchy, setHierarchy] = useState({
    branch: '',
    area: '',
    sector: ''
  });

  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Auto-fill Date, Time, Reporter (Calculated on render/submit, displayed in UI)
  const currentDateTime = new Date();

  // 2. Get Geolocation (Auto)
  useEffect(() => {
    if (isNew && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCoreData(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
      });
    }
  }, [isNew]);

  // 3. Auto-fill Hierarchy when Asset Changes
  useEffect(() => {
    const fetchAssetHierarchy = async () => {
      if (!coreData.assetId) {
        setHierarchy({ branch: '', area: '', sector: '' });
        return;
      }

      const asset = assets.find(a => a.id === coreData.assetId);
      if (asset && asset.branchId) {
        // Fetch Branch -> Area -> Sector
        const { data, error } = await supabase
          .from('branches')
          .select('name, areas(name, sectors(name))')
          .eq('id', asset.branchId)
          .single();
        
        if (data) {
          setHierarchy({
            branch: data.name,
            area: data.areas?.name || 'غير محدد',
            sector: data.areas?.sectors?.name || 'غير محدد'
          });
        }
      }
    };

    fetchAssetHierarchy();
  }, [coreData.assetId, assets]);

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const file = e.target.files[0];
      // Simulate upload delay and create local URL for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      const url = URL.createObjectURL(file);
      setCoreData(prev => ({ ...prev, imageUrl: url }));
      setIsUploading(false);
    }
  };

  // AI Analysis Logic
  const handleAIAnalysis = async () => {
    if (!coreData.description || !coreData.assetId) {
      alert("يرجى اختيار المعدة ووصف المشكلة أولاً.");
      return;
    }
    
    const asset = assets.find(a => a.id === coreData.assetId);
    if (!asset) return;

    setIsAnalyzing(true);
    try {
      const resultText = await analyzeTicket(coreData.description, asset.name, asset.category);
      const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const analysis = JSON.parse(cleanJson);
        setAiAnalysis(analysis);
        if (analysis.severity) {
           const severityMap: Record<string, TicketPriority> = {
             'منخفضة': 'LOW', 'متوسطة': 'MEDIUM', 'عالية': 'HIGH', 'حرجة': 'CRITICAL',
             'LOW': 'LOW', 'MEDIUM': 'MEDIUM', 'HIGH': 'HIGH', 'CRITICAL': 'CRITICAL'
           };
           const p = severityMap[analysis.severity] || 'MEDIUM';
           setCoreData(prev => ({ ...prev, priority: p }));
        }
      } catch (e) {
        console.error("Failed to parse AI response", e);
        setAiAnalysis({ diagnosis: resultText }); 
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDynamicSubmit = (dynamicData: Record<string, any>) => {
    // Basic Validation for core fields
    if (!coreData.title || !coreData.description || !coreData.assetId || !coreData.faultType) {
      alert('يرجى ملء جميع البيانات الأساسية (المعدة، نوع العطل، العنوان، الوصف)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Prepare Payload
    const ticketPayload: any = {
      ...coreData,
      formData: {
        ...dynamicData,
        // Persist auto-filled data in formData for record keeping
        reporterName: user?.name,
        reportDate: currentDateTime.toISOString(),
        hierarchy: hierarchy,
        faultType: coreData.faultType,
        imageUrl: coreData.imageUrl
      },
      updatedAt: new Date().toISOString(),
    };

    if (isNew) {
      ticketPayload.id = `t${Date.now()}`;
      ticketPayload.technicianId = user?.id; // Or leave empty for manager assignment
      ticketPayload.status = 'OPEN';
      ticketPayload.createdAt = new Date().toISOString();
      addTicket(ticketPayload as Ticket);
    } else {
      updateTicket(id!, ticketPayload);
    }
    navigate('/tickets');
  };

  const selectedAsset = assets.find(a => a.id === coreData.assetId);
  const isWarrantyActive = selectedAsset && new Date(selectedAsset.warrantyExpiry) > new Date();

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-4 sticky top-0 z-10 shadow-sm border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowRight size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{isNew ? 'تسجيل بلاغ عطل' : 'تعديل البلاغ'}</h1>
          <p className="text-xs text-gray-500">تعبئة البيانات الأساسية وتفاصيل العطل</p>
        </div>
      </div>

      <div className="px-4 space-y-6">
        
        {/* 1. Auto-Filled Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
           <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs text-gray-400 mb-1 flex items-center gap-1"><User size={10} /> مبلغ العطل</span>
              <span className="font-bold text-sm text-gray-800">{user?.name}</span>
           </div>
           <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar size={10} /> التاريخ</span>
              <span className="font-bold text-sm text-gray-800 dir-ltr">{currentDateTime.toLocaleDateString('en-GB')}</span>
           </div>
           <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Clock size={10} /> الوقت</span>
              <span className="font-bold text-sm text-gray-800 dir-ltr">{currentDateTime.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</span>
           </div>
           <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs text-gray-400 mb-1 flex items-center gap-1"><MapPin size={10} /> الموقع</span>
              <span className={`font-bold text-xs ${coreData.location.lat ? 'text-green-600' : 'text-gray-400'}`}>
                 {coreData.location.lat ? 'تم التحديد آلياً' : 'جاري التحديد...'}
              </span>
           </div>
        </div>

        {/* 2. Asset & Hierarchy Selection */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
            <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><Building size={18} /></span>
            <h3 className="font-bold text-gray-800">بيانات المعدة والموقع</h3>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">اسم المعدة / الأصل <span className="text-red-500">*</span></label>
            <select 
              value={coreData.assetId}
              onChange={e => setCoreData({...coreData, assetId: e.target.value})}
              className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              required
              disabled={!isNew && !!preSelectedAssetId} 
            >
              <option value="" className="text-gray-400">اختر المعدة...</option>
              {assets.map(a => (
                <option key={a.id} value={a.id} className="text-gray-900">{a.name} ({a.serialNumber})</option>
              ))}
            </select>
          </div>

          {/* Auto-filled Hierarchy Display */}
          {coreData.assetId && (
            <div className="grid grid-cols-3 gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
               <div className="text-center border-l border-blue-100 pl-2">
                  <span className="text-[10px] text-gray-500 block mb-1 flex justify-center items-center gap-1"><MapIcon size={10} /> القطاع</span>
                  <span className="text-xs font-bold text-blue-800">{hierarchy.sector || '-'}</span>
               </div>
               <div className="text-center border-l border-blue-100 pl-2">
                  <span className="text-[10px] text-gray-500 block mb-1 flex justify-center items-center gap-1"><Layers size={10} /> المنطقة</span>
                  <span className="text-xs font-bold text-blue-800">{hierarchy.area || '-'}</span>
               </div>
               <div className="text-center">
                  <span className="text-[10px] text-gray-500 block mb-1 flex justify-center items-center gap-1"><Building size={10} /> الفرع</span>
                  <span className="text-xs font-bold text-blue-800">{hierarchy.branch || '-'}</span>
               </div>
            </div>
          )}

          {/* Warranty Alert */}
          {isWarrantyActive && selectedAsset && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex flex-col gap-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-red-800 font-bold">
                 <AlertTriangle size={20} />
                 <span>المعدة تحت الضمان!</span>
              </div>
              <p className="text-sm text-red-700">
                يرجى عدم الفك أو الإصلاح الداخلي. تواصل مع المورد.
              </p>
              <div className="flex items-center gap-2 mt-1">
                 <span className="bg-white px-2 py-1 rounded text-xs font-bold border border-red-100 text-gray-600">{selectedAsset.supplier}</span>
                 <a href={`tel:${selectedAsset.supplierContact}`} className="bg-green-100 px-2 py-1 rounded text-xs font-bold text-green-700 flex items-center gap-1">
                   <PhoneCall size={12} /> {selectedAsset.supplierContact}
                 </a>
              </div>
            </div>
          )}
        </div>

        {/* 3. Fault Details */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
            <span className="bg-red-100 text-red-600 p-1.5 rounded-lg"><AlertTriangle size={18} /></span>
            <h3 className="font-bold text-gray-800">تفاصيل العطل</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-bold text-gray-700 mb-1">نوع العطل <span className="text-red-500">*</span></label>
               <select 
                 value={coreData.faultType}
                 onChange={e => setCoreData({...coreData, faultType: e.target.value})}
                 className="w-full p-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
               >
                 <option value="">اختر النوع...</option>
                 <option value="كهرباء">كهرباء (Electrical)</option>
                 <option value="ميكانيكا">ميكانيكا (Mechanical)</option>
                 <option value="تبريد">تبريد (Refrigeration)</option>
                 <option value="سوفت وير">نظام / سوفت وير (System)</option>
                 <option value="عام">عام / هيكل (General)</option>
               </select>
             </div>
             
             <div>
               <label className="block text-sm font-bold text-gray-700 mb-1">الأولوية</label>
               <select 
                 value={coreData.priority}
                 onChange={e => setCoreData({...coreData, priority: e.target.value as TicketPriority})}
                 className="w-full p-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
               >
                 <option value="LOW">منخفضة</option>
                 <option value="MEDIUM">متوسطة</option>
                 <option value="HIGH">عالية</option>
                 <option value="CRITICAL">حرجة (توقف إنتاج)</option>
               </select>
             </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">عنوان البلاغ <span className="text-red-500">*</span></label>
            <input 
              type="text"
              value={coreData.title}
              onChange={e => setCoreData({...coreData, title: e.target.value})}
              className="w-full p-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400"
              placeholder="مثال: توقف الخلاط الرئيسي"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">وصف العطل <span className="text-red-500">*</span></label>
            <textarea 
              value={coreData.description}
              onChange={e => setCoreData({...coreData, description: e.target.value})}
              rows={3}
              className="w-full p-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400"
              placeholder="اشرح المشكلة بالتفصيل..."
            />
          </div>

          {/* Image Upload */}
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">صورة العطل</label>
             <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative">
                {coreData.imageUrl ? (
                   <div className="relative inline-block">
                      <img src={coreData.imageUrl} alt="Fault" className="h-40 rounded-lg shadow-sm object-cover" />
                      <button 
                        onClick={() => setCoreData({...coreData, imageUrl: ''})}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                   </div>
                ) : (
                   <label className="cursor-pointer flex flex-col items-center justify-center gap-2 h-full">
                      {isUploading ? (
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      ) : (
                         <>
                           <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                              <Camera size={24} />
                           </div>
                           <span className="text-sm font-medium text-gray-600">التقاط صورة أو اختيار من المعرض</span>
                           <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                         </>
                      )}
                   </label>
                )}
             </div>
          </div>

          {/* AI Analysis */}
          {config.enableAIAnalysis && isNew && (
            <button
              type="button"
              onClick={handleAIAnalysis}
              disabled={isAnalyzing || !coreData.description}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-bold"
            >
              {isAnalyzing ? "جاري التحليل..." : (
                <>
                  <Sparkles size={18} className="text-yellow-300" />
                  تحليل العطل بالذكاء الاصطناعي
                </>
              )}
            </button>
          )}

          {aiAnalysis && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-2 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-purple-800 font-bold">
                 <Sparkles size={18} />
                 <span>التشخيص المقترح</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{aiAnalysis.diagnosis}</p>
            </div>
          )}
        </div>

        {/* Dynamic Fields Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
            <span className="bg-green-100 text-green-600 p-1.5 rounded-lg"><Sparkles size={18} /></span>
            <div>
              <h3 className="font-bold text-gray-800">بيانات إضافية</h3>
              <p className="text-[10px] text-gray-400">حقول مخصصة (إن وجدت)</p>
            </div>
          </div>
           
           <DynamicForm 
             formKey="new_ticket" 
             initialData={existingTicket?.formData || {}}
             onSubmit={handleDynamicSubmit}
             submitLabel={isNew ? "إرسال البلاغ" : "حفظ التعديلات"}
           />
        </div>
      </div>
    </div>
  );
};

export default TicketWizard;
