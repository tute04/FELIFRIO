// Compatibility boundary: the legacy payload still stores pesos. Arithmetic
// uses safe integer cents; a future versioned migration will change storage.
export function cents(pesos: number): number {
  const value = Math.round(pesos * 100);
  if (!Number.isFinite(pesos) || !Number.isSafeInteger(value)) {
    throw new Error('El importe supera el límite admitido');
  }
  return value;
}
export function pesos(value: number): number {
  if (!Number.isSafeInteger(value)) throw new Error('El importe supera el límite admitido');
  return value / 100;
}
export const addMoney = (left: number, right: number) => pesos(cents(left) + cents(right));
export const subtractMoney = (left: number, right: number) => pesos(cents(left) - cents(right));
export const multiplyMoney = (price: number, quantity: number) => pesos(cents(price) * quantity);
