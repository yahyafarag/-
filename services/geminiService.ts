import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeTicket = async (description: string, assetName: string, assetCategory: string): Promise<string> => {
  if (!apiKey) return "لم يتم إعداد مفتاح API.";

  try {
    const prompt = `
      أنت خبير صيانة صناعية متخصص.
      قم بتحليل المشكلة التالية لمعدة: ${assetName} (التصنيف: ${assetCategory}).
      
      وصف المشكلة: "${description}"

      المطلوب: قم بالرد بصيغة JSON فقط يحتوي على الحقول التالية باللغة العربية:
      1. "diagnosis": الأسباب المحتملة للعطل (نص مختصر).
      2. "severity": تقدير الخطورة ويجب أن تكون واحدة من القيم التالية بالإنجليزية فقط: "LOW", "MEDIUM", "HIGH", "CRITICAL".
      3. "recommended_actions": خطوات الإصلاح المقترحة (نص).
      
      تأكد من أن الرد JSON صالح للتحليل المباشر.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "لا يوجد تحليل متاح حالياً.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "حدث خطأ أثناء تحليل البلاغ. يرجى المحاولة مرة أخرى.";
  }
};

export const parseImportData = async (rawData: any[], targetType: 'assets' | 'branches'): Promise<any[]> => {
  if (!apiKey) {
    console.error("API Key is missing for AI Service");
    return [];
  }
  if (!rawData || rawData.length === 0) return [];

  const sampleRow = rawData[0];
  const headers = Object.keys(sampleRow);
  
  // Enhanced Schema Descriptions for better mapping
  let schemaDesc = "";
  if (targetType === 'assets') {
    schemaDesc = "name, serial_number, category, status (ACTIVE/BROKEN/MAINTENANCE), initial_value, location, branch_id (map to Branch Name column)";
  } else {
    schemaDesc = "name, location_lat, location_lng, area_id (map to Area/Region Name column), manager_id";
  }

  try {
    const prompt = `
      You are a Data Engineer. Map Excel headers ${JSON.stringify(headers)} to DB Schema: [${schemaDesc}].
      
      Return JSON { "Excel_Header": "db_column" }.
      For 'status', normalize to ACTIVE/BROKEN.
      For 'branch_id', map it if there is a column like 'Branch Name' or 'Site'.
      For 'area_id', map it if there is a column like 'Area' or 'Region'.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const cleanJson = response.text?.replace(/```json/g, '').replace(/```/g, '').trim();
    const mapping = JSON.parse(cleanJson || "{}");

    const mappedData = rawData.map(row => {
      const newRow: any = {};
      Object.entries(mapping).forEach(([excelKey, dbKey]) => {
        if (row[excelKey] !== undefined) {
           let value = row[excelKey];
           if (dbKey === 'status') {
             const s = String(value).toUpperCase();
             value = ['ACTIVE', 'BROKEN', 'MAINTENANCE', 'SCRAPPED'].includes(s) ? s : 'ACTIVE';
           }
           newRow[dbKey as string] = value;
        }
      });
      
      // Defaults
      if (targetType === 'assets' && !newRow.status) newRow.status = 'ACTIVE';
      
      return newRow;
    });

    return mappedData;

  } catch (error) {
    console.error("AI Import Error:", error);
    return rawData;
  }
};