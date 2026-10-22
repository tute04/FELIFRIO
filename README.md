# Felifrío · Gestión

Aplicación privada de producción y distribución de hielo en consignación. Bolsas de 3 kg, un vehículo, producción y embolsado inmediato.

## Operación
1. Crear clientes con precio por bolsa.
2. Registrar producción por lote.
3. Cargar el vehículo y registrar las entregas en consignación.
4. Antes de reponer, contar bolsas en el cliente y registrar pérdidas por separado. La rendición calcula `stock registrado - recuento - pérdidas` y genera deuda al precio vigente del cliente.
5. Registrar cobros completos o parciales. Las entregas no generan deuda ni fondos.
6. Reponer bolsas. Los retiros regresan al vehículo y luego a fábrica.

Las pérdidas en comercios se resuelven explícitamente: Felifrío absorbe o cliente paga al precio congelado al informar la pérdida. Compras a proveedores permiten pagos parciales. Los gastos y pagos modifican fondos; las compras impagas no. El saldo reúne efectivo y cuentas y no representa ganancia.

El stock inicial es cero. Registrar existencias iniciales como un lote claramente identificado y distribuirlas antes de la primera rendición si correspondiera. La aplicación no emite facturas fiscales ni calcula impuestos. La agenda permite asignar pendientes y fechas; no optimiza rutas.

## Persistencia y acceso
Base D1 compartida dentro del Site. Registro de movimientos y exportación JSON. Los cambios usan una revisión con actualización condicional para impedir que sesiones simultáneas se sobrescriban. La publicación inicial es privada al propietario; no implica acceso habilitado a familiares u otros usuarios. La plataforma Sites controla el acceso. No convertir en pública sin añadir autorización de operaciones.

## Validación
`node --experimental-strip-types tests/domain.test.ts`
`node node_modules/typescript/bin/tsc --noEmit`

Compilación con el helper del plugin Sites. Migraciones de esquema en drizzle; las aplica la plataforma al publicar.

## Desarrollo local

Node 24.19.0 y pnpm 11.25.0. Desde la raíz: `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm typecheck`, `pnpm build`. Arranque: `pnpm dev --host 127.0.0.1`.

D1 local debe tener las migraciones de `drizzle/` aplicadas en orden. Usar Wrangler con `--local --config dist/server/wrangler.json --persist-to .wrangler/state`; ejecutar cada SQL sólo cuando no fue aplicado. La nueva tabla `operations` es obligatoria para guardar. No usar `--remote` para ensayos.

Para probar el build: `mkdir -p .sites-runtime/xdg-config` y `XDG_CONFIG_HOME="$PWD/.sites-runtime/xdg-config" pnpm start --port 8787`.

Al perder conexión, usar **Comprobar sin duplicar**: la misma solicitud queda conservada en la pestaña. Ante conflicto, revisar los valores actualizados y confirmar nuevamente. No borrar el almacenamiento de la pestaña mientras haya operaciones pendientes.

Alcance, límites y pasos de despliegue: [primera entrega](docs/primera-entrega.md). Encargo completo: [documento original](docs/encargo-original.md).
