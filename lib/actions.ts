import {z} from 'zod';

export class ValidationError extends Error {}

const text = z.string().trim().min(1).max(300);
const optionalText = z.string().trim().max(300).default('');
const reference = z.string().min(1).max(100);
// Accept decimal form fields, but never coerce booleans, whitespace, hex or null.
function numeric(integer: boolean, zero = false) {
  const pattern = integer ? /^\d+$/ : /^\d+(?:\.\d{1,2})?$/;
  return z.union([z.number(), z.string().regex(pattern).transform(Number)])
    .pipe(z.number().finite().min(zero ? 0 : integer ? 1 : 0.01).max(1e10))
    .refine(n => integer ? Number.isInteger(n) : /^\d+(?:\.\d{1,2})?$/.test(String(n)),
      integer ? 'Usá bolsas enteras' : 'Usá hasta dos decimales');
}
const quantity = numeric(true);
const count = numeric(true, true);
const amount = numeric(false);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(value + 'T00:00:00Z');
  return value.slice(0, 4) !== '0000' && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'La fecha no existe');

export const actionSchemas = {
  client: z.object({type:z.literal('client'), name:text, address:optionalText, phone:optionalText, price:amount}).strict(),
  price: z.object({type:z.literal('price'), clientId:reference, price:amount}).strict(),
  production: z.object({type:z.literal('production'), quantity, batch:text}).strict(),
  load: z.object({type:z.literal('load'), quantity}).strict(),
  unload: z.object({type:z.literal('unload'), quantity}).strict(),
  delivery: z.object({type:z.literal('delivery'), clientId:reference, quantity}).strict(),
  return: z.object({type:z.literal('return'), clientId:reference, quantity}).strict(),
  settlement: z.object({type:z.literal('settlement'), clientId:reference, counted:count, loss:count, reason:optionalText}).strict(),
  collect: z.object({type:z.literal('collect'), clientId:reference, amount, method:z.enum(['Efectivo','Transferencia'])}).strict(),
  loss: z.object({type:z.literal('loss'), quantity, reason:text}).strict(),
  resolve: z.object({type:z.literal('resolve'), lossId:reference, resolution:z.enum(['Felifrío absorbe','Cliente paga'])}).strict(),
  purchase: z.object({type:z.literal('purchase'), title:text, supplier:text, amount, paid:numeric(false,true)}).strict(),
  pay: z.object({type:z.literal('pay'), purchaseId:reference, amount}).strict(),
  expense: z.object({type:z.literal('expense'), title:text, amount}).strict(),
  income: z.object({type:z.literal('income'), title:text, amount}).strict(),
  task: z.object({type:z.literal('task'), title:text, date, responsible:text}).strict(),
  complete: z.object({type:z.literal('complete'), taskId:reference}).strict(),
};
export type ActionType = keyof typeof actionSchemas;
export type Action = z.output<(typeof actionSchemas)[ActionType]>;

export function parseAction(input: unknown): Action {
  if (!input || typeof input !== 'object' || !('type' in input) ||
      typeof input.type !== 'string' || !Object.hasOwn(actionSchemas, input.type)) {
    throw new ValidationError('Operación desconocida');
  }
  const result = actionSchemas[input.type as ActionType].safeParse(input);
  if (!result.success) {
    const field = result.error.issues[0].path.join('.') || 'operación';
    throw new ValidationError('Revisá el campo ' + field + ': valor inválido o campos no permitidos.');
  }
  if (result.data.type === 'settlement' && result.data.loss > 0 && !result.data.reason) {
    throw new ValidationError('Completá el motivo de las pérdidas');
  }
  return result.data;
}

// Forms share defaults; send only the fields belonging to the selected action.
export function formAction(type: string, fields: Record<string, unknown>): Action {
  if (!Object.hasOwn(actionSchemas, type)) throw new ValidationError('Operación desconocida');
  const keys = Object.keys(actionSchemas[type as ActionType].shape).filter(key => key !== 'type');
  return parseAction({type, ...Object.fromEntries(keys.filter(key => fields[key] !== undefined).map(key => [key, fields[key]]))});
}
