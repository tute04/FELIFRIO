# Felifrío · Gestión

Aplicación de producción y distribución de hielo en consignación. Rolito y triturado, en bolsas de 3 y 10 kg; un vehículo, producción y embolsado inmediato. Cada producto tiene existencias y precios independientes; los saldos de clientes y fondos reúnen todos los productos.

## Descarga local suspendida

Microsoft Defender detectó `Trojan:Script/Ulthar.A!ml` en el HTML del paquete 1.2. Los paquetes locales se retiraron de la rama mientras se investiga; no abrirlos ni agregar excepciones al antivirus. No se ha confirmado un falso positivo. [Evidencia y estado de la revisión](docs/revision-defender-2026-11-10.md).

## Versión 1.3 también retirada

El usuario confirmó que Chrome también bloquea la versión 1.3. Se retiró su descarga: separar archivos y actualizar Zod no resolvió el problema observado. El código y los datos del negocio se conservan. No publicar otro paquete como solución sin un análisis que explique la detección y valide el artefacto exacto. [Investigación y bloqueo pendiente](docs/bloqueo-defender-1.3.md).

## Operación
1. Crear clientes y configurar el precio por bolsa de cada producto.
2. Registrar producción por lote, tipo de hielo y presentación.
3. Cargar el vehículo y registrar las entregas en consignación.
4. Antes de reponer, contar cada producto en el cliente y registrar sus pérdidas por separado. La rendición calcula `stock registrado del producto - recuento - pérdidas` y genera deuda al precio vigente de ese producto para el cliente. Sin precio configurado, no permite rendir.
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
