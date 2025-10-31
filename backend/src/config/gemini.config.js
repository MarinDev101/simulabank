// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const dotenv = require('dotenv');

// dotenv.config();

// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// const geminiModel = genAI.getGenerativeModel({
//   model: process.env.GOOGLE_GEMINI_MODEL || 'gemini-pro',
// });

// module.exports = { geminiModel };

const dotenvSafe = require('dotenv-safe');
const { GoogleGenAI } = require('@google/genai');

dotenvSafe.config({ allowEmptyValues: true });

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY no está definida en el archivo .env');
}

// Inicializar el cliente de Google GenAI
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const geminiConfig = {
  model: process.env.GEMINI_CHAT_MODEL || 'gemini-2.0-flash-exp',
  temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
  maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 2048,
};

module.exports = { genAI, geminiConfig };
