import { env } from '../config/env';
import {
  extractiveSummary,
  guessDocumentType,
} from '../utils/extractInfo';

export interface AiResult {
  summary: string;
  documentType: string;
  keyPoints: string[];
  people: string[];
  organizations: string[];
  provider: string;
}

const MAX_CHARS = 12000; // don't send huge documents to the API

const buildPrompt = (text: string) => `You are a document analysis assistant.
Read the document text below and reply with ONLY a JSON object (no markdown, no extra text) in this exact shape:
{
  "summary": "2-4 sentence summary",
  "documentType": "e.g. Invoice, Resume, Contract, Letter, Report",
  "keyPoints": ["up to 5 important points"],
  "people": ["person names found"],
  "organizations": ["organization / company names found"]
}

DOCUMENT TEXT:
"""
${text.slice(0, MAX_CHARS)}
"""`;

// The AI sometimes wraps JSON in ```json fences, so strip them before parsing
function parseJson(raw: string) {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function callGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.geminiApiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callAnthropic(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.anthropicModel,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  return data.content?.[0]?.text ?? '';
}

// Fallback used when AI_PROVIDER=none or the API key is missing
function localAnalysis(text: string): AiResult {
  return {
    summary: extractiveSummary(text),
    documentType: guessDocumentType(text),
    keyPoints: [],
    people: [],
    organizations: [],
    provider: 'local',
  };
}

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean).slice(0, 10) : [];

export async function analyzeText(text: string): Promise<AiResult> {
  const provider = env.aiProvider;

  const canUseGemini = provider === 'gemini' && env.geminiApiKey;
  const canUseAnthropic = provider === 'anthropic' && env.anthropicApiKey;
  if (!canUseGemini && !canUseAnthropic) return localAnalysis(text);

  const prompt = buildPrompt(text);
  const raw = canUseGemini ? await callGemini(prompt) : await callAnthropic(prompt);
  const json = parseJson(raw);

  return {
    summary: String(json.summary || ''),
    documentType: String(json.documentType || guessDocumentType(text)),
    keyPoints: asStringArray(json.keyPoints),
    people: asStringArray(json.people),
    organizations: asStringArray(json.organizations),
    provider: canUseGemini ? 'gemini' : 'anthropic',
  };
}
