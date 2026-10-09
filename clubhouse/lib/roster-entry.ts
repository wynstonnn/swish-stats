import { createHash } from 'node:crypto';
import { ApiError } from './auth';
import { database, getPool } from './database';
import { googleRequest, readSheetTabs, sheetId } from './sheets-client';
import { cleanLabel, cleanLabels, fields, metadataCells, prepareFields, textCell } from './sheet-fields';

export type RosterPlayer = { id: string; name: string; position: string; hand: string; divisions: string[] };
export function validatePlayer(body: any): RosterPlayer {
  if (!body || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)) throw new ApiError('Start a new player draft.');
  const name = cleanLabel(body.name, 'player name', 100);
  if (name.toUpperCase() === 'SWISH') throw new ApiError('SWISH is the team name. Enter the player’s name.');
  const position = body.position === '' ? '' : cleanLabel(body.position, 'position', 30);
  if (!['', 'Right', 'Left', 'Both'].includes(body.hand)) throw new ApiError('Choose a shooting hand.');
  return { id: body.id, name, position, hand: body.hand, divisions: cleanLabels(body.divisions, 'divisions') };
}
export function rosterRequests(player: RosterPlayer, props: any, raw: Record<string, any>[], hash: string) {
  const layout = prepareFields(raw, props, [fields.divisions], 4);
  const values = metadataCells(layout.columns, { [fields.divisions]: JSON.stringify(player.divisions) }, [player.name, player.position, player.hand, 'Active'].map(textCell));
  return [...layout.requests,
    { insertDimension: { range: { sheetId: props.sheetId, dimension: 'ROWS', startIndex: 1, endIndex: 2 }, inheritFromBefore: false } },
    { updateCells: { start: { sheetId: props.sheetId, rowIndex: 1, columnIndex: 0 }, rows: [{ values }], fields: 'userEnteredValue' } },
    { createDeveloperMetadata: { developerMetadata: { metadataKey: 'swish_player_' + player.id, metadataValue: hash, visibility: 'DOCUMENT', location: { spreadsheet: true } } } }
  ];
}
export async function writePlayer(player: RosterPlayer, services: { pool?: ReturnType<typeof getPool>; google?: typeof googleRequest; read?: typeof readSheetTabs } = {}) {
  const request = services.google || googleRequest, read = services.read || readSheetTabs;
  const hash = createHash('sha256').update(JSON.stringify(player)).digest('hex'), client = await (services.pool || getPool()).connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['swish-sheet:' + sheetId()]);
    const marker = await request('/developerMetadata:search', { dataFilters: [{ developerMetadataLookup: { metadataKey: 'swish_player_' + player.id } }] });
    if (marker.matchedDeveloperMetadata?.some((m: any) => m.developerMetadata.metadataValue !== hash)) throw new ApiError('This player draft was saved with different details. Start a new draft.', 409);
    const alreadySaved = !!marker.matchedDeveloperMetadata?.length;
    if (!alreadySaved) {
      const raw = await read();
      if (raw.Player_Roster.slice(1).some(r => String(r.A || '').trim().toLowerCase() === player.name.toLowerCase())) throw new ApiError('That name is already in the roster. Use the existing player, or add a distinguishing surname.', 409);
      const info = await request('?fields=sheets.properties');
      const props = info.sheets.find((s: any) => s.properties.title === 'Player_Roster')?.properties;
      await request(':batchUpdate', { requests: rosterRequests(player, props, raw.Player_Roster, hash) });
    }
    await database(client).prepare('DELETE FROM dataset WHERE id=?').bind('google-live').run();
    await client.query('COMMIT'); return { ok: true, alreadySaved, player };
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
