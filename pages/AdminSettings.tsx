import React, { useState } from 'react';
import { useStore } from '../services/store';
import { FormField } from '../types';
import { Plus, Trash2, GripVertical, Save, Lock } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const { config, ticketSchema, updateConfig, updateTicketSchema, user } = useStore();
  const [localConfig, setLocalConfig] = useState(config);
  const [localSchema, setLocalSchema] = useState(ticketSchema);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Lock size={48} className="mb-4 text-gray-300" />
        <p className="text-lg">Access Restricted</p>
        <p className="text-sm">Only Administrators can view this page.</p>
      </div>
    );
  }

  const handleAddField = () => {
    const newField: FormField = {
      key: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false
    };
    setLocalSchema({
      ...localSchema,
      fields: [...localSchema.fields, newField]
    });
  };

  const handleUpdateField = (index: number, key: keyof FormField, value: any) => {
    const updatedFields = [...localSchema.fields];
    updatedFields[index] = { ...updatedFields[index], [key]: value };
    setLocalSchema({ ...localSchema, fields: updatedFields });
  };

  const handleDeleteField = (index: number) => {
    const updatedFields = localSchema.fields.filter((_, i) => i !== index);
    setLocalSchema({ ...localSchema, fields: updatedFields });
  };

  const saveChanges = () => {
    updateConfig(localConfig);
    updateTicketSchema(localSchema);
    alert('System Configuration and Form Schema Saved.');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Sovereign Console</h1>
        <p className="text-gray-500">Manage system rules and dynamic forms.</p>
      </div>

      {/* System Configuration */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Global Policies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Geofence Radius (meters)</label>
            <input 
              type="number" 
              value={localConfig.geofenceRadius}
              onChange={(e) => setLocalConfig({...localConfig, geofenceRadius: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Distance required from branch to open ticket.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">High Priority SLA (Hours)</label>
            <input 
              type="number" 
              value={localConfig.slaHighPriorityHours}
              onChange={(e) => setLocalConfig({...localConfig, slaHighPriorityHours: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Time allowed before auto-escalation.</p>
          </div>
          <div className="flex items-center h-full pt-6">
            <input 
              type="checkbox"
              checked={localConfig.enableAIAnalysis}
              onChange={(e) => setLocalConfig({...localConfig, enableAIAnalysis: e.target.checked})}
              className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">Enable AI Smart Diagnosis</label>
          </div>
        </div>
      </div>

      {/* Dynamic Form Builder */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 border-b pb-2">
           <h2 className="text-lg font-semibold text-gray-800">Ticket Diagnosis Form Schema</h2>
           <button 
             onClick={handleAddField}
             className="flex items-center text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
           >
             <Plus size={16} className="mr-1" /> Add Field
           </button>
        </div>

        <div className="space-y-3">
          {localSchema.fields.map((field, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 group">
               <div className="hidden md:flex items-center text-gray-400 cursor-move">
                 <GripVertical size={20} />
               </div>
               
               <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <label className="text-xs text-gray-500">Label</label>
                    <input 
                      type="text" 
                      value={field.label}
                      onChange={(e) => handleUpdateField(index, 'label', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-gray-500">Key (Database)</label>
                    <input 
                      type="text" 
                      value={field.key}
                      onChange={(e) => handleUpdateField(index, 'key', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded font-mono text-xs"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-gray-500">Type</label>
                    <select 
                      value={field.type}
                      onChange={(e) => handleUpdateField(index, 'type', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="text">Text Input</option>
                      <option value="number">Number</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="select">Dropdown</option>
                      <option value="textarea">Text Area</option>
                    </select>
                  </div>
                  <div className="col-span-1 flex items-end pb-1 gap-2">
                    <div className="flex items-center">
                       <input 
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => handleUpdateField(index, 'required', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Req</span>
                    </div>
                     {field.type === 'select' && (
                       <input
                         type="text"
                         placeholder="Options (comma sep)"
                         value={field.options?.join(',') || ''}
                         onChange={(e) => handleUpdateField(index, 'options', e.target.value.split(','))}
                         className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                       />
                     )}
                  </div>
               </div>

               <button 
                 onClick={() => handleDeleteField(index)}
                 className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg self-center"
               >
                 <Trash2 size={18} />
               </button>
            </div>
          ))}
          
          {localSchema.fields.length === 0 && (
            <div className="text-center py-8 text-gray-400 italic">No fields defined. Add a field to start.</div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 right-0 p-6 z-10">
        <button 
          onClick={saveChanges}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 hover:scale-105 transition-all"
        >
          <Save size={20} />
          Save System Configuration
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;