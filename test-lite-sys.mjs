import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();
const ai = new GoogleGenAI();
async function run() {
  try {
    await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: "Hello",
      config: {
        systemInstruction: "You are a helpful assistant."
      }
    });
    console.log("Success with sys");
  } catch(e) {
    console.error("Error:", e.message, JSON.stringify(e));
  }
}
run();
