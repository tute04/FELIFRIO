export type Client={id:string;name:string;address:string;phone:string;price:number;stock:number;debt:number};
export type Loss={id:string;clientId:string;quantity:number;price:number;reason:string;status:string};
export type Task={id:string;title:string;date:string;responsible:string;done:boolean};
export type Purchase={id:string;title:string;supplier:string;amount:number;paid:number};
export type Entry={id:string;date:string;type:string;description:string;quantity:number;amount:number;actor:string};
export type State={factory:number;truck:number;cash:number;clients:Client[];losses:Loss[];tasks:Task[];purchases:Purchase[];entries:Entry[]};
export const empty=():State=>({factory:0,truck:0,cash:0,clients:[],losses:[],tasks:[],purchases:[],entries:[]});
export const money=(v:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(v);
export function apply(previous:State,a:any,actor:string):State{
 const s:State=structuredClone(previous); const id=crypto.randomUUID();const num=(key:string,integer=false,zero=false)=>{const n=Number(a[key]);if(a[key]===''||a[key]==null||!Number.isFinite(n)||n<(zero?0:0.000001)||n>1e10||(integer&&!Number.isInteger(n)))throw Error('Revisá el valor de '+key);return n;};
 const str=(key:string,required=true)=>{const t=String(a[key]??'').trim();if((required&&!t)||t.length>300)throw Error('Completá '+key);return t;};
 const client=()=>{const c=s.clients.find(c=>c.id===a.clientId);if(!c)throw Error('Seleccioná un cliente');return c;};
 let description='',quantity=0,amount=0;
 switch(a.type){
 case 'client':{const name=str('name');if(s.clients.some(c=>c.name.toLowerCase()===name.toLowerCase()))throw Error('Ya existe ese cliente');s.clients.push({id,name,address:str('address',false),phone:str('phone',false),price:num('price'),stock:0,debt:0});description='Alta de cliente · '+name;break;}
 case 'price':{const c=client();c.price=num('price');description='Precio actualizado · '+c.name;break;}
 case 'production':quantity=num('quantity',true);s.factory+=quantity;description='Lote '+str('batch')+' · '+quantity*3+' kg embolsados';break;
 case 'load':quantity=num('quantity',true);if(quantity>s.factory)throw Error('No hay suficientes bolsas en fábrica');s.factory-=quantity;s.truck+=quantity;description='Carga al vehículo';break;
 case 'unload':quantity=num('quantity',true);if(quantity>s.truck)throw Error('La cantidad supera la carga del vehículo');s.truck-=quantity;s.factory+=quantity;description='Regreso a fábrica';break;
 case 'delivery':{const c=client();quantity=num('quantity',true);if(quantity>s.truck)throw Error('Primero cargá suficientes bolsas al vehículo');s.truck-=quantity;c.stock+=quantity;description='Entrega en consignación · '+c.name;break;}
 case 'return':{const c=client();quantity=num('quantity',true);if(quantity>c.stock)throw Error('La devolución supera el stock del cliente');c.stock-=quantity;s.truck+=quantity;description='Devolución al vehículo · '+c.name;break;}
 case 'settlement':{const c=client();const counted=num('counted',true,true),loss=num('loss',true,true);quantity=c.stock-counted-loss;if(quantity<0)throw Error('El recuento y las pérdidas superan el stock registrado');amount=Math.round(quantity*c.price*100)/100;c.debt+=amount;c.stock=counted;if(loss)s.losses.push({id,clientId:c.id,quantity:loss,price:c.price,reason:str('reason'),status:'Pendiente'});description='Rendición · '+c.name+' · '+counted+' restantes · '+loss+' pérdidas';break;}
 case 'collect':{const c=client();amount=num('amount');if(amount>c.debt+.001)throw Error('El cobro supera la deuda del cliente');c.debt=Math.max(0,Math.round((c.debt-amount)*100)/100);s.cash+=amount;description='Cobro · '+c.name+' · '+str('method');break;}
 case 'loss':quantity=num('quantity',true);if(quantity>s.factory)throw Error('La pérdida supera el stock de fábrica');s.factory-=quantity;description='Pérdida en fábrica · '+str('reason');break;
 case 'resolve':{const l=s.losses.find(l=>l.id===a.lossId);if(!l||l.status!=='Pendiente')throw Error('La pérdida ya fue resuelta');if(!['Felifrío absorbe','Cliente paga'].includes(a.resolution))throw Error('Seleccioná una resolución');l.status=a.resolution;if(l.status==='Cliente paga'){const c=s.clients.find(c=>c.id===l.clientId)!;amount=l.quantity*l.price;c.debt+=amount;}quantity=l.quantity;description='Pérdida resuelta · '+l.status+' · '+s.clients.find(c=>c.id===l.clientId)?.name;break;}
 case 'purchase':{amount=num('amount');const paid=num('paid',false,true);if(paid>amount)throw Error('El pago supera el importe de la compra');s.purchases.push({id,title:str('title'),supplier:str('supplier'),amount,paid});s.cash-=paid;description='Compra · '+str('title')+' · pago '+money(paid);break;}
 case 'pay':{const p=s.purchases.find(p=>p.id===a.purchaseId);if(!p)throw Error('Compra inexistente');amount=num('amount');if(amount>p.amount-p.paid+.001)throw Error('El pago supera el saldo pendiente');p.paid+=amount;s.cash-=amount;description='Pago a proveedor · '+p.supplier;break;}
 case 'expense':amount=num('amount');s.cash-=amount;description='Gasto · '+str('title');break;
 case 'income':amount=num('amount');s.cash+=amount;description='Ingreso de fondos · '+str('title');break;
 case 'task':{const date=str('date');if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Fecha inválida');s.tasks.push({id,title:str('title'),date,responsible:str('responsible'),done:false});description='Tarea · '+str('title');break;}
 case 'complete':{const t=s.tasks.find(t=>t.id===a.taskId);if(!t)throw Error('Tarea inexistente');t.done=!t.done;description=(t.done?'Tarea completada · ':'Tarea reabierta · ')+t.title;break;}
 default:throw Error('Operación desconocida');
 }
 s.entries.unshift({id,date:new Date().toISOString(),type:a.type,description,quantity,amount,actor});return s;
}
