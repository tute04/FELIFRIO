import {z} from 'zod';
import {parseAction, ValidationError} from './actions.ts';
import {apply, empty, type State} from './domain.ts';
export class ConflictError extends Error {}
type Receipt = {id:string; request:string; actor:string; revision:number; entry_id:string};
const envelope = z.object({operationId:z.string().uuid(), revision:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER-1), action:z.unknown()}).strict();
export async function readState(db:D1Database) {
  const row = await db.prepare('SELECT payload, revision FROM business WHERE id = 1').first<{payload:string; revision:number}>();
  return {state:row ? JSON.parse(row.payload) as State : empty(), revision:row?.revision ?? 0};
}
export async function mutate(db:D1Database, input:unknown, actor:string) {
  const parsed = envelope.safeParse(input);
  if (!parsed.success) throw new ValidationError('Solicitud inválida. Actualizá la aplicación y revisá los datos.');
  const {operationId, revision} = parsed.data;
  const action = parseAction(parsed.data.action), request = JSON.stringify(action);
  const lookup = () => db.prepare('SELECT id, request, actor, revision, entry_id FROM operations WHERE id = ?').bind(operationId).first<Receipt>();
  const replay = async (receipt:Receipt) => {
    if (receipt.request !== request || receipt.actor !== actor) throw new ConflictError('Ese identificador pertenece a otra operación.');
    return {...await readState(db), replayed:true, operationRevision:receipt.revision};
  };
  const previous = await lookup();
  if (previous) return replay(previous);
  await db.prepare('INSERT OR IGNORE INTO business (id, payload, revision) VALUES (1, ?, 0)').bind(JSON.stringify(empty())).run();
  const current = await readState(db);
  if (current.revision !== revision) {
    const committed = await lookup();
    if (committed) return replay(committed);
    throw new ConflictError('Otra sesión actualizó los datos. Revisá los valores y volvé a confirmar.');
  }
  const state = apply(current.state, action, actor), entry = state.entries[0];
  // D1 batch commits the receipt and state atomically. Each candidate carries a
  // unique entry ID, so a losing retry cannot use another request's receipt.
  await db.batch([
    db.prepare('INSERT OR IGNORE INTO operations (id, request, actor, revision, entry_id, created_at) SELECT ?, ?, ?, revision + 1, ?, ? FROM business WHERE id = 1 AND revision = ?').bind(operationId, request, actor, entry.id, entry.date, revision),
    db.prepare('UPDATE business SET payload = ?, revision = revision + 1 WHERE id = 1 AND revision = ? AND EXISTS (SELECT 1 FROM operations WHERE id = ? AND entry_id = ?)').bind(JSON.stringify(state), revision, operationId, entry.id),
  ]);
  const receipt = await lookup();
  if (!receipt) throw new ConflictError('Hubo otro cambio simultáneo. Revisá los valores y volvé a confirmar.');
  if (receipt.entry_id !== entry.id) return replay(receipt);
  return {state, revision:revision+1, replayed:false, operationRevision:revision+1};
}
