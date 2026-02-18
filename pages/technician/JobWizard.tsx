
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../services/store';
import { calculateDistance } from '../../utils/geo';
import DynamicFormRenderer from '../../components/forms/DynamicFormRenderer';
import { 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  Camera, 
  ArrowRight, 
  ArrowLeft,
  Package,
  History,
  Info,
  X
} from 'lucide-react';

const steps = [
  { id: 1, label: 'الموقع', icon: MapPin },
  { id: 2, label: 'التشخيص', icon: Wrench },
  { id: 3, label: 'القطع', icon: Package },
  { id: 4, label: 'الإغلاق', icon: CheckCircle },
];

const JobWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tickets, assets, config, parts, completeTicket } = useStore();
  
  const ticket = tickets.find(t => t.id === id);
  const asset = assets.find(a => a.id === ticket?.assetId);
  const assetHistory = tickets.filter(t => t.assetId === asset?.id && t.status === 'CLOSED');

  const [currentStep, setCurrentStep] = useState(1);
  const [locationVerified, setLocationVerified] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<any>({});
  const [selectedParts, setSelectedParts] = useState<{partId: string, quantity: number}[]>([]);
  const [closureData, setClosureData] = useState({ notes: '', image: '' });
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Geofence Check
  const verifyLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("المتصفح لا يدعم تحديد الموقع");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        // Mock ticket location if missing
        const targetLat = ticket?.location.lat || 24.7136; 
        const targetLng = ticket?.location.lng || 46.6753;

        const dist = calculateDistance(userLat, userLng, targetLat, targetLng);
        setDistance(Math.round(dist));

        if (dist <= config.geofenceRadius) {
          setLocationVerified(true);
          setErrorMsg('');
        } else {
          setErrorMsg(`أنت بعيد عن الموقع بمسافة ${Math.round(dist)} متر. (المسموح: ${config.geofenceRadius} متر)`);
        }
      },
      (err) => setErrorMsg("فشل في تحديد الموقع. تأكد من تفعيل GPS.")
    );
  };

  // Step 3: Parts Logic
  const handleAddPart = (partId: string) => {
    const part = parts.find(p => p.id === partId);
    if (!part || part.stock <= 0) return;

    const existing = selectedParts.find(p => p.partId === partId);
    if (existing) {
      if (existing.quantity < part.stock) {
        setSelectedParts(selectedParts.map(p => p.partId === partId ? {...p, quantity: p.quantity + 1} : p));
      }
    } else {
      setSelectedParts([...selectedParts, { partId, quantity: 1 }]);
    }
  };

  const handleRemovePart = (partId: string) => {
    setSelectedParts(selectedParts.filter(p => p.partId !== partId));
  };

  const totalCost = selectedParts.reduce((acc, curr) => {
    const p = parts.find(part => part.id === curr.partId);
    return acc + (p ? p.price * curr.quantity : 0);
  }, 0);

  // Final Submit
  const handleSubmit = () => {
    if (!ticket) return;
    completeTicket(ticket.id, {
      diagnosis: diagnosisData,
      partsUsed: selectedParts,
      notes: closureData.notes,
      finalImage: closureData.image
    });
    navigate('/my-tickets');
  };

  if (!ticket || !asset) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20">
      {/* Header & Stepper */}
      <div className="bg-white shadow-sm pt-4 pb-2 px-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)}><ArrowRight /></button>
          <span className="font-bold text-gray-800">تنفيذ المهمة #{ticket.id}</span>
          <div className="w-6"></div>
        </div>
        
        <div className="flex justify-between relative px-2">
          {steps.map((step, idx) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <div key={step.id} className="flex flex-col items-center z-10 relative">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                   isActive ? 'bg-blue-600 text-white scale-110 shadow-lg' : 
                   isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                 }`}>
                   <step.icon size={18} />
                 </div>
                 <span className={`text-xs mt-1 font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{step.label}</span>
              </div>
            );
          })}
          {/* Progress Line */}
          <div className="absolute top-5 left-4 right-4 h-0.5 bg-gray-200 -z-0">
             <div 
               className="h-full bg-blue-500 transition-all duration-300" 
               style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
             ></div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        
        {/* Step 1: Geo Location */}
        {currentStep === 1 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
             <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                <MapPin size={48} className="text-blue-500" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-800">التحقق من الموقع</h2>
               <p className="text-gray-500 mt-2">يجب أن تكون داخل نطاق الفرع للبدء.</p>
             </div>
             
             {errorMsg && (
               <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm text-right w-full">
                 <AlertTriangle size={20} className="shrink-0" />
                 {errorMsg}
               </div>
             )}

             {locationVerified ? (
               <div className="text-green-600 font-bold flex flex-col items-center animate-in zoom-in">
                 <CheckCircle size={32} className="mb-2" />
                 تم تأكيد الموقع بنجاح
               </div>
             ) : (
               <button 
                onClick={verifyLocation}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
               >
                 تحقق من موقعي الآن
               </button>
             )}
          </div>
        )}

        {/* Step 2: Diagnosis */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Asset Info */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
               <img src={asset.image} className="w-20 h-20 rounded-lg object-cover" alt="asset" />
               <div>
                  <h3 className="font-bold text-gray-800">{asset.name}</h3>
                  <p className="text-sm text-gray-500">{asset.serialNumber}</p>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">{asset.category}</span>
               </div>
            </div>

            {/* History */}
            {assetHistory.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-3 text-gray-600 font-semibold">
                   <History size={18} /> سجل الأعطال السابق
                </div>
                <div className="space-y-2">
                  {assetHistory.slice(0, 2).map(h => (
                    <div key={h.id} className="text-sm bg-white p-3 rounded-lg border border-gray-100">
                       <p className="text-gray-800 font-medium">{h.title}</p>
                       <p className="text-gray-500 text-xs mt-1">{new Date(h.updatedAt).toLocaleDateString('ar-EG')} - {h.diagnosis}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <h3 className="font-bold mb-4">تقرير التشخيص</h3>
               <DynamicFormRenderer 
                 formKey="ticket_diagnosis" // Using the schema defined in constants/store
                 initialData={diagnosisData}
                 submitLabel="حفظ ومتابعة"
                 onSubmit={(data) => {
                   setDiagnosisData(data);
                   setCurrentStep(3);
                 }}
               />
            </div>
            {/* Hide default Next button here as Form handles it */}
            <div className="hidden"></div> 
          </div>
        )}

        {/* Step 3: Spare Parts */}
        {currentStep === 3 && (
          <div className="space-y-6">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
               <Info className="text-blue-500 shrink-0 mt-1" size={20} />
               <p className="text-sm text-blue-800">اختر قطع الغيار المستهلكة من القائمة أدناه. سيتم خصمها من المخزون تلقائياً.</p>
             </div>

             {/* Selector */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">إضافة قطعة</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-900"
                  onChange={(e) => handleAddPart(e.target.value)}
                  value=""
                >
                  <option value="" className="text-gray-400">اختر قطعة...</option>
                  {parts.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stock === 0} className="text-gray-900">
                      {p.name} (المتوفر: {p.stock}) - {p.price} ج.م
                    </option>
                  ))}
                </select>
             </div>

             {/* Selected List */}
             <div className="space-y-3">
               {selectedParts.map((item) => {
                 const part = parts.find(p => p.id === item.partId);
                 if (!part) return null;
                 return (
                   <div key={item.partId} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                         <img src={part.image} className="w-10 h-10 rounded bg-gray-100" />
                         <div>
                            <p className="font-bold text-sm text-gray-800">{part.name}</p>
                            <p className="text-xs text-gray-500">{part.price * item.quantity} ج.م</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="font-mono font-bold bg-gray-100 px-3 py-1 rounded">{item.quantity}</span>
                         <button onClick={() => handleRemovePart(item.partId)} className="text-red-500 p-2"><X size={18} /></button>
                      </div>
                   </div>
                 );
               })}
               {selectedParts.length === 0 && (
                 <div className="text-center text-gray-400 py-8 border-2 border-dashed rounded-xl">
                   لا يوجد قطع مضافة
                 </div>
               )}
             </div>

             {/* Total */}
             <div className="flex justify-between items-center pt-4 border-t border-gray-200">
               <span className="font-bold text-gray-600">التكلفة التقديرية</span>
               <span className="font-bold text-xl text-blue-600">{totalCost} ج.م</span>
             </div>
          </div>
        )}

        {/* Step 4: Closure */}
        {currentStep === 4 && (
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center space-y-4">
                <div className="inline-block p-4 bg-gray-50 rounded-full border-2 border-dashed border-gray-300">
                   <Camera size={32} className="text-gray-400" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-blue-600 cursor-pointer">
                     التقاط صورة بعد الإصلاح
                     <input type="file" className="hidden" accept="image/*" />
                   </label>
                   <p className="text-xs text-gray-400 mt-1">اختياري</p>
                </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات الفني النهائية</label>
               <textarea 
                 rows={4}
                 className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                 placeholder="اكتب تفاصيل ما تم إنجازه..."
                 value={closureData.notes}
                 onChange={(e) => setClosureData({...closureData, notes: e.target.value})}
               ></textarea>
             </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="bg-white p-4 border-t border-gray-200 flex gap-3">
        {currentStep > 1 && (
          <button 
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-600 font-bold"
          >
            السابق
          </button>
        )}
        
        {currentStep < 4 && currentStep !== 2 && ( // Step 2 has its own submit
          <button 
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={currentStep === 1 && !locationVerified}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg disabled:bg-gray-300 disabled:shadow-none transition-all"
          >
            التالي
          </button>
        )}

        {currentStep === 4 && (
          <button 
            onClick={handleSubmit}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            إغلاق البلاغ
          </button>
        )}
      </div>
    </div>
  );
};

export default JobWizard;
