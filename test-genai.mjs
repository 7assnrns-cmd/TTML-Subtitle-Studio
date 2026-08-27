import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();
const ai = new GoogleGenAI();
async function run() {
  try {
    await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: { parts: [ { text: "Hello" } ] }
    });
    console.log("Success with parts object");
  } catch(e) {
    console.error("Error with parts object:", JSON.stringify(e));
  }
}
run();
