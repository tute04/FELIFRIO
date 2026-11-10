import {parseAction, ValidationError, type Action} from './actions.ts';
import {addMoney, subtractMoney, multiplyMoney, cents} from './money.ts';
import {DEFAULT_PRODUCT, PRODUCT_ACTIONS, PRODUCT_IDS, blankStock, product, totalBags, type ProductId, type Stock, type Prices} from './products.ts';

export type Client = {id:string; name:string; address:string; phone:string; price:number; stock:number; debt:number; stockByProduct?:Stock; prices?:Prices};
export type Loss = {id:string; clientId:string; quantity:number; price:number; reason:string; status:string; productId?:ProductId};
export type Task = {id:string; title:string; date:string; responsible:string; done:boolean};
export type Purchase = {id:string; title:string; supplier:string; amount:number; paid:number};
export type Entry = {
  id:string; date:string; type:string; description:string; quantity:number; amount:number; actor:string;
  // Optional for compatibility with history created before this version.
  action?:Action; appliedPrice?:number; pricePolicy?:'precio-al-rendir'|'precio-al-informar-perdida';
  productId?:ProductId;
};
export type State = {factory:number; truck:number; cash:number; clients:Client[]; losses:Loss[]; tasks:Task[]; purchases:Purchase[]; entries:Entry[]; schemaVersion?:2; inventory?:{factory:Stock;truck:Stock}};
export const empty = ():State => ({factory:0, truck:0, cash:0, clients:[], losses:[], tasks:[], purchases:[], entries:[],schemaVersion:2,inventory:{factory:blankStock(),truck:blankStock()}});
export const money = (v:number) => new Intl.NumberFormat('es-AR', {style:'currency', currency:'ARS', minimumFractionDigits:2, maximumFractionDigits:2}).format(v);
const reject = (message:string):never => {throw new ValidationError(message);};

// The original app only represented rolito of 3 kg. Existing test data is
// preserved in that product; monetary balances and receipts are not rewritten.
export function normalizeState(state:State) {
  return {...state,schemaVersion:2 as const,
    inventory:state.inventory??{factory:blankStock(state.factory),truck:blankStock(state.truck)},
    clients:state.clients.map(c=>({...c,stockByProduct:c.stockByProduct??blankStock(c.stock),prices:c.prices??(c.price>0?{[DEFAULT_PRODUCT]:c.price}:{})})),
    losses:state.losses.map(l=>({...l,productId:l.productId??DEFAULT_PRODUCT})),
    entries:state.entries.map(e=>({...e,...((PRODUCT_ACTIONS as readonly string[]).includes(e.type)||e.type==='resolve'?{productId:e.productId??('productId' in (e.action??{})?(e.action as {productId?:ProductId}).productId:undefined)??DEFAULT_PRODUCT}:{})})),
  };
}

export function productView(state:State,id:ProductId):State {
  const s=normalizeState(state);
  return {...s,factory:s.inventory.factory[id],truck:s.inventory.truck[id],
    clients:s.clients.map(c=>({...c,stock:c.stockByProduct[id],price:c.prices[id]??0})),
  };
}

export function apply(previous:State, input:unknown, actor:string):State {
  const a = parseAction(input);
  const s = structuredClone(normalizeState(previous));
  let productId:ProductId|undefined = (PRODUCT_ACTIONS as readonly string[]).includes(a.type) ? ('productId' in a ? a.productId : undefined)??DEFAULT_PRODUCT : undefined;
  const sku=productId??DEFAULT_PRODUCT;
  const factory=s.inventory.factory,truck=s.inventory.truck;
  const id = crypto.randomUUID();
  const client = (clientId:string) => s.clients.find(c => c.id === clientId) ?? reject('Seleccioná un cliente existente');
  let description = '', quantity = 0, amount = 0;
  let appliedPrice:number|undefined, pricePolicy:Entry['pricePolicy'];

  switch (a.type) {
    case 'client': {
      if (s.clients.some(c => c.name.toLowerCase() === a.name.toLowerCase())) reject('Ya existe ese cliente');
      s.clients.push({id, name:a.name, address:a.address, phone:a.phone, price:sku===DEFAULT_PRODUCT?a.price:0, stock:0, debt:0,stockByProduct:blankStock(),prices:{[sku]:a.price}});
      description = 'Alta de cliente · ' + a.name;
      break;
    }
    case 'price': {
      const c = client(a.clientId); c.prices[sku] = a.price;
      description = 'Precio actualizado · ' + c.name; break;
    }
    case 'production':
      quantity = a.quantity; factory[sku] += quantity;
      description = 'Lote ' + a.batch + ' · ' + quantity * product(sku).kg + ' kg embolsados'; break;
    case 'load':
      quantity = a.quantity;
      if (quantity > factory[sku]) reject('No hay suficientes bolsas de este producto en fábrica');
      factory[sku] -= quantity; truck[sku] += quantity; description = 'Carga al vehículo'; break;
    case 'unload':
      quantity = a.quantity;
      if (quantity > truck[sku]) reject('La cantidad supera la carga de este producto en el vehículo');
      truck[sku] -= quantity; factory[sku] += quantity; description = 'Regreso a fábrica'; break;
    case 'delivery': {
      const c = client(a.clientId); quantity = a.quantity;
      if (quantity > truck[sku]) reject('Primero cargá suficientes bolsas de este producto al vehículo');
      truck[sku] -= quantity; c.stockByProduct[sku] += quantity; description = 'Entrega en consignación · ' + c.name; break;
    }
    case 'return': {
      const c = client(a.clientId); quantity = a.quantity;
      if (quantity > c.stockByProduct[sku]) reject('La devolución supera el stock de este producto en el cliente');
      c.stockByProduct[sku] -= quantity; truck[sku] += quantity; description = 'Devolución al vehículo · ' + c.name; break;
    }
    case 'settlement': {
      const c = client(a.clientId); quantity = c.stockByProduct[sku] - a.counted - a.loss;
      if (quantity < 0) reject('El recuento y las pérdidas superan el stock registrado');
      const price=c.prices[sku]??reject('Configurá el precio de este producto para el cliente antes de rendir.');
      appliedPrice = price; pricePolicy = 'precio-al-rendir';
      amount = multiplyMoney(price, quantity); c.debt = addMoney(c.debt, amount); c.stockByProduct[sku] = a.counted;
      if (a.loss) s.losses.push({id, clientId:c.id, quantity:a.loss, price, reason:a.reason, status:'Pendiente',productId:sku});
      description = 'Rendición · ' + c.name + ' · ' + a.counted + ' restantes · ' + a.loss + ' pérdidas'; break;
    }
    case 'collect': {
      const c = client(a.clientId); amount = a.amount;
      if (cents(amount) > cents(c.debt)) reject('El cobro supera la deuda del cliente');
      c.debt = subtractMoney(c.debt, amount); s.cash = addMoney(s.cash, amount);
      description = 'Cobro · ' + c.name + ' · ' + a.method; break;
    }
    case 'loss':
      quantity = a.quantity;
      if (quantity > factory[sku]) reject('La pérdida supera el stock de este producto en fábrica');
      factory[sku] -= quantity; description = 'Pérdida en fábrica · ' + a.reason; break;
    case 'resolve': {
      const l = s.losses.find(l => l.id === a.lossId) ?? reject('Pérdida inexistente');
      if (l.status !== 'Pendiente') reject('La pérdida no existe o ya fue resuelta');
      const c = client(l.clientId); l.status = a.resolution;
      productId=l.productId;
      appliedPrice = l.price; pricePolicy = 'precio-al-informar-perdida';
      if (l.status === 'Cliente paga') {amount = multiplyMoney(l.price, l.quantity); c.debt = addMoney(c.debt, amount);}
      quantity = l.quantity; description = 'Pérdida resuelta · ' + l.status + ' · ' + c.name; break;
    }
    case 'purchase':
      amount = a.amount;
      if (a.paid > amount) reject('El pago supera el importe de la compra');
      s.purchases.push({id, title:a.title, supplier:a.supplier, amount, paid:a.paid});
      s.cash = subtractMoney(s.cash, a.paid); description = 'Compra · ' + a.title + ' · pago ' + money(a.paid); break;
    case 'pay': {
      const p = s.purchases.find(p => p.id === a.purchaseId) ?? reject('Compra inexistente'); amount = a.amount;
      if (cents(amount) > cents(p.amount) - cents(p.paid)) reject('El pago supera el saldo pendiente');
      p.paid = addMoney(p.paid, amount); s.cash = subtractMoney(s.cash, amount); description = 'Pago a proveedor · ' + p.supplier; break;
    }
    case 'expense':
      amount = a.amount; s.cash = subtractMoney(s.cash, amount); description = 'Gasto · ' + a.title; break;
    case 'income':
      amount = a.amount; s.cash = addMoney(s.cash, amount); description = 'Ingreso de fondos · ' + a.title; break;
    case 'task':
      s.tasks.push({id, title:a.title, date:a.date, responsible:a.responsible, done:false}); description = 'Tarea · ' + a.title; break;
    case 'complete': {
      const t = s.tasks.find(t => t.id === a.taskId) ?? reject('Tarea inexistente');
      t.done = !t.done; description = (t.done ? 'Tarea completada · ' : 'Tarea reabierta · ') + t.title; break;
    }
  }
  s.factory=totalBags(factory);s.truck=totalBags(truck);
  for(const c of s.clients){c.stock=totalBags(c.stockByProduct);c.price=c.prices[DEFAULT_PRODUCT]??0;}
  const counts=[...Object.values(factory),...Object.values(truck),...s.clients.flatMap(c=>Object.values(c.stockByProduct)),s.factory,s.truck,...s.clients.map(c=>c.stock)];
  if (!counts.every(n => Number.isSafeInteger(n) && n >= 0)) {
    reject('El stock supera el límite admitido');
  }
  if(productId)description+=' · '+product(productId).label;
  s.entries.unshift({id, date:new Date().toISOString(), type:a.type, description, quantity, amount, actor, action:a, appliedPrice, pricePolicy,productId});
  return s;
}
