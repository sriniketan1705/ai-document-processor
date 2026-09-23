import dotenv from 'dotenv';
dotenv.config({ quiet: true });

export const env = {
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/idp',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  tesseractLangPath: process.env.TESSERACT_LANG_PATH || '',
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 10,
  aiProvider: (process.env.AI_PROVIDER || 'none').toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
};
