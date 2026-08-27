import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();
const ai = new GoogleGenAI();
async function run() {
  try {
    const b64 = Buffer.from(new Uint8Array(100)).toString('base64');
    await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          { inlineData: { data: b64, mimeType: 'audio/wav' } },
          { text: "Hello" }
        ]
      }
    });
    console.log("Success with audio");
  } catch(e) {
    console.error("Error:", e.message, JSON.stringify(e));
  }
}
run();
