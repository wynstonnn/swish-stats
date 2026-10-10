// Only expose a derived age cohort; birth dates and birth years remain private.
export function rosterAgeBracket(header: Record<string, any>, row: Record<string, any>, year = new Date().getUTCFullYear()) {
  const read = (pattern: RegExp) => { const col = Object.keys(header).find(k => pattern.test(String(header[k]).replace(/\s+/g, ' ').trim()));const v = col ? row[col] : null;return v !== null && v !== undefined && String(v).trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null; };
  let age = read(/^(current age|age|swish age|age in \d{4}|age\s*\([^)]*\)|age as (?:at|of).*)$/i);
  if (age === null) { const born = read(/^(birth[ -]?year|year of birth|yob)$/i);if (born !== null && born >= year - 110 && born <= year) age = year - born; }
  return age === null || !Number.isInteger(age) || age < 0 || age > 110 ? 'Unrecorded' : age < 18 ? 'U18' : age < 21 ? 'U21' : 'Open';
}
