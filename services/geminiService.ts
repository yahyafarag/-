import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // In a real app, strict env handling
const ai = new GoogleGenAI({ apiKey });

export const analyzeTicket = async (description: string, assetName: string, assetCategory: string): Promise<string> => {
  if (!apiKey) return "API Key not configured.";

  try {
    const prompt = `
      You are an expert industrial maintenance technician AI.
      Analyze the following issue for a ${assetName} (${assetCategory}).
      
      Issue Description: "${description}"

      Provide a JSON response with:
      1. "diagnosis": Possible root causes.
      2. "severity": "LOW", "MEDIUM", "HIGH", or "CRITICAL".
      3. "recommended_actions": Steps to resolve.
      
      Keep it concise.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analyzing ticket. Please try again.";
  }
};