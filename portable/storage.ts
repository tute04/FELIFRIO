import {z} from 'zod';
import {apply, empty, type State} from '../lib/domain';
import {parseAction, ValidationError} from '../lib/actions';
import {cents} from '../lib/money';

const DATABASE = 'felifrio-prueba-local-v1';
export const PENDING_KEY = 'felifrio.local.v1.pending';
type Snapshot = {state:State; revision:number};
type Receipt = {request:string; revision:number};
class LocalError extends Error {
  status:number;
  constructor(message:string,status=400){super(message);this.status=status;}
}
let opening:Promise<IDBDatabase>|undefined;
function database():Promise<IDBDatabase> {
  if (!opening) opening = new Promise<IDBDatabase>((resolve,reject) => {
    if (!globalThis.indexedDB) {reject(new LocalError('Este navegador no permite guardar los datos. Abrí el archivo en Chrome o Edge, fuera del modo privado.',503));return;}
    const request = indexedDB.open(DATABASE,1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('state');
      request.result.createObjectStore('receipts');
    };
    request.onsuccess = () => {const db=request.result;db.onversionchange=()=>{db.close();opening=undefined;};resolve(db);};
    request.onerror = () => reject(new LocalError('No se pudo abrir el almacenamiento local. Usá Chrome o Edge en una ventana normal y permití guardar datos.',503));
    request.onblocked = () => reject(new LocalError('Cerrá las otras pestañas de Felifrío y volvé a abrir la app.',503));
  }).catch(error => {opening=undefined;throw error;});
  return opening;
}

async function transaction<T>(mode:IDBTransactionMode,work:(tx:IDBTransaction,finish:(result:T)=>void,fail:(error:Error)=>void)=>void):Promise<T> {
  const db=await database();
  return new Promise((resolve,reject) => {
    const tx=db.transaction(['state','receipts'],mode);
    let result:T, failure:Error|undefined;
    const fail=(error:Error)=>{failure=error;tx.abort();};
    tx.oncomplete=()=>resolve(result);
    tx.onabort=()=>reject(failure ?? new LocalError('No se pudo guardar. Revisá el espacio del equipo y comprobá la operación pendiente antes de continuar.',503));
    try {work(tx,value=>{result=value;},fail);} catch(error) {fail(error as Error);}
  });
}

export function readLocal():Promise<Snapshot> {
  return transaction('readonly',(tx,finish)=>{
    const request=tx.objectStore('state').get('business');
    request.onsuccess=()=>finish(request.result ?? {state:empty(),revision:0});
  });
}

const envelope=z.object({operationId:z.string().uuid(),revision:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER-1),action:z.unknown()}).strict();
export async function mutateLocal(input:unknown):Promise<Snapshot & {replayed:boolean}> {
  const parsed=envelope.safeParse(input);
  if (!parsed.success) throw new LocalError('Solicitud inválida. Revisá los datos y actualizá la app.');
  const {operationId,revision}=parsed.data;
  const action=parseAction(parsed.data.action), serialized=JSON.stringify(action);
  return transaction('readwrite',(tx,finish,fail)=>{
    const states=tx.objectStore('state'),receipts=tx.objectStore('receipts');
    const currentRequest=states.get('business');
    currentRequest.onsuccess=()=>{
      const current:Snapshot=currentRequest.result ?? {state:empty(),revision:0};
      const previousRequest=receipts.get(operationId);
      previousRequest.onsuccess=()=>{
        try {
          const previous:Receipt|undefined=previousRequest.result;
          if (previous) {
            if(previous.request!==serialized) throw new LocalError('Ese identificador corresponde a otra operación.',409);
            finish({...current,replayed:true});return;
          }
          if (current.revision!==revision) throw new LocalError('Otra pestaña actualizó los datos. Revisá los valores y volvé a confirmar.',409);
          const updated={state:apply(current.state,action,'Prueba local'),revision:revision+1};
          states.put(updated,'business');
          receipts.put({request:serialized,revision:updated.revision},operationId);
          finish({...updated,replayed:false});
        } catch(error){fail(error as Error);}
      };
    };
  });
}

// This adapter is injected into the existing UI. It never contacts the server.
export const localRequest:typeof fetch=async (_input,init) => {
  try {
    const data=init?.method==='POST' ? await mutateLocal(JSON.parse(String(init.body))) : await readLocal();
    return Response.json(data);
  } catch(error) {
    const status=error instanceof LocalError ? error.status : error instanceof ValidationError || error instanceof SyntaxError ? 400 : 503;
    const message=error instanceof LocalError || error instanceof ValidationError ? error.message : 'No pudimos confirmar el guardado local. Comprobá la operación pendiente antes de continuar.';
    return Response.json({error:message},{status});
  }
};

const text=z.string().max(2000),id=z.string().min(1).max(100);
const stock=z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const value=z.number().finite().refine(n=>{try{return n===cents(n)/100;}catch{return false;}},'Importe inválido');
const nonnegative=value.refine(n=>n>=0);
const positive=value.refine(n=>n>0);
const list=<T extends z.ZodTypeAny>(schema:T)=>z.array(schema).max(100000);
const stateSchema=z.object({
  factory:stock,truck:stock,cash:value,
  clients:list(z.object({id,name:text.min(1),address:text,phone:text,price:positive,stock,debt:nonnegative}).strict()),
  losses:list(z.object({id,clientId:id,quantity:stock.refine(n=>n>0),price:positive,reason:text,status:z.enum(['Pendiente','Felifrío absorbe','Cliente paga'])}).strict()),
  tasks:list(z.object({id,title:text,date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),responsible:text,done:z.boolean()}).strict()),
  purchases:list(z.object({id,title:text,supplier:text,amount:positive,paid:nonnegative}).strict().refine(p=>p.paid<=p.amount)),
  entries:list(z.object({id,date:z.string().refine(d=>Number.isFinite(Date.parse(d))),type:text,description:text,quantity:stock,amount:value,actor:text,action:z.unknown().optional(),appliedPrice:positive.optional(),pricePolicy:z.enum(['precio-al-rendir','precio-al-informar-perdida']).optional()}).strict()),
}).strict();

export function parseBackup(input:unknown):State {
  if (!input || typeof input!=='object' || !('state' in input)) throw new LocalError('El archivo no es un respaldo de Felifrío.');
  const parsed=stateSchema.safeParse(input.state);
  if (!parsed.success) throw new LocalError('El respaldo tiene datos inválidos. No se importó ningún dato.');
  const state=parsed.data;
  for(const collection of [state.clients,state.losses,state.tasks,state.purchases,state.entries]) {
    if(new Set(collection.map(item=>item.id)).size!==collection.length) throw new LocalError('El respaldo contiene identificadores duplicados.');
  }
  if(new Set(state.clients.map(c=>c.name.trim().toLowerCase())).size!==state.clients.length) throw new LocalError('El respaldo contiene clientes duplicados.');
  const clientIds=new Set(state.clients.map(c=>c.id));
  if(state.losses.some(loss=>!clientIds.has(loss.clientId))) throw new LocalError('Una pérdida del respaldo no tiene un cliente válido.');
  for(const task of state.tasks) parseAction({type:'task',title:task.title,date:task.date,responsible:task.responsible});
  return {...state,entries:state.entries.map(entry=>({...entry,...(entry.action===undefined?{}:{action:parseAction(entry.action)})}))} as State;
}

export async function importBackup(input:unknown):Promise<void> {
  const state=parseBackup(input);
  if(sessionStorage.getItem(PENDING_KEY)) throw new LocalError('Primero comprobá la operación pendiente antes de importar un respaldo.');
  await transaction<void>('readwrite',(tx,finish,fail)=>{
    const states=tx.objectStore('state');
    const request=states.get('business');
    request.onsuccess=()=>{
      const current:Snapshot|undefined=request.result;
      if(current && current.revision>0) {fail(new LocalError('Esta app ya tiene datos. Para protegerlos, sólo se puede importar en un navegador sin registros. Exportá tu respaldo actual antes de trasladarte a otro navegador.',409));return;}
      states.put({state,revision:1},'business');
      finish();
    };
  });
}
