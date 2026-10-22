import {env} from 'cloudflare:workers';
import {ValidationError} from '../../../lib/actions';
import {ConflictError, mutate, readState} from '../../../lib/data-service';
export const dynamic = 'force-dynamic';
const reply = (value:unknown, status=200) => Response.json(value, {status, headers:{'Cache-Control':'no-store'}});
export async function GET() {
  try {return reply(await readState(env.DB!));}
  catch {return reply({error:'No se pudo leer la información. Intentá actualizar.'}, 503);}
}
export async function POST(request:Request) {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return reply({error:'Formato inválido'}, 415);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply({error:'Origen inválido'}, 403);
  let input:unknown;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).length > 6000) return reply({error:'Solicitud demasiado extensa'}, 413);
    input = JSON.parse(body);
  } catch {return reply({error:'Solicitud inválida'}, 400);}
  try {
    // Requires the private Sites perimeter. Membership/roles remain pending.
    const actor = request.headers.get('oai-authenticated-user-email') || 'Responsable';
    return reply(await mutate(env.DB!, input, actor));
  } catch (error) {
    if (error instanceof ValidationError) return reply({error:error.message}, 400);
    if (error instanceof ConflictError) return reply({error:error.message}, 409);
    return reply({error:'No pudimos confirmar el resultado. Reintentá la misma operación para comprobarla sin duplicarla.'}, 503);
  }
}
