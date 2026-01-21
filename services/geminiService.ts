
import { GoogleGenAI, Type } from "@google/genai";
import { DriveVideo } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSmartSuggestions = async (query: string, videos: DriveVideo[]): Promise<string[]> => {
  try {
    const videoList = videos.map(v => v.name).join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `O usuário está pesquisando por "${query}" em sua biblioteca de vídeos do Google Drive. Aqui estão os títulos disponíveis: ${videoList}. Identifique os 3 títulos mais prováveis ou termos relacionados que ajudariam na busca. Responda apenas com os termos separados por vírgula.`,
      config: {
        temperature: 0.7,
      },
    });

    const text = response.text || "";
    return text.split(",").map(s => s.trim()).filter(Boolean);
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};

export const filterVideosWithAI = async (query: string, videos: DriveVideo[]): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Dada a busca "${query}" e a lista de vídeos: ${JSON.stringify(videos.map(v => ({ id: v.id, name: v.name })))}, retorne um array JSON com os IDs dos vídeos que combinam semanticamente com a busca.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchingIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["matchingIds"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result.matchingIds || [];
  } catch (error) {
    console.error("AI Filtering Error:", error);
    return [];
  }
};
