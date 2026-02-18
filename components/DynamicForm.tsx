import React from 'react';
import { UISchema } from '../types';

interface DynamicFormProps {
  schema: UISchema;
  formData: Record<string, any>;
  onChange: (key: string, value: any) => void;
  readOnly?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ schema, formData, onChange, readOnly = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {schema.fields.map((field) => {
        const value = formData[field.key] || '';

        return (
          <div key={field.key} className={field.type === 'textarea' ? 'col-span-1 md:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            
            {field.type === 'text' && (
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                disabled={readOnly}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                disabled={readOnly}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            )}

            {field.type === 'select' && (
              <select
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {field.type === 'checkbox' && (
              <div className="flex items-center h-10">
                 <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                  disabled={readOnly}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <span className="ml-2 text-sm text-gray-600">{field.description || "Yes / No"}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DynamicForm;