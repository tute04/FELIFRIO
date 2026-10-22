import {parseAction, ValidationError, type Action} from './actions.ts';
import {addMoney, subtractMoney, multiplyMoney, cents} from './money.ts';

export type Client = {id:string; name:string; address:string; phone:string; price:number; stock:number; debt:number};
export type Loss = {id:string; clientId:string; quantity:number; price:number; reason:string; status:string};
export type Task = {id:string; title:string; date:string; responsible:string; done:boolean};
export type Purchase = {id:string; title:string; supplier:string; amount:number; paid:number};
export type Entry = {
  id:string; date:string; type:string; description:string; quantity:number; amount:number; actor:string;
  // Optional for compatibility with history created before this version.
  action?:Action; appliedPrice?:number; pricePolicy?:'precio-al-rendir'|'precio-al-informar-perdida';
};
export type State = {factory:number; truck:number; cash:number; clients:Client[]; losses:Loss[]; tasks:Task[]; purchases:Purchase[]; entries:Entry[]};
export const empty = ():State => ({factory:0, truck:0, cash:0, clients:[], losses:[], tasks:[], purchases:[], entries:[]});
export const money = (v:number) => new Intl.NumberFormat('es-AR', {style:'currency', currency:'ARS', minimumFractionDigits:2, maximumFractionDigits:2}).format(v);
const reject = (message:string):never => {throw new ValidationError(message);};

export function apply(previous:State, input:unknown, actor:string):State {
  const a = parseAction(input);
  const s = structuredClone(previous);
  const id = crypto.randomUUID();
  const client = (clientId:string) => s.clients.find(c => c.id === clientId) ?? reject('Seleccioná un cliente existente');
  let description = '', quantity = 0, amount = 0;
  let appliedPrice:number|undefined, pricePolicy:Entry['pricePolicy'];

  switch (a.type) {
    case 'client': {
      if (s.clients.some(c => c.name.toLowerCase() === a.name.toLowerCase())) reject('Ya existe ese cliente');
      s.clients.push({id, name:a.name, address:a.address, phone:a.phone, price:a.price, stock:0, debt:0});
      description = 'Alta de cliente · ' + a.name;
      break;
    }
    case 'price': {
      const c = client(a.clientId); c.price = a.price;
      description = 'Precio actualizado · ' + c.name; break;
    }
    case 'production':
      quantity = a.quantity; s.factory += quantity;
      description = 'Lote ' + a.batch + ' · ' + quantity * 3 + ' kg embolsados'; break;
    case 'load':
      quantity = a.quantity;
      if (quantity > s.factory) reject('No hay suficientes bolsas en fábrica');
      s.factory -= quantity; s.truck += quantity; description = 'Carga al vehículo'; break;
    case 'unload':
      quantity = a.quantity;
      if (quantity > s.truck) reject('La cantidad supera la carga del vehículo');
      s.truck -= quantity; s.factory += quantity; description = 'Regreso a fábrica'; break;
    case 'delivery': {
      const c = client(a.clientId); quantity = a.quantity;
      if (quantity > s.truck) reject('Primero cargá suficientes bolsas al vehículo');
      s.truck -= quantity; c.stock += quantity; description = 'Entrega en consignación · ' + c.name; break;
    }
    case 'return': {
      const c = client(a.clientId); quantity = a.quantity;
      if (quantity > c.stock) reject('La devolución supera el stock del cliente');
      c.stock -= quantity; s.truck += quantity; description = 'Devolución al vehículo · ' + c.name; break;
    }
    case 'settlement': {
      const c = client(a.clientId); quantity = c.stock - a.counted - a.loss;
      if (quantity < 0) reject('El recuento y las pérdidas superan el stock registrado');
      appliedPrice = c.price; pricePolicy = 'precio-al-rendir';
      amount = multiplyMoney(c.price, quantity); c.debt = addMoney(c.debt, amount); c.stock = a.counted;
      if (a.loss) s.losses.push({id, clientId:c.id, quantity:a.loss, price:c.price, reason:a.reason, status:'Pendiente'});
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
      if (quantity > s.factory) reject('La pérdida supera el stock de fábrica');
      s.factory -= quantity; description = 'Pérdida en fábrica · ' + a.reason; break;
    case 'resolve': {
      const l = s.losses.find(l => l.id === a.lossId) ?? reject('Pérdida inexistente');
      if (l.status !== 'Pendiente') reject('La pérdida no existe o ya fue resuelta');
      const c = client(l.clientId); l.status = a.resolution;
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
  if (![s.factory, s.truck, ...s.clients.map(c => c.stock)].every(n => Number.isSafeInteger(n) && n >= 0)) {
    reject('El stock supera el límite admitido');
  }
  s.entries.unshift({id, date:new Date().toISOString(), type:a.type, description, quantity, amount, actor, action:a, appliedPrice, pricePolicy});
  return s;
}
