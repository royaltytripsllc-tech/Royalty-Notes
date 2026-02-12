
import { GoogleGenAI, Type } from "@google/genai";
import { ActionItem } from "../types";

// Always use the specified initialization pattern from guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const processMeetingAudio = async (base64Audio: string): Promise<{ 
  transcript: string; 
  minutes: string; 
  actionItems: ActionItem[] 
}> => {
  // Use ai.models.generateContent directly with the model and contents as per guidelines
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/wav',
              data: base64Audio,
            },
          },
          {
            text: "Please transcribe this meeting audio. Then, provide a professional summary (Meeting Minutes) and extract specific action items per individual. Format the response as JSON.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcript: { type: Type.STRING },
          minutes: { type: Type.STRING },
          actionItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                owner: { type: Type.STRING },
                task: { type: Type.STRING },
                deadline: { type: Type.STRING },
              },
              required: ["owner", "task"],
            },
          },
        },
        required: ["transcript", "minutes", "actionItems"],
      },
    },
  });

  // Access the .text property directly as it is a getter, not a method
  return JSON.parse(response.text || '{}');
};

export const summarizeNote = async (content: string): Promise<string> => {
  // Use ai.models.generateContent directly
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Summarize the following note content concisely: ${content}`,
  });
  // Access the .text property directly
  return response.text || '';
};

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  // Extract just the base64 data if it includes the data:image prefix
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const mimeType = base64Image.includes('image/png') ? 'image/png' : 'image/jpeg';

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: "Transcribe all text from this image perfectly. If it's a document, preserve the structure. If it's a photo of notes or a whiteboard, extract the text and clean it up for inclusion in a professional notebook.",
        },
      ],
    },
  });

  return response.text || '';
};
