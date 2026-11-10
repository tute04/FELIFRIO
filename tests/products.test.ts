import {test} from 'node:test';
import assert from 'node:assert/strict';
import {apply,empty,normalizeState,productView,type State} from '../lib/domain.ts';
import {PRODUCTS,totalKg} from '../lib/products.ts';
import {parseAction} from '../lib/actions.ts';

test('cuatro productos: stock aislado, kilos correctos, precios por cliente y saldo común',()=>{
  let state=empty();
  const run=(action:unknown)=>state=apply(state,action,'test');
  run({type:'client',name:'Cuatro productos',price:1000,productId:'rolito-3'});
  const clientId=state.clients[0].id;
  for(const [i,p] of PRODUCTS.entries()){
    run({type:'price',clientId,price:(i+1)*1000,productId:p.id});
    run({type:'production',quantity:20,batch:p.id,productId:p.id});
    assert.match(state.entries[0].description,new RegExp(`${20*p.kg} kg`));
    run({type:'load',quantity:10,productId:p.id});
    run({type:'delivery',clientId,quantity:8,productId:p.id});
    assert.equal(state.cash,0);
    run({type:'settlement',clientId,counted:5,loss:0,productId:p.id});
    const view=productView(state,p.id);
    assert.deepEqual([view.factory,view.truck,view.clients[0].stock],[10,2,5]);
    assert.equal(state.entries[0].amount,3*(i+1)*1000);
  }
  const s=normalizeState(state);
  assert.equal(state.clients[0].debt,30000);
  assert.equal(state.factory,40);assert.equal(state.truck,8);assert.equal(state.clients[0].stock,20);
  assert.equal(totalKg(s.inventory.factory),260);
  assert.equal(totalKg(s.clients[0].stockByProduct),130);
  run({type:'collect',clientId,amount:12000,method:'Efectivo'});
  assert.equal(state.clients[0].debt,18000);assert.equal(state.cash,12000);
  for(const p of PRODUCTS)assert.equal(productView(state,p.id).clients[0].stock,5);
});

test('no se consumen existencias de otro producto ni se vende sin precio configurado',()=>{
  let s=empty();const run=(a:unknown)=>s=apply(s,a,'test');
  run({type:'client',name:'Comercio',price:1000,productId:'rolito-3'});const clientId=s.clients[0].id;
  run({type:'production',quantity:30,batch:'Rolito',productId:'rolito-3'});
  const before=structuredClone(s);
  assert.throws(()=>run({type:'load',quantity:1,productId:'triturado-10'}));assert.deepEqual(s,before);
  run({type:'production',quantity:10,batch:'Triturado',productId:'triturado-10'});
  run({type:'load',quantity:10,productId:'triturado-10'});
  run({type:'delivery',clientId,quantity:10,productId:'triturado-10'});
  const delivered=structuredClone(s);
  assert.throws(()=>run({type:'settlement',clientId,counted:5,loss:0,productId:'triturado-10'}),/precio/);
  assert.deepEqual(s,delivered);assert.equal(s.clients[0].debt,0);
  assert.throws(()=>run({type:'return',clientId,quantity:1,productId:'rolito-3'}));
  assert.throws(()=>parseAction({type:'production',quantity:2,batch:'x',productId:'rolito-5'}));
});

test('pérdidas congelan producto y precio; retiros y regresos mantienen la variante',()=>{
  let s=empty();const run=(a:unknown)=>s=apply(s,a,'test');
  run({type:'client',name:'Comercio',price:3200,productId:'triturado-10'});const clientId=s.clients[0].id;
  run({type:'production',quantity:20,batch:'Lote',productId:'triturado-10'});
  run({type:'load',quantity:12,productId:'triturado-10'});
  run({type:'delivery',clientId,quantity:10,productId:'triturado-10'});
  run({type:'settlement',clientId,counted:6,loss:2,reason:'Rotura',productId:'triturado-10'});
  assert.equal(s.clients[0].debt,6400);assert.equal(s.losses[0].productId,'triturado-10');
  run({type:'price',clientId,price:5000,productId:'triturado-10'});
  run({type:'resolve',lossId:s.losses[0].id,resolution:'Cliente paga'});
  assert.equal(s.clients[0].debt,12800);assert.equal(s.entries[0].productId,'triturado-10');
  run({type:'return',clientId,quantity:3,productId:'triturado-10'});
  run({type:'unload',quantity:5,productId:'triturado-10'});
  run({type:'loss',quantity:1,reason:'Descarte',productId:'triturado-10'});
  assert.deepEqual([s.factory,s.truck,s.clients[0].stock],[12,0,3]);
  assert.equal(productView(s,'rolito-3').factory,0);
  assert.equal(productView(s,'triturado-10').clients[0].price,5000);
});

test('estado anterior se conserva como rolito de 3 kg sin duplicar cantidades ni saldos',()=>{
  const old:State={factory:12,truck:4,cash:500,clients:[{id:'c',name:'Anterior',address:'',phone:'',price:1000,stock:7,debt:3000}],losses:[],purchases:[],tasks:[],entries:[]};
  const original=structuredClone(old),s=normalizeState(old);
  assert.deepEqual(old,original);
  assert.equal(s.inventory.factory['rolito-3'],12);
  assert.equal(s.clients[0].stockByProduct['rolito-3'],7);
  assert.equal(s.clients[0].prices['rolito-10'],undefined);
  assert.deepEqual(normalizeState(s),s);
  const next=apply(old,{type:'production',quantity:2,batch:'Nuevo',productId:'rolito-10'},'test');
  assert.equal(next.factory,14);assert.equal(next.clients[0].debt,3000);assert.equal(next.cash,500);
  assert.equal(productView(next,'rolito-10').factory,2);
  assert.equal(productView(next,'rolito-3').factory,12);
});
