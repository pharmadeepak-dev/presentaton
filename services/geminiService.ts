import { GoogleGenAI, Type } from "@google/genai";

export const analyzeUpload = async (base64Data: string, mimeType: string) => {
  try {
    // Instantiate right before the call as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this pharmaceutical marketing material. Identify the Brand Name and a short 1-sentence description of the promotion. Return as JSON with keys 'brandName' and 'description'.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brandName: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["brandName", "description"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return { brandName: "Unknown Brand", description: "No description available." };
  }
};