export const PRODUCT_IDS = ['rolito-3','rolito-10','triturado-3','triturado-10'] as const;
export type ProductId = typeof PRODUCT_IDS[number];
export const DEFAULT_PRODUCT:ProductId = 'rolito-3';
export const PRODUCTS = [
  {id:'rolito-3',label:'Rolito · 3 kg',kind:'Rolito',kg:3},
  {id:'rolito-10',label:'Rolito · 10 kg',kind:'Rolito',kg:10},
  {id:'triturado-3',label:'Triturado · 3 kg',kind:'Triturado',kg:3},
  {id:'triturado-10',label:'Triturado · 10 kg',kind:'Triturado',kg:10},
] as const;
export type Stock = Record<ProductId,number>;
export type Prices = Partial<Record<ProductId,number>>;
export const blankStock = (legacy=0):Stock => ({'rolito-3':legacy,'rolito-10':0,'triturado-3':0,'triturado-10':0});
export const product = (id:ProductId) => PRODUCTS.find(p=>p.id===id)!;
export const totalBags = (stock:Stock) => PRODUCT_IDS.reduce((n,id)=>n+stock[id],0);
export const totalKg = (stock:Stock) => PRODUCTS.reduce((n,p)=>n+stock[p.id]*p.kg,0);
export const PRODUCT_ACTIONS = ['client','price','production','load','unload','delivery','return','settlement','loss'] as const;
