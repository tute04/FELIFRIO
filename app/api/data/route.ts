import { env } from 'cloudflare:workers';
import {apply,empty} from '../../../lib/domain';
export const dynamic='force-dynamic';
const reply=(v:any,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try{const row:any=await env.DB!.prepare('SELECT payload, revision FROM business WHERE id = 1').first();return reply({state:row?JSON.parse(row.payload):empty(),revision:row?.revision??0});}catch{return reply({error:'No se pudo leer la información. Intentá actualizar.'},500);}}
export async function POST(request:Request){
 try{if(!request.headers.get('content-type')?.includes('application/json'))return reply({error:'Formato inválido'},415);const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return reply({error:'Origen inválido'},403);
 const body=await request.json() as any;if(JSON.stringify(body).length>6000)return reply({error:'Solicitud demasiado extensa'},400);
 await env.DB!.prepare('INSERT OR IGNORE INTO business (id, payload, revision) VALUES (1, ?, 0)').bind(JSON.stringify(empty())).run();
 const row:any=await env.DB!.prepare('SELECT payload, revision FROM business WHERE id = 1').first();if(body.revision!==row.revision)return reply({error:'Otra sesión actualizó los datos. Ya los actualizamos: revisá y volvé a guardar.'},409);
 const actor=request.headers.get('oai-authenticated-user-email')||'Responsable';const state=apply(JSON.parse(row.payload),body.action,actor);
 const result=await env.DB!.prepare('UPDATE business SET payload = ?, revision = revision + 1 WHERE id = 1 AND revision = ?').bind(JSON.stringify(state),row.revision).run();if(!result.meta.changes)return reply({error:'Hubo otro cambio simultáneo. Actualizá e intentá de nuevo.'},409);
 return reply({state,revision:row.revision+1});
 }catch(e){return reply({error:e instanceof Error?e.message:'No se pudo guardar'},400);}
}
