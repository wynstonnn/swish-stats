import { ApiError } from './auth';

export const fields = { division: 'SWISH Division', tags: 'SWISH Tags', gameId: 'SWISH Game ID', divisions: 'SWISH Divisions' };
export type SheetRows = Record<string, any>[];
export function fieldColumn(rows: SheetRows, label: string) {
  return Object.keys(rows[0] || {}).find(c => String(rows[0][c]).trim() === label);
}
export function fieldValue(rows: SheetRows, row: Record<string, any>, label: string) {
  const col = fieldColumn(rows, label); return col ? row[col] : undefined;
}
export function cleanLabel(value: unknown, title: string, max = 80) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max || /[\u0000-\u001f]/.test(value)) throw new ApiError(`Enter a ${title} of 1–${max} characters.`);
  return value.trim();
}
export function cleanLabels(value: unknown, title: string, maxCount = 10) {
  if (!Array.isArray(value) || value.length > maxCount) throw new ApiError(`Choose up to ${maxCount} ${title}.`);
  const result = value.map(v => cleanLabel(v, title, 80));
  if (new Set(result.map(v => v.toLowerCase())).size !== result.length) throw new ApiError(`Use each ${title} only once.`);
  return result;
}
const index = (letter: string) => [...letter].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
export const textCell = (value: string) => ({ userEnteredValue: { stringValue: value } });
// Append fields after every occupied column, including columns with no header.
// Never move or overwrite the tracker's existing columns or formulas.
export function prepareFields(rows: SheetRows, props: any, labels: string[], minimumColumns: number) {
  if (!props || !Number.isInteger(props.sheetId)) throw new ApiError('Required sheet tabs are missing.', 409);
  let next = minimumColumns;
  for (const row of rows) for (const col of Object.keys(row)) if (/^[A-Z]+$/.test(col)) next = Math.max(next, index(col) + 1);
  const columns: Record<string, number> = {}, headers: any[] = [];
  for (const label of labels) {
    const existing = fieldColumn(rows, label), col = existing ? index(existing) : next++;
    if (col >= 78) throw new ApiError('The sheet has no free metadata columns within A:BZ. Review its layout.', 409);
    columns[label] = col;
    if (!existing) headers.push({ updateCells: { start: { sheetId: props.sheetId, rowIndex: 0, columnIndex: col }, rows: [{ values: [textCell(label)] }], fields: 'userEnteredValue' } });
  }
  const count = props.gridProperties?.columnCount ?? minimumColumns;
  const requests = next > count ? [{ appendDimension: { sheetId: props.sheetId, dimension: 'COLUMNS', length: next - count } }, ...headers] : headers;
  return { columns, requests };
}
export function metadataCells(columns: Record<string, number>, values: Record<string, string>, cells: any[]) {
  for (const [label, value] of Object.entries(values)) {
    const col = columns[label]; if (col !== undefined) cells[col] = textCell(value);
  }
  // Sparse JSON array entries must be explicit empty cells for Sheets.
  return Array.from({ length: cells.length }, (_, i) => cells[i] || {});
}
