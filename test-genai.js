const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
async function run() {
  try {
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ text: "hello" }]
      }
    });
    console.log("Success with object");
  } catch(e) {
    console.error("Error with object:", e.message);
  }
}
run();
