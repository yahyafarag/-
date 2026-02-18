
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Plus, 
  Trash2, 
  Save, 
  GripVertical, 
  Settings, 
  Smartphone, 
  ArrowUp, 
  ArrowDown, 
  Type, 
  Calendar, 
  Hash, 
  Image as ImageIcon, 
  Video,
  MapPin,
  List,
  CheckSquare,
  CircleDot,
  AlignLeft,
  Calculator
} from 'lucide-react';
import { useStore } from '../../services/store';
import { FieldType, FormField } from '../../types';

const FormBuilder: React.FC = () => {
  const { user } = useStore();
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ui_schemas')
      .select('schema_definition')
      .eq('form_key', 'new_ticket')
      .single();

    if (data?.schema_definition?.fields) {
      setFields(data.schema_definition.fields);
    }
    setLoading(false);
  };

  const handleSaveSchema = async () => {
    setSaving(true);
    const schemaPayload = {
      id: 'new_ticket_schema',
      formKey: 'new_ticket',
      fields: fields
    };

    const { error } = await supabase
      .from('ui_schemas')
      .upsert({
        form_key: 'new_ticket',
        schema_definition: schemaPayload
      }, { onConflict: 'form_key' });

    setSaving(false);
    if (error) {
      alert('فشل الحفظ: ' + error.message);
    } else {
      alert('تم حفظ نموذج "بلاغ عطل جديد" بنجاح ✅');
    }
  };

  const addField = () => {
    const newField: FormField = {
      key: `field_${Date.now()}`,
      label: 'حقل جديد',
      type: 'text',
      required: false,
      placeholder: ''
    };
    setFields([...fields, newField]);
    setSelectedFieldIndex(fields.length); 
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const removeField = (index: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الحقل؟')) {
      const updated = fields.filter((_, i) => i !== index);
      setFields(updated);
      setSelectedFieldIndex(null);
    }
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const updated = [...fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    
    setFields(updated);
    setSelectedFieldIndex(swapIndex);
  };

  const getIconForType = (type: FieldType) => {
    switch (type) {
      case 'text': return <Type size={16} />;
      case 'paragraph': return <AlignLeft size={16} />;
      case 'number': return <Hash size={16} />;
      case 'quantity': return <Calculator size={16} />;
      case 'date': return <Calendar size={16} />;
      case 'image': return <ImageIcon size={16} />;
      case 'video': return <Video size={16} />;
      case 'location': return <MapPin size={16} />;
      case 'select': return <List size={16} />;
      case 'radio': return <CircleDot size={16} />;
      case 'checkbox': return <CheckSquare size={16} />;
      default: return <Type size={16} />;
    }
  };

  if (user?.role !== 'ADMIN') return <div className="p-10 text-center text-red-500 font-bold">وصول غير مصرح به</div>;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      
      {/* LEFT PANEL: Editor */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col border-l border-gray-200 bg-white h-full shadow-lg z-10">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <div>
             <h1 className="font-bold text-gray-800 text-lg">منشئ بلاغ العطل</h1>
             <p className="text-xs text-gray-500">تخصيص الحقول للفنيين</p>
           </div>
           <div className="flex gap-2">
             <button onClick={addField} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors" title="إضافة حقل">
               <Plus size={20} />
             </button>
             <button onClick={handleSaveSchema} disabled={saving} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm" title="حفظ">
               {saving ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <Save size={20} />}
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {fields.length === 0 ? (
            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              <Settings className="mx-auto mb-2 opacity-50" size={32} />
              <p>لا توجد حقول، أضف أول حقل.</p>
            </div>
          ) : (
            fields.map((field, index) => (
              <div 
                key={field.key} 
                className={`border rounded-xl transition-all duration-200 ${
                  selectedFieldIndex === index 
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500' 
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                {/* Header */}
                <div 
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setSelectedFieldIndex(index === selectedFieldIndex ? null : index)}
                >
                  <div className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600">
                    <GripVertical size={18} />
                  </div>
                  <div className="bg-gray-100 p-1.5 rounded-md text-gray-500">
                    {getIconForType(field.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-800">{field.label || 'بدون عنوان'}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{field.type}</p>
                  </div>
                  {field.required && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">مطلوب</span>}
                </div>

                {/* Expanded Details */}
                {selectedFieldIndex === index && (
                  <div className="p-3 pt-0 border-t border-blue-100 space-y-3 animate-in slide-in-from-top-1">
                    <div className="grid grid-cols-2 gap-3 mt-3">
                       <div>
                         <label className="text-[10px] font-bold text-gray-500 mb-1 block">عنوان السؤال</label>
                         <input 
                           type="text" 
                           value={field.label}
                           onChange={(e) => updateField(index, { label: e.target.value })}
                           className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                         />
                       </div>
                       <div>
                         <label className="text-[10px] font-bold text-gray-500 mb-1 block">نوع الإجابة</label>
                         <select 
                           value={field.type}
                           onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                           className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                         >
                            <option value="text">نص قصير (Text)</option>
                            <option value="paragraph">فقرة نصية (Paragraph)</option>
                            <option value="number">رقم (Number)</option>
                            <option value="quantity">كمية (+/-)</option>
                            <option value="select">قائمة منسدلة (Dropdown)</option>
                            <option value="radio">اختيار من متعدد (Radio)</option>
                            <option value="checkbox">مربع اختيار (Checkbox)</option>
                            <option value="date">تاريخ (Date)</option>
                            <option value="image">صورة (Image)</option>
                            <option value="video">فيديو (Video)</option>
                            <option value="location">موقع جغرافي (Location)</option>
                         </select>
                       </div>
                    </div>

                    {(field.type === 'select' || field.type === 'radio') && (
                       <div>
                         <label className="text-[10px] font-bold text-gray-500 mb-1 block">الخيارات (مفصولة بفاصلة)</label>
                         <input 
                           type="text" 
                           value={field.options?.join(',') || ''}
                           onChange={(e) => updateField(index, { options: e.target.value.split(',') })}
                           className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                           placeholder="خيار 1, خيار 2, خيار 3"
                         />
                       </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input 
                           type="checkbox" 
                           checked={field.required}
                           onChange={(e) => updateField(index, { required: e.target.checked })}
                           className="rounded text-blue-600 focus:ring-blue-500"
                         />
                         <span className="text-xs font-bold text-gray-700">حقل إجباري</span>
                       </label>

                       <div className="flex gap-1">
                          <button onClick={() => moveField(index, 'up')} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" disabled={index === 0}>
                            <ArrowUp size={16} />
                          </button>
                          <button onClick={() => moveField(index, 'down')} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" disabled={index === fields.length - 1}>
                            <ArrowDown size={16} />
                          </button>
                          <div className="w-px h-6 bg-gray-200 mx-1"></div>
                          <button onClick={() => removeField(index)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Live Preview */}
      <div className="hidden md:flex flex-1 bg-gray-100 flex-col items-center justify-center p-8 relative">
         <div className="absolute top-0 left-0 right-0 p-4 flex justify-center pointer-events-none">
            <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
              <Smartphone size={14} /> معاينة فورية (Live)
            </span>
         </div>
         
         <div className="w-[380px] h-[750px] bg-white rounded-[3rem] shadow-2xl border-8 border-gray-800 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-800 rounded-b-xl z-20"></div>
            
            <div className="flex-1 overflow-y-auto p-6 pt-12 scrollbar-hide bg-gray-50">
               <div className="mb-6">
                 <h2 className="text-xl font-bold text-gray-800">بيانات البلاغ</h2>
                 <p className="text-xs text-gray-500">تفاصيل إضافية سيقوم الفني بملئها</p>
               </div>
               
               <div className="space-y-4 pb-10">
                  {fields.length === 0 ? <p className="text-center text-gray-400 text-sm">أضف حقولاً للمعاينة</p> : 
                     fields.map(field => (
                       <div key={field.key} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                          <label className="block text-xs font-bold text-gray-700 mb-2">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          
                          {field.type === 'text' && <input disabled placeholder={field.placeholder || "نص قصير..."} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50" />}
                          
                          {(field.type === 'paragraph') && <textarea disabled rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50" placeholder="أدخل التفاصيل..." />}
                          
                          {field.type === 'number' && <input disabled type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50" />}
                          
                          {field.type === 'quantity' && (
                            <div className="flex items-center gap-2">
                               <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">-</div>
                               <div className="w-12 h-8 bg-white border rounded flex items-center justify-center font-bold text-sm">1</div>
                               <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">+</div>
                            </div>
                          )}

                          {field.type === 'select' && (
                            <select disabled className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50">
                              <option>اختر...</option>
                              {field.options?.map(o => <option key={o}>{o}</option>)}
                            </select>
                          )}

                          {field.type === 'radio' && (
                             <div className="space-y-1">
                                {field.options?.map(o => (
                                   <div key={o} className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                                      <span className="text-xs text-gray-600">{o}</span>
                                   </div>
                                ))}
                                {(!field.options || field.options.length === 0) && <span className="text-xs text-red-300">لا توجد خيارات</span>}
                             </div>
                          )}

                          {field.type === 'date' && (
                            <input disabled type="date" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50" />
                          )}

                          {field.type === 'checkbox' && (
                             <label className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg bg-gray-50">
                               <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                               <span className="text-xs text-gray-600">نعم، أوافق</span>
                             </label>
                          )}

                          {field.type === 'location' && (
                             <button className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg border border-dashed border-blue-200 text-xs font-bold flex items-center justify-center gap-1">
                                <MapPin size={14} /> تحديد الموقع الحالي
                             </button>
                          )}

                          {field.type === 'image' && (
                             <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center bg-gray-50">
                               <ImageIcon className="mx-auto text-gray-400 mb-1" size={20} />
                               <span className="text-[10px] text-gray-400">التقاط صورة</span>
                             </div>
                          )}

                          {field.type === 'video' && (
                             <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center bg-gray-50">
                               <Video className="mx-auto text-red-400 mb-1" size={20} />
                               <span className="text-[10px] text-gray-400">تسجيل فيديو</span>
                             </div>
                          )}
                       </div>
                     ))
                  }
                  
                  {fields.length > 0 && (
                     <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg mt-4 opacity-50 cursor-not-allowed">
                       إرسال البلاغ
                     </button>
                  )}
               </div>
            </div>
            
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-800 rounded-full"></div>
         </div>
      </div>
    </div>
  );
};

export default FormBuilder;
