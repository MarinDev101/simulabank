const { gemini } = require('./env.config');
const { GoogleGenAI } = require('@google/genai');

// Inicializar el cliente de Google GenAI
const genAI = new GoogleGenAI({
  apiKey: gemini.apiKey,
});

const geminiConfig = {
  model: gemini.model,
};

const profilesConfig = {
  // Para conversaciones naturales (simulación de clientes)
  CONVERSATIONAL: {
    temperature: 0.85,      // Alta creatividad
    maxOutputTokens: 500,   // Respuestas concisas
    topP: 0.95,
    topK: 40,
  },

  // Para generación de datos estructurados
  STRUCTURED: {
    temperature: 0.3,       // Más determinista
    maxOutputTokens: 2000,
    topP: 0.9,
    topK: 20,
  },

  // Para análisis y evaluación
  ANALYTICAL: {
    temperature: 0.2,       // Muy objetivo
    maxOutputTokens: 1000,
    topP: 0.85,
    topK: 10,
  },

  // Para creatividad máxima
  CREATIVE: {
    temperature: 1.2,       // Muy creativo
    maxOutputTokens: 1500,
    topP: 0.98,
    topK: 50,
  },
};

const safetySettings = {
  STRICT: [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  ],
};

module.exports = { genAI, geminiConfig, profilesConfig, safetySettings };
