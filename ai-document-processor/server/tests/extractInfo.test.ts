import {
  extractAmounts,
  extractDates,
  extractEmails,
  extractiveSummary,
  guessDocumentType,
} from '../src/utils/extractInfo';

describe('extractInfo helpers', () => {
  const sample = `Invoice No: 1023. Bill to: Ravi Kumar (ravi.kumar@example.com), phone +91 98765 43210.
Issued on 12/03/2025 and due on 5 April 2025. Amount due: ₹12,500.50 (plus $20 shipping).`;

  test('extracts emails', () => {
    expect(extractEmails(sample)).toEqual(['ravi.kumar@example.com']);
  });

  test('extracts dates in numeric and written formats', () => {
    const dates = extractDates(sample);
    expect(dates).toContain('12/03/2025');
    expect(dates).toContain('5 April 2025');
  });

  test('extracts currency amounts', () => {
    const amounts = extractAmounts(sample);
    expect(amounts).toContain('₹12,500.50');
    expect(amounts).toContain('$20');
  });

  test('guesses document type', () => {
    expect(guessDocumentType(sample)).toBe('Invoice');
  });

  test('extractive summary returns at most 3 sentences', () => {
    const text =
      'Solar power is growing fast. Solar panels convert sunlight into power. Many homes now use solar panels. ' +
      'The weather was nice yesterday. Prices of solar panels have dropped. People like cricket.';
    const summary = extractiveSummary(text, 3);
    expect(summary.split(/[.!?]/).filter((s) => s.trim()).length).toBeLessThanOrEqual(3);
    expect(summary.toLowerCase()).toContain('solar');
  });

  test('empty text gives empty summary', () => {
    expect(extractiveSummary('   ')).toBe('');
  });
});
