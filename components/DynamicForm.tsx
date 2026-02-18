
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { FormField } from '../types';
import { Camera, Video, MapPin, X, AlertCircle, Loader2, CheckCircle, Plus, Minus } from 'lucide-react';

interface DynamicFormProps {
  formKey: string;
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ 
  formKey, 
  onSubmit, 
  initialData = {},
  submitLabel = "إرسال البيانات",
  isSubmitting = false
}) => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [locatingField, setLocatingField] = useState<string | null>(null);

  useEffect(() => {
    const loadSchema = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('ui_schemas')
          .select('schema_definition')
          .eq('form_key', formKey)
          .single();
          
        if (error) throw error;
        
        if (data?.schema_definition?.fields) {
          setFields(data.schema_definition.fields);
        }
      } catch (err) {
        console.error("Failed to load schema:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSchema();
  }, [formKey]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const newErr = { ...prev };
        delete newErr[key];
        return newErr;
      });
    }
  };

  const handleFileUpload = async (key: string, file: File, type: 'image' | 'video') => {
    if (!file) return;
    setUploadingField(key);
    
    // Create a local preview
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate upload delay
    const previewUrl = URL.createObjectURL(file);
    
    handleChange(key, previewUrl);
    setUploadingField(null);
  };

  const handleLocation = (key: string) => {
    if (!navigator.geolocation) {
      alert("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setLocatingField(key);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const locString = `${pos.coords.latitude},${pos.coords.longitude}`;
        handleChange(key, locString);
        setLocatingField(null);
      },
      (err) => {
        console.error(err);
        alert("فشل في تحديد الموقع. تأكد من تفعيل GPS.");
        setLocatingField(null);
      },
      { enableHighAccuracy: true }
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      if (field.required && (formData[field.key] === undefined || formData[field.key] === '')) {
        newErrors[field.key] = 'هذا الحقل مطلوب';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    } else {
      if (navigator.vibrate) navigator.vibrate(200);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500 gap-2">
      <Loader2 className="animate-spin text-blue-500" size={24} />
      <span>جاري تحميل النموذج...</span>
    </div>
  );

  if (fields.length === 0) return (
    <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
      لا توجد حقول إضافية لهذا الإجراء.
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-right" dir="rtl">
      {fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <label className="block text-sm font-bold text-gray-800">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>

          {field.type === 'text' && (
            <input
              type="text"
              className={`w-full p-3 bg-white text-gray-900 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 ${errors[field.key] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              placeholder={field.placeholder || field.label}
              value={formData[field.key] || ''}
              onChange={e => handleChange(field.key, e.target.value)}
            />
          )}

          {/* New Paragraph Type */}
          {field.type === 'paragraph' && (
            <textarea
              rows={4}
              className={`w-full p-3 bg-white text-gray-900 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 ${errors[field.key] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              placeholder={field.placeholder || "أدخل التفاصيل..."}
              value={formData[field.key] || ''}
              onChange={e => handleChange(field.key, e.target.value)}
            />
          )}

          {field.type === 'number' && (
            <input
              type="number"
              className={`w-full p-3 bg-white text-gray-900 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 ${errors[field.key] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              placeholder="0"
              value={formData[field.key] || ''}
              onChange={e => handleChange(field.key, e.target.value)}
            />
          )}

          {/* New Quantity Type */}
          {field.type === 'quantity' && (
            <div className="flex items-center gap-3">
               <button 
                 type="button" 
                 onClick={() => handleChange(field.key, Math.max(0, (parseInt(formData[field.key] || '0') - 1)))}
                 className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
               >
                 <Minus size={20} />
               </button>
               <input
                type="number"
                className={`w-24 text-center p-3 bg-white text-gray-900 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg ${errors[field.key] ? 'border-red-500' : 'border-gray-300'}`}
                value={formData[field.key] || '0'}
                onChange={e => handleChange(field.key, e.target.value)}
               />
               <button 
                 type="button" 
                 onClick={() => handleChange(field.key, (parseInt(formData[field.key] || '0') + 1))}
                 className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
               >
                 <Plus size={20} />
               </button>
            </div>
          )}

          {field.type === 'select' && (
            <div className="relative">
               <select
                className={`w-full p-3 bg-white text-gray-900 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none ${errors[field.key] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                value={formData[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
              >
                <option value="" className="text-gray-400">اختر من القائمة...</option>
                {field.options?.map((opt: string) => (
                  <option key={opt} value={opt} className="text-gray-900">{opt}</option>
                ))}
              </select>
            </div>
          )}

          {/* New Radio Type */}
          {field.type === 'radio' && (
            <div className={`space-y-2 p-3 border rounded-xl ${errors[field.key] ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
               {field.options?.map((opt: string) => (
                  <label key={opt} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                     <div className="relative flex items-center">
                        <input 
                           type="radio"
                           name={field.key}
                           value={opt}
                           checked={formData[field.key] === opt}
                           onChange={() => handleChange(field.key, opt)}
                           className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                     </div>
                     <span className="text-gray-700">{opt}</span>
                  </label>
               ))}
            </div>
          )}

          {field.type === 'date' && (
            <input
              type="date"
              className={`w-full p-3 bg-white text-gray-900 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors[field.key] ? 'border-red-500' : 'border-gray-300'}`}
              value={formData[field.key] || ''}
              onChange={e => handleChange(field.key, e.target.value)}
            />
          )}

          {field.type === 'checkbox' && (
             <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors ${errors[field.key] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
               <div className="relative flex items-center">
                 <input 
                   type="checkbox"
                   checked={!!formData[field.key]}
                   onChange={e => handleChange(field.key, e.target.checked)}
                   className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:border-blue-500 checked:bg-blue-500 focus:ring-2 focus:ring-blue-500"
                 />
                 <CheckCircle className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" size={14} />
               </div>
               <span className="text-gray-700 font-medium">{field.description || field.label}</span>
             </label>
          )}

          {/* New Location Type */}
          {field.type === 'location' && (
             <div className={`border rounded-xl p-3 ${errors[field.key] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                {formData[field.key] ? (
                   <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                         <MapPin size={20} />
                         <span className="font-mono text-sm">{formData[field.key]}</span>
                      </div>
                      <button type="button" onClick={() => handleChange(field.key, '')} className="text-red-500 p-1">
                         <X size={18} />
                      </button>
                   </div>
                ) : (
                   <button 
                     type="button" 
                     onClick={() => handleLocation(field.key)}
                     disabled={locatingField === field.key}
                     className="w-full py-3 bg-blue-50 text-blue-600 rounded-lg border border-dashed border-blue-300 hover:bg-blue-100 flex items-center justify-center gap-2 font-bold"
                   >
                      {locatingField === field.key ? <Loader2 className="animate-spin" /> : <MapPin />}
                      تحديد الموقع الحالي
                   </button>
                )}
             </div>
          )}

          {field.type === 'image' && (
            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${errors[field.key] ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
               {formData[field.key] ? (
                 <div className="relative inline-block group">
                   <img src={formData[field.key]} alt="Captured" className="h-40 rounded-lg shadow-md object-cover" />
                   <button 
                     type="button"
                     onClick={() => handleChange(field.key, null)}
                     className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                   >
                     <X size={16} />
                   </button>
                 </div>
               ) : (
                 <label className="flex flex-col items-center cursor-pointer py-4">
                    {uploadingField === field.key ? (
                       <Loader2 size={32} className="text-blue-600 animate-spin mb-2" />
                    ) : (
                       <div className="bg-blue-100 p-4 rounded-full mb-2 group-hover:bg-blue-200 transition-colors">
                          <Camera size={32} className="text-blue-600" />
                       </div>
                    )}
                    <span className="font-bold text-blue-600">التقاط صورة</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(field.key, e.target.files[0], 'image')}
                      disabled={uploadingField === field.key}
                    />
                 </label>
               )}
            </div>
          )}

          {/* New Video Type */}
          {field.type === 'video' && (
            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${errors[field.key] ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
               {formData[field.key] ? (
                 <div className="relative inline-block group">
                   <video src={formData[field.key]} controls className="h-40 rounded-lg shadow-md bg-black" />
                   <button 
                     type="button"
                     onClick={() => handleChange(field.key, null)}
                     className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                   >
                     <X size={16} />
                   </button>
                 </div>
               ) : (
                 <label className="flex flex-col items-center cursor-pointer py-4">
                    {uploadingField === field.key ? (
                       <Loader2 size={32} className="text-red-600 animate-spin mb-2" />
                    ) : (
                       <div className="bg-red-100 p-4 rounded-full mb-2 group-hover:bg-red-200 transition-colors">
                          <Video size={32} className="text-red-600" />
                       </div>
                    )}
                    <span className="font-bold text-red-600">تسجيل فيديو</span>
                    <input 
                      type="file" 
                      accept="video/*" 
                      capture="environment"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(field.key, e.target.files[0], 'video')}
                      disabled={uploadingField === field.key}
                    />
                 </label>
               )}
            </div>
          )}

          {errors[field.key] && (
            <p className="text-red-500 text-sm flex items-center gap-1 font-medium animate-pulse">
               <AlertCircle size={14} /> {errors[field.key]}
            </p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isSubmitting || !!uploadingField || !!locatingField}
        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting && <Loader2 className="animate-spin" size={20} />}
        {isSubmitting ? 'جاري الإرسال...' : submitLabel}
      </button>
    </form>
  );
};

export default DynamicForm;
