import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../services/store';
import DynamicForm from '../components/DynamicForm';
import { analyzeTicket } from '../services/geminiService';
import { Ticket, TicketStatus, TicketPriority } from '../types';
import { ArrowLeft, Save, Sparkles, Check, AlertTriangle, PlayCircle } from 'lucide-react';

const TicketWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tickets, assets, user, ticketSchema, addTicket, updateTicket, config } = useStore();

  const isNew = !id || id === 'new';
  const existingTicket = tickets.find(t => t.id === id);

  const [formData, setFormData] = useState<Partial<Ticket>>(
    existingTicket || {
      title: '',
      description: '',
      assetId: '',
      priority: 'MEDIUM',
      status: 'OPEN',
      location: { lat: 0, lng: 0 },
      formData: {}
    }
  );

  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (isNew && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
      });
    }
  }, [isNew]);

  const handleAIAnalysis = async () => {
    if (!formData.description || !formData.assetId) {
      alert("Please select an asset and describe the issue first.");
      return;
    }
    
    const asset = assets.find(a => a.id === formData.assetId);
    if (!asset) return;

    setIsAnalyzing(true);
    try {
      const resultText = await analyzeTicket(formData.description, asset.name, asset.category);
      // Clean up markdown code blocks if Gemini returns them
      const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const analysis = JSON.parse(cleanJson);
        setAiAnalysis(analysis);
        // Auto-suggest priority
        if (analysis.severity) {
           setFormData(prev => ({ ...prev, priority: analysis.severity as TicketPriority }));
        }
      } catch (e) {
        console.error("Failed to parse AI JSON", e);
        setAiAnalysis({ diagnosis: resultText }); // Fallback to raw text
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isNew) {
      const newTicket: Ticket = {
        ...formData as Ticket,
        id: `t${Date.now()}`,
        technicianId: user?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addTicket(newTicket);
    } else {
      updateTicket(id!, {
        ...formData,
        updatedAt: new Date().toISOString(),
      });
    }
    navigate('/tickets');
  };

  const handleDynamicFormChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      formData: {
        ...(prev.formData || {}),
        [key]: value
      }
    }));
  };

  const selectedAsset = assets.find(a => a.id === formData.assetId);
  const isWarrantyActive = selectedAsset && new Date(selectedAsset.warrantyExpiry) > new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isNew ? 'Create New Ticket' : 'Edit Ticket'}</h1>
          <p className="text-gray-500">Complete the details below.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Issue Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
              <select 
                value={formData.assetId}
                onChange={e => setFormData({...formData, assetId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!isNew}
              >
                <option value="">Select Asset...</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.serialNumber})</option>
                ))}
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select 
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value as TicketPriority})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {isWarrantyActive && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-amber-800">Under Warranty</p>
                <p className="text-sm text-amber-700">This asset is under warranty until {new Date(selectedAsset!.warrantyExpiry).toLocaleDateString()}. Consider contacting the supplier.</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input 
              type="text"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="Brief summary of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="Detailed description of the problem..."
            />
          </div>

           {/* AI Assistant Button */}
          {config.enableAIAnalysis && isNew && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAIAnalysis}
                disabled={isAnalyzing || !formData.description}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Smart Diagnose
                  </>
                )}
              </button>
            </div>
          )}

          {/* AI Analysis Result */}
          {aiAnalysis && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-purple-800 font-semibold">
                 <Sparkles size={18} />
                 <span>AI Diagnosis</span>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Potential Cause:</strong> {aiAnalysis.diagnosis}</p>
                {aiAnalysis.recommended_actions && (
                  <div>
                    <strong>Recommended Actions:</strong>
                    <p>{aiAnalysis.recommended_actions}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Schema Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2 mb-4">Diagnosis Checklist</h3>
           <p className="text-sm text-gray-500 mb-4">Fields configured by Admin for standard procedure.</p>
           <DynamicForm 
             schema={ticketSchema} 
             formData={formData.formData || {}} 
             onChange={handleDynamicFormChange} 
           />
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-white border-t border-gray-200 flex justify-end gap-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
           <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
           >
             Cancel
           </button>
           <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
           >
             <Save size={18} />
             Save Ticket
           </button>
        </div>
      </form>
    </div>
  );
};

export default TicketWizard;