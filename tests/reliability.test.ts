import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync, readdirSync} from 'node:fs';
import {apply,empty} from '../lib/domain.ts';
import {parseAction} from '../lib/actions.ts';
import {mutate,readState} from '../lib/data-service.ts';

// Executes the production service SQL against real SQLite transactions. The
// separate HTTP smoke test also exercises the actual local D1 runtime.
function database() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort()) sqlite.exec(readFileSync('drizzle/'+file,'utf8'));
  const prepare = (sql:string) => {
    let args:(string|number)[]=[];
    return {
      bind(...values:(string|number)[]){args=values;return this;},
      async first(){return sqlite.prepare(sql).get(...args)??null;},
      async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}};},
      execute(){return {meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}};},
    };
  };
  return {sqlite, db:{prepare, async batch(statements:ReturnType<typeof prepare>[]){
    sqlite.exec('BEGIN');
    try {const results=statements.map(s=>s.execute());sqlite.exec('COMMIT');return results;}
    catch(e){sqlite.exec('ROLLBACK');throw e;}
  }} as unknown as D1Database};
}
const request = (revision:number,action:unknown,operationId=crypto.randomUUID()) => ({revision,action,operationId});

test('contratos rechazan coerciones, fechas inexistentes y campos extra',()=>{
  for(const quantity of [true,null,'',' ',1.5,-1,NaN,Infinity,'0x10','1e3',{},[]]) {
    assert.throws(()=>parseAction({type:'production',quantity,batch:'TEST'}));
  }
  for(const date of ['2026-02-29','2026-13-01','2026-04-31','0000-01-01']) assert.throws(()=>parseAction({type:'task',date,title:'Test',responsible:'Test'}));
  assert.equal(parseAction({type:'task',date:'2028-02-29',title:'Test',responsible:'Test'}).type,'task');
  assert.throws(()=>parseAction({type:'income',title:'Test',amount:1.001}));
  assert.throws(()=>parseAction({type:'collect',clientId:'x',amount:1,method:'Inventado'}));
  assert.throws(()=>parseAction({type:'load',quantity:1,admin:true}));
  assert.throws(()=>apply(empty(),{type:'delivery',clientId:'missing',quantity:1},'test'));
});

test('caso principal, recuento repetido, cobro anterior y reposición',()=>{
  let state=empty();const run=(a:unknown)=>state=apply(state,a,'test');
  run({type:'client',name:'Fixture',price:1000});const clientId=state.clients[0].id;
  run({type:'production',quantity:200,batch:'FIXTURE'});run({type:'load',quantity:40});run({type:'delivery',clientId,quantity:40});
  assert.equal(state.factory+state.truck+state.clients[0].stock,200);
  run({type:'settlement',clientId,counted:15,loss:0});run({type:'collect',clientId,amount:20000,method:'Efectivo'});
  assert.deepEqual([state.factory,state.truck,state.clients[0].stock,state.clients[0].debt,state.cash],[160,0,15,5000,20000]);
  run({type:'settlement',clientId,counted:15,loss:0});assert.equal(state.clients[0].debt,5000);
  run({type:'collect',clientId,amount:5000,method:'Transferencia'});assert.equal(state.clients[0].debt,0);
  run({type:'load',quantity:20});run({type:'delivery',clientId,quantity:20});assert.equal(state.clients[0].stock,35);assert.equal(state.clients[0].debt,0);
});

test('aritmética en centavos y operaciones inválidas no mutan el estado',()=>{
  let state=apply(empty(),{type:'income',title:'Test',amount:0.1},'test');
  state=apply(state,{type:'income',title:'Test',amount:0.2},'test');assert.equal(state.cash,0.3);
  const before=structuredClone(state);assert.throws(()=>apply(state,{type:'load',quantity:1},'test'));assert.deepEqual(state,before);
  state=apply(state,{type:'purchase',title:'Test',supplier:'Fixture',amount:0.3,paid:0.1},'test');
  state=apply(state,{type:'pay',purchaseId:state.purchases[0].id,amount:0.2},'test');assert.equal(state.cash,0);assert.equal(state.purchases[0].paid,0.3);
});

test('reintento secuencial y simultáneo genera un único movimiento',async()=>{
  const {db,sqlite}=database();try {
    const req=request(0,{type:'production',quantity:1,batch:'FIXTURE'});
    const results=await Promise.all([mutate(db,req,'test'),mutate(db,req,'test')]);
    assert.equal(results.filter(r=>r.replayed).length,1);
    await mutate(db,req,'test');
    const state=await readState(db);assert.equal(state.revision,1);assert.equal(state.state.factory,1);assert.equal(state.state.entries.length,1);
    await assert.rejects(mutate(db,{...req,action:{type:'production',quantity:2,batch:'FIXTURE'}},'test'));
    await assert.rejects(mutate(db,req,'other'));
  } finally {sqlite.close();}
});

test('dos sesiones no consumen la misma última bolsa',async()=>{
  const {db,sqlite}=database();try {
    await mutate(db,request(0,{type:'production',quantity:1,batch:'FIXTURE'}),'test');
    const results=await Promise.allSettled([mutate(db,request(1,{type:'load',quantity:1}),'a'),mutate(db,request(1,{type:'load',quantity:1}),'b')]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    const {state,revision}=await readState(db);assert.equal(revision,2);assert.equal(state.factory,0);assert.equal(state.truck,1);
  } finally {sqlite.close();}
});

test('una falla al guardar revierte también el recibo de idempotencia',async()=>{
  const {db,sqlite}=database();try {
    sqlite.exec("CREATE TRIGGER fail_update BEFORE UPDATE ON business BEGIN SELECT RAISE(ABORT, 'simulated write failure'); END");
    const req=request(0,{type:'production',quantity:1,batch:'FIXTURE'});
    await assert.rejects(mutate(db,req,'test'));
    assert.equal(sqlite.prepare('SELECT count(*) AS n FROM operations').get()!.n,0);
    assert.equal((await readState(db)).revision,0);
    sqlite.exec('DROP TRIGGER fail_update');await mutate(db,req,'test');assert.equal((await readState(db)).state.factory,1);
  } finally {sqlite.close();}
});
