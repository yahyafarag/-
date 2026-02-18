
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FormField, UISchema } from '../../types';
import { AlertCircle, Upload, Check, X } from 'lucide-react';

interface DynamicFormRendererProps {
  formKey: string;
  initialData?: Record<string, any>;
  onSubmit?: (data: Record<string, any>) => void;
  submitLabel?: string;
  onCancel?: () => void;
}

const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({ 
  formKey, 
  initialData = {}, 
  onSubmit, 
  submitLabel = "حفظ البيانات",
  onCancel
}) => {
  const [schema, setSchema] = useState<UISchema | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  // Fetch Schema Logic
  useEffect(() => {
    const fetchSchema = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('ui_schemas')
          .select('schema_definition')
          .eq('form_key', formKey)
          .single();

        if (error) throw error;
        if (data) {
          setSchema(data.schema_definition);
        }
      } catch (err) {
        console.error("فشل تحميل النموذج:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchema();
  }, [formKey]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user types
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleImageUpload = async (key: string, file: File) => {
    setUploading(key);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `form-uploads/${fileName}`;

      // Mock upload for now or implement real Supabase storage
      // const { error: uploadError } = await supabase.storage.from('assets').upload(filePath, file);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUrl = URL.createObjectURL(file); // For preview only in this demo

      handleChange(key, mockUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('فشل رفع الصورة');
    } finally {
      setUploading(null);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    schema?.fields.forEach(field => {
      if (field.required && !formData[field.key]) {
        newErrors[field.key] = 'هذا الحقل مطلوب';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      if (onSubmit) onSubmit(formData);
    } else {
      // Scroll to first error?
      alert('يرجى ملء جميع الحقول المطلوبة');
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-500">جاري تحميل النموذج...</div>;
  if (!schema) return <div className="text-center py-8 text-red-500">لم يتم العثور على نموذج لهذا الإجراء ({formKey})</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-right" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schema.fields.map((field) => (
          <div key={field.key} className={field.type === 'paragraph' || field.type === 'image' ? 'col-span-1 md:col-span-2' : 'col-span-1'}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>

            {/* Render Input based on Type */}
            {field.type === 'text' && (
              <input
                type="text"
                value={formData[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-gray-900 ${errors[field.key] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                placeholder={field.placeholder}
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                value={formData[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-gray-900 ${errors[field.key] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
            )}

            {field.type === 'paragraph' && (
              <textarea
                value={formData[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-gray-900 ${errors[field.key] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                placeholder={field.placeholder}
              />
            )}

            {field.type === 'select' && (
              <select
                value={formData[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 transition-all ${errors[field.key] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              >
                <option value="" className="text-gray-400">اختر من القائمة...</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt} className="text-gray-900">{opt}</option>
                ))}
              </select>
            )}

            {field.type === 'checkbox' && (
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={!!formData[field.key]}
                  onChange={e => handleChange(field.key, e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">{field.description || field.label}</span>
              </label>
            )}

            {field.type === 'image' && (
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${errors[field.key] ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'}`}>
                {formData[field.key] ? (
                  <div className="relative inline-block">
                    <img src={formData[field.key]} alt="Preview" className="h-32 rounded-lg shadow-sm" />
                    <button
                      type="button"
                      onClick={() => handleChange(field.key, null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                     {uploading === field.key ? (
                       <div className="flex flex-col items-center">
                         <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                         <span className="text-sm text-gray-500">جاري الرفع...</span>
                       </div>
                     ) : (
                       <>
                         <Upload className="mx-auto h-8 w-8 text-gray-400" />
                         <label className="block text-sm text-blue-600 font-semibold cursor-pointer hover:underline">
                           <span>اضغط لرفع صورة</span>
                           <input
                             type="file"
                             className="hidden"
                             accept="image/*"
                             onChange={e => e.target.files?.[0] && handleImageUpload(field.key, e.target.files[0])}
                           />
                         </label>
                         <p className="text-xs text-gray-500">PNG, JPG حتى 5MB</p>
                       </>
                     )}
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {errors[field.key] && (
              <p className="flex items-center gap-1 text-sm text-red-500 mt-1">
                <AlertCircle size={14} />
                {errors[field.key]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
        )}
        <button
          type="submit"
          className="px-8 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default DynamicFormRenderer;
