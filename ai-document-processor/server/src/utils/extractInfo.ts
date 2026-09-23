// Simple, rule-based helpers. Used (1) as a fallback when no AI key is set and
// (2) to always pull emails / phones / dates / amounts using regex.

const unique = (arr: string[]) => [...new Set(arr.map((s) => s.trim()))].filter(Boolean);

export function extractEmails(text: string): string[] {
  return unique(text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []);
}

export function extractPhones(text: string): string[] {
  // Matches things like +91 98765 43210, 98765-43210, (044) 2345 6789
  const matches = text.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,5}/g) || [];
  return unique(matches.filter((m) => m.replace(/\D/g, '').length >= 10 && m.replace(/\D/g, '').length <= 13));
}

export function extractDates(text: string): string[] {
  const numeric = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g) || [];
  const months = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';
  const written =
    text.match(new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s(?:${months})\\.?,?\\s\\d{4}\\b`, 'gi')) || [];
  const written2 =
    text.match(new RegExp(`\\b(?:${months})\\.?\\s\\d{1,2}(?:st|nd|rd|th)?,?\\s\\d{4}\\b`, 'gi')) || [];
  return unique([...numeric, ...written, ...written2]);
}

export function extractAmounts(text: string): string[] {
  return unique(text.match(/(?:₹|Rs\.?|INR|\$|USD|EUR|€)\s?\d[\d,]*(?:\.\d+)?/gi) || []);
}

export function extractiveSummary(text: string, maxSentences = 3): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';

  // split after . ! ? when the next sentence starts with a capital letter
  const sentences = clean.split(/(?<=[.!?])\s+(?=[A-Z])/);
  if (sentences.length <= maxSentences) return truncate(sentences.join(' ').trim());

  // Score each sentence by how many frequent words it contains
  const stop = new Set(
    'the a an and or but if of to in on at for with by from is are was were be been this that these those it its as not no can will has have had we you they he she i our your their'.split(' ')
  );
  const freq: Record<string, number> = {};
  clean
    .toLowerCase()
    .match(/[a-z]{3,}/g)
    ?.forEach((w) => {
      if (!stop.has(w)) freq[w] = (freq[w] || 0) + 1;
    });

  const scored = sentences.map((s, index) => {
    const words = s.toLowerCase().match(/[a-z]{3,}/g) || [];
    const score = words.reduce((sum, w) => sum + (freq[w] || 0), 0) / (words.length || 1);
    return { s: s.trim(), index, score };
  });

  return truncate(scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index) // keep original order
    .map((x) => x.s)
    .join(' '));
}

const truncate = (s: string, max = 500) => (s.length > max ? s.slice(0, max).trimEnd() + '…' : s);

export function guessDocumentType(text: string): string {
  const t = text.toLowerCase();
  if (/invoice|bill to|amount due|gst|tax invoice/.test(t)) return 'Invoice';
  if (/resume|curriculum vitae|work experience|skills|education/.test(t)) return 'Resume';
  if (/agreement|hereby|party of the|terms and conditions|witness/.test(t)) return 'Contract';
  if (/receipt|paid|payment received/.test(t)) return 'Receipt';
  if (/dear |sincerely|regards|yours faithfully/.test(t)) return 'Letter';
  if (/abstract|introduction|references|conclusion/.test(t)) return 'Report / Paper';
  return 'General document';
}
