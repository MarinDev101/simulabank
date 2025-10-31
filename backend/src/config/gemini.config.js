const { gemini } = require('./env.config');
const { GoogleGenAI } = require('@google/genai');

// Inicializar el cliente de Google GenAI
const genAI = new GoogleGenAI({
  apiKey: gemini.apiKey,
});

const geminiConfig = {
  model: gemini.model,
  temperature: parseFloat(gemini.temperature),
  maxOutputTokens: parseInt(gemini.maxTokens),
};

module.exports = { genAI, geminiConfig };
