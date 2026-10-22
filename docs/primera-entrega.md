# Primera entrega: base verificable

Se importó el ZIP entregado al checkout de `tute04/FELIFRIO`, conservando su manifest Sites. El primer commit contiene el snapshot original. No se conectó a producción ni se migraron sus datos. La copia previa `/workspace/felifrio-local` se conserva como referencia.

## Implementado

- Contratos estrictos compartidos entre formularios y servidor. Fechas reales, cantidades enteras, importes positivos con hasta dos decimales, medios permitidos y referencias existentes. Se rechazan campos extra y coerciones de booleanos/null.
- Dominio con acciones tipadas; las nuevas entradas guardan la acción estructurada, referencias, precio aplicado y política de valoración en rendiciones y pérdidas.
- Cálculos monetarios en centavos enteros seguros. **El payload sigue expresado en pesos por compatibilidad**; esto todavía no es la migración del modelo contable. Los valores históricos no se reescriben en bloque. La visualización muestra dos decimales.
- Tabla aditiva `operations`, con identificador de solicitud, contenido normalizado, actor y revisión. La actualización de estado y el recibo se confirman juntos en una transacción D1 `batch`. Un reintento idéntico devuelve el estado actual sin repetir la acción; cambiar su contenido o actor produce conflicto.
- Solicitud pendiente conservada en `sessionStorage` antes de enviar. Doble clic bloqueado; tras error de transporte se reutiliza la misma clave. Una recarga de esa pestaña permite comprobar el resultado. La app no confirma nuevas operaciones mientras haya una pendiente.
- Conflictos recuperables conservan el formulario. Errores internos de almacenamiento se presentan sin detalles SQL.

## Verificación

`pnpm test`: escenario original y seis pruebas adicionales de contratos, circuito principal, centavos, reintentos secuenciales/simultáneos, competencia por la última bolsa y rollback ante fallo de escritura. Estas pruebas ejecutan el SQL real en SQLite con adaptador D1. Complementar con el recorrido HTTP/browser de D1 local. `pnpm typecheck` y `pnpm build`.

La grabación promocional usa un comercio y precios ficticios en D1 local. No representa datos reales del negocio. Los precios de $1.000 y ejemplos de stock no deben cargarse como apertura real.

## Despliegue revisable

1. Mantener el Site privado y confirmar quién puede acceder. Autorización de miembros/roles aún pendiente.
2. Antes de modificar producción, obtener respaldo consistente de `business` y sus revisiones; conservarlo y probar restauración aislada. El código no contiene ese respaldo.
3. Aplicar únicamente la nueva migración `0001_loving_tattoo.sql` si `0000` ya fue aplicada. No repetir ni editar `0000`.
4. Publicar cliente y servidor juntos: el servidor nuevo requiere `operationId`. Una pestaña antigua recibirá 400 y deberá actualizarse.
5. Comprobar lectura, una operación autorizada y su reintento en el entorno adecuado. El retorno a la versión anterior puede conservar la tabla aditiva, pero pierde garantías de idempotencia: detener escrituras y conciliar solicitudes pendientes antes del rollback.

No borrar recibos de `operations` mientras existan clientes capaces de reenviar esas claves. No hay política automática de retención implementada.

## Decisiones y próximos incrementos

Confirmado: entrega, venta y cobro son hechos distintos; pérdidas pendientes; bolsas de 3 kg; un vehículo. Heredado: precio vigente al rendir, valoración de pérdida al informarla, sin anticipos y fondos agregados que pueden ser negativos. No se cambió esa política.

Pendientes del encargo completo: visita integral atómica, modelo relacional con libros de movimientos, importación conciliada de saldos, clasificación efectivo/banco, anulaciones compensatorias, apertura formal, miembros/roles con identidad verificada, respaldos automáticos/restauración y piloto con la familia. Las pruebas de estos puntos no se declaran aprobadas.

El endpoint sigue dependiendo del perímetro privado de Sites. Los headers de identidad no son autenticación válida en un servidor expuesto directamente. No se añadieron invitaciones ficticias ni se habilitó acceso familiar.
