const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const geminiModel = genAI.getGenerativeModel({
  model: process.env.GOOGLE_GEMINI_MODEL || 'gemini-pro',
});

module.exports = { geminiModel };
