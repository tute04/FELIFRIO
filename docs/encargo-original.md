# Felifrío — Contexto completo y encargo de desarrollo para Codex

Fecha de preparación: 22 de octubre de 2026. Idioma de trabajo: español de Argentina.

## Encargo

Quiero que continúes el desarrollo de **Felifrío · Gestión**, una aplicación para una pequeña fábrica de hielo de la familia de mi novia en Villa Yacanto, Córdoba, Argentina.

Ya existe una primera versión funcional y publicada. Tu objetivo es evolucionarla hasta una versión confiable para uso diario, conservando lo que funciona. Trabajá sobre el código entregado; no comiences otra aplicación por defecto ni te limites a dibujar pantallas o a dar recomendaciones.

Primero inspeccioná el proyecto, explicá brevemente qué encontraste y ejecutá sus comprobaciones. Después implementá por etapas con resultados verificables. Avanzá con decisiones técnicas razonables sin preguntarme cada detalle. Si falta una regla comercial que afecta dinero, stock o permisos, señalala y mantené ese comportamiento explícito y reversible mientras avanzás con lo demás.

**Este contexto es el encargo de desarrollo. No implica permiso para publicar datos, abrir el acceso del negocio al público, contratar servicios pagos ni reemplazar datos de producción sin un procedimiento revisable.** Desarrollá y verificá primero; dejá concretos los pasos de puesta en marcha y las decisiones que dependan del titular.

## 1. Negocio y hechos confirmados

- Nombre comercial: Felifrío. Instagram visto en la referencia: `felifrio.hielo`.
- Actividad: fabrican hielo rolito, lo embolsan y lo distribuyen a comercios.
- Ubicación: Villa Yacanto / Yacanto de Calamuchita, Córdoba.
- Público indicado en la referencia comercial: bares, restaurantes, campings y comercios.
- Producto inicial único: **bolsa de hielo de 3 kg**.
- Producen y embolsan en el momento: no hace falta un proceso intermedio de hielo a granel.
- Producción en lotes.
- Uso habitual por una persona y, en temporada alta, hasta dos.
- Un vehículo de reparto.
- Confirmaron que suele haber conexión a internet en las zonas de reparto. La primera versión puede requerir conexión; no prometas operación sin internet si no está implementada y probada.
- Modelo de venta confirmado: **consignación**. Se entrega una cantidad de bolsas acordada y se cobra según las que el cliente haya vendido.
- Para estimar las vendidas, cuentan las que quedan cuando vuelven a visitar al comercio.
- Todavía **no definieron quién absorbe roturas o derretimiento en los comercios**. Se acordó registrarlos como pérdidas pendientes y resolverlos posteriormente.
- Quieren controlar producción, stock, ventas, compras, entregas, cobros y organización interna.

## 2. Principio central: entregar, vender y cobrar son hechos diferentes

1. Fabricar aumenta el stock de fábrica.
2. Cargar el vehículo transfiere bolsas desde fábrica al vehículo.
3. Entregar en consignación transfiere bolsas del vehículo al comercio. **No genera venta, deuda ni ingreso de dinero.**
4. La rendición determina las ventas inferidas del recuento, descontando pérdidas y movimientos registrados.
5. Confirmar una rendición genera el importe que el cliente debe pagar.
6. Cobrar reduce esa deuda y aumenta los fondos recibidos.
7. Pueden cobrarse importes parciales o deudas anteriores sin generar ventas nuevas.

Nunca deduzcas ventas a partir de cobros ni consideres facturación todas las entregas. Un saldo de caja no es utilidad.

### Fórmula de recuento

Si el stock registrado del comercio ya contiene todas las entregas y devoluciones previas:

`bolsas vendidas = stock registrado antes del recuento − bolsas contadas − pérdidas del período no descontadas previamente`

Una manera equivalente es:

`vendidas = existencias al inicio + entregas − devoluciones − existencias al cierre − pérdidas`

**No sumes otra vez entregas que ya están incluidas en el stock registrado. No descuentes dos veces las pérdidas.**

El resultado no puede ser negativo. Si el recuento supera las existencias esperadas, abrí una discrepancia o un ajuste justificado; no fabriques ventas negativas ni inventes producción.

Las ventas son una inferencia del recuento y la integridad de los movimientos. No prometas que el sistema distingue por sí solo entre venta, pérdida no informada y error de carga.

### Ejemplo ilustrativo principal

Con precio de ejemplo de $1.000 por bolsa —no es el precio real del negocio—:

| Paso | Fábrica | Vehículo | Comercio | Deuda del cliente | Fondos recibidos |
| --- | ---: | ---: | ---: | ---: | ---: |
| Producir 200 bolsas | 200 | 0 | 0 | $0 | $0 |
| Cargar 40 bolsas | 160 | 40 | 0 | $0 | $0 |
| Entregar esas 40 | 160 | 0 | 40 | $0 | $0 |
| Contar 15, sin pérdidas: vendió 25 | 160 | 0 | 15 | $25.000 | $0 |
| Cobrar $20.000 | 160 | 0 | 15 | $5.000 | $20.000 |

Si se reponen 20 bolsas después de esa rendición, el comercio queda con 35. La reposición debe salir de stock real del vehículo; no modifica por sí sola la deuda de $5.000.

### Ejemplo con pérdidas

Stock del cliente: 40. Recuento: 13. Pérdidas: 2. Ventas: 25.

Las 2 pérdidas salen del stock físico y quedan pendientes; no son ventas ni generan automáticamente deuda. Si luego se decide cobrarlas al cliente, se agrega un cargo por pérdida documentado, diferenciado de las ventas. Si Felifrío las absorbe, no se agrega deuda. Resolver la pérdida no vuelve a descontar bolsas.

## 3. Aplicación que ya existe

- URL publicada: https://felifrio-gestion.matebonavia.chatgpt.site
- Título: Felifrío · Gestión.
- Site ID existente: `appgprj_6ada0f34a3088191be40e773a2d6c2bb`.
- Commit del snapshot entregado: `a470d541eaac0a5240e15c56fb18f867c09762e1`.
- Manifest de hosting: `.openai/hosting.json`, con `project_id` anterior, binding D1 `DB` y R2 sin uso.
- Publicación inicial privada para la cuenta del creador, protegida por la plataforma Sites.
- **No está confirmado ni habilitado el acceso de los familiares.** Dos usuarios es un requisito del negocio, no una capacidad de acceso ya resuelta.
- No se creó un repositorio GitHub del usuario para Felifrío. La fuente está sincronizada con el repositorio administrado por Sites. El ZIP es una exportación del código y permite trabajar aunque el siguiente entorno no tenga acceso a ese repositorio.
- No utilizar el repositorio `tute04/VALTU-3D`: corresponde a otro negocio y otra aplicación.
- Las rutas del entorno donde se creó pueden no existir en tu sesión. Buscá el código en los archivos adjuntos o en el checkout que el usuario haya abierto.
- El código fuente no contiene los datos de la base de producción. **No supongas que hoy está vacía**, aunque la publicación original comenzó sin datos de ejemplo.

### Tecnología del snapshot

- React y TypeScript.
- Starter Vinext/Vite con convenciones de Next; conservar su integración con Sites si se sigue alojando allí.
- Cloudflare Workers para servidor y D1 para persistencia.
- Drizzle para esquema/migraciones.
- Tailwind disponible y estilos principales en CSS.
- Iconos Lucide.
- Gestor declarado: pnpm; usar `package.json` y `pnpm-lock.yaml` como fuente de versiones, no actualizar todo automáticamente.
- `package.json` declara Node >=22.13; el test actual con eliminación nativa de tipos se ejecutó en Node 24.19. Si otro entorno no lo soporta, adaptar el ejecutor de tests explícitamente.

### Archivos relevantes

| Archivo | Función |
| --- | --- |
| `app/workspace.tsx` | Interfaz completa, formularios, navegación y sincronización |
| `app/globals.css` | Identidad visual y adaptación móvil |
| `app/api/data/route.ts` | Lectura/escritura del estado en D1 |
| `lib/domain.ts` | Reglas de stock, rendición, pérdidas, cobros, compras y tareas |
| `db/schema.ts` | Tabla de persistencia actual |
| `drizzle/` | Migración inicial y metadatos |
| `app/chatgpt-auth.ts` | Helpers del starter para identidad de ChatGPT |
| `tests/domain.test.ts` | Prueba actual del circuito de negocio |
| `.openai/hosting.json` | Identidad y bindings del Site existente |
| `README.md` | Funcionamiento y limitaciones documentadas |

Los helpers de identidad están disponibles; su presencia **no significa que cada endpoint ya valide identidad o pertenencia al negocio**.

### Funciones ya implementadas

- Inicio con stock en fábrica, bolsas en comercios, deuda total y saldo agregado de fondos.
- Producción por lote y pérdida en fábrica.
- Clientes con nombre, dirección, teléfono y precio por bolsa.
- Cambio de precio por cliente.
- Carga del vehículo, entrega en consignación, retiro de bolsas y regreso a fábrica.
- Rendición por recuento y registro de pérdidas pendientes.
- Resolución de pérdida: Felifrío absorbe / cliente paga.
- Cobros parciales con medio de pago efectivo o transferencia.
- Compras con proveedor, total y pago inicial; pagos posteriores parciales.
- Gastos e ingresos de fondos.
- Agenda con tareas, responsables, fecha y estado.
- Historial de movimientos con fecha y actor.
- Exportación del estado en JSON.

### Persistencia actual y límites concretos

Actualmente se usa una sola fila de la tabla `business`, con `id`, `payload` JSON y `revision`. El JSON contiene stock, clientes, deudas, pérdidas, compras, tareas y movimientos.

Las escrituras comparan una revisión y hacen un UPDATE condicional: evita sobrescribir silenciosamente cambios simultáneos. La interfaz actualiza aproximadamente cada 30 segundos. **No equivale a tiempo real, idempotencia completa ni transacciones por visita ya implementadas.**

Límites a resolver:

- Todo el historial y el estado crecen dentro de un solo JSON.
- El historial no almacena de manera estructurada todos los IDs y detalles necesarios para reconstruir cada saldo con precisión.
- Deudas y stock se mantienen como acumulados, sin un libro de movimientos suficientemente completo para conciliar y revertir cualquier operación.
- Dinero con `number` y redondeos parciales; mejorar a centavos enteros o decimal exacto.
- Validaciones con tipos amplios `any`; faltan contratos de entrada estrictos.
- Los endpoints actuales se apoyan en el perímetro privado de Sites. No tienen comprobaciones completas de membresía/roles por operación. No exponerlos públicamente tal como están.
- No hay apertura formal de saldos, anulación compensatoria, conciliación diaria, copias automáticas con restauración verificada ni administración completa de usuarios.
- El saldo de fondos combina efectivo y cuentas. El medio de algunos cobros está en la descripción; no hay libro separado de caja y banco.
- No hay seguimiento por lote a través de cada entrega. Registrar el nombre del lote no equivale a trazabilidad completa por lote.
- Las compras no descuentan automáticamente un inventario de envases; no afirmar lo contrario.
- No hay facturación fiscal, integración de WhatsApp, sensores, rutas optimizadas, instalación PWA ni modo offline implementados.

### Validaciones que se hicieron, sin exagerarlas

Pasaron la prueba de dominio, el chequeo TypeScript y la compilación. Se probó en navegador el alta de cliente, la producción y la persistencia al recargar. No se hizo una auditoría independiente de seguridad ni una prueba integral de todos los flujos en producción con dos usuarios.

Comandos que sirven como punto de partida desde la raíz del proyecto:

```bash
node --experimental-strip-types tests/domain.test.ts
node node_modules/typescript/bin/tsc --noEmit
```

Para instalación, build y publicación, leer el README, scripts y las instrucciones vigentes de Sites disponibles en tu entorno. No asumir que las rutas absolutas de helpers de otra sesión existen.

## 4. Reglas implementadas que NO son confirmaciones del negocio

Diferenciá hechos del negocio de decisiones técnicas tomadas en la primera versión:

- **Precios:** el código actual aplica el precio vigente del cliente al confirmar la rendición; el importe ya rendido no cambia al actualizar ese precio. No fue acordado explícitamente qué pasa si cambia el precio entre entrega y venta. Mantené el comportamiento visible mientras se define si se necesita precio por entrega/lote/FIFO o por fecha de rendición. No cambies la política silenciosamente.
- **Pérdidas:** el código congela el precio al informar la pérdida para una posible resolución posterior. Es el comportamiento actual, no una política comercial validada.
- **Cobros:** hoy se impide cobrar más que la deuda. Anticipos o saldos a favor no están confirmados: no los conviertas en ventas automáticamente.
- **Fondos:** el saldo agregado puede quedar negativo. No ajustes importes silenciosamente para evitarlo; proponé apertura, conciliación y validación según cuenta y política.
- **Permisos:** administrador/operador es una propuesta para implementar, no una organización de roles ya acordada con la familia.
- **Costos:** no hay costos unitarios, márgenes, precios ni consumos reales confirmados. No usar $1.000 del video como dato inicial.

Preguntas comerciales que pueden esperar mientras implementás infraestructura: lista real de clientes, precios, stock inicial, capital inicial, responsables y medios/cuentas reales. Para probar, usar fixtures aislados y claramente ficticios.

## 5. Experiencia objetivo

App web sencilla para celular y computadora. El reparto debe poder registrarse desde el teléfono. Evitar pantallas complejas y jerga contable innecesaria.

Conservar la dirección visual existente: blanco y azul hielo, azul profundo para texto, acentos celestes, pequeños detalles cálidos. Tipografía limpia, buena separación, números legibles y botones claros. No rediseñar la marca ni cambiar el logotipo sin motivo.

Navegación esperada:

1. Inicio: estado del día, bolsas disponibles, compromisos de reparto, cobros y pendientes.
2. Producción y stock.
3. Clientes y cuenta corriente.
4. Repartos / visitas.
5. Rendiciones y pérdidas.
6. Caja, compras y proveedores.
7. Organización.
8. Configuración / usuarios / respaldos, según permisos.

### Flujo prioritario: una visita al cliente

En un asistente breve, permitir:

1. Elegir el cliente y consultar stock y deuda anteriores.
2. Cargar recuento de bolsas disponibles antes de reponer.
3. Registrar pérdidas o retiros con motivo.
4. Mostrar ventas inferidas y precio aplicado, antes de confirmar.
5. Registrar un cobro opcional, total o parcial, con medio y cuenta.
6. Registrar reposición desde el stock real del vehículo.
7. Mostrar resumen final: vendidas, repuestas, restantes, importe generado, cobrado y deuda resultante.

Usar pasos explícitos: un retiro que ya está descontado no debe restarse también como pérdida o venta. El cliente puede pagar una deuda previa aunque no haya nuevas ventas. Una visita puede ser sólo entrega, sólo recuento o sólo cobro.

Confirmar la visita como una operación consistente: no dejar media rendición guardada y una reposición fallida sin estado claro. Usar transacciones y claves de idempotencia donde corresponda; ante errores no duplicar cobros ni movimientos al reintentar.

## 6. Datos y arquitectura recomendados

Priorizá mantenibilidad y consistencia para un negocio pequeño. No agregar microservicios, multiempresa o integraciones costosas sin necesidad.

Separar interfaz, reglas de dominio, validación, autorización y persistencia. Proponer una estructura relacional, preservando compatibilidad y datos existentes. Entidades orientativas, ajustables tras inspección:

- Negocio y miembros con rol/estado.
- Productos/presentaciones: inicialmente una bolsa de 3 kg.
- Clientes y precios con vigencia suficiente para la política acordada.
- Lotes de producción.
- Ubicaciones de stock: fábrica, vehículo, cada cliente.
- Movimientos de stock estructurados con origen, destino, cantidad, fecha, actor y documento relacionado.
- Repartos, visitas y sus movimientos/rendiciones.
- Pérdidas, estado, cantidad, motivo, valoración y resolución.
- Cargos/ventas y cobros de clientes, con imputación que permita explicar sus saldos.
- Compras, proveedores y pagos.
- Cuentas de fondos y movimientos; distinguir aportes/retiros de ventas y de gastos.
- Tareas.
- Auditoría y claves de idempotencia.

No es necesario que cada concepto sea una tabla distinta si existe un modelo más simple y consistente. Documentar invariantes y transacciones. Guardar cantidades de bolsas como enteros y dinero en centavos enteros o tipo decimal exacto. Mostrar moneda ARS, formato es-AR y fechas del negocio en America/Argentina/Cordoba o America/Argentina/Buenos_Aires. Mantener timestamps en UTC y una fecha operativa explícita cuando haga falta.

### Migración desde el estado actual

- Primero inspeccionar si existen datos reales; no usar la base de producción para ensayos.
- Crear respaldo de datos consistente y recuperable. Un ZIP del código **no es un respaldo de datos**.
- Mantener el payload y la revisión originales como evidencia del estado migrado.
- Crear migraciones nuevas, revisables y preferentemente aditivas; no reescribir una migración ya aplicada.
- Validar stock por ubicación, deuda por cliente, saldo a proveedores, fondos y cantidades antes/después.
- Si el historial antiguo no tiene detalle suficiente para reconstruir el libro nuevo, **no inventar movimientos históricos**. Preservar el historial original y trasladar saldos de apertura identificados como migrados, con un corte documentado y conciliación.
- No inventar qué parte del saldo agregado antiguo corresponde a efectivo o transferencia. Registrar una apertura pendiente de clasificación si no existe evidencia suficiente y resolver con el titular.
- Probar la migración y la restauración en un ambiente aislado. Diseñar un rollback realista y tener en cuenta los movimientos nuevos posteriores al corte.

## 7. Acceso, estabilidad y continuidad

### Acceso

- Un espacio privado del negocio, con cuentas individuales y datos compartidos sólo entre miembros autorizados.
- Propuesta inicial: administrador y operador. El administrador gestiona usuarios, correcciones, precios y respaldos. El alcance exacto del operador debe quedar visible y ajustable.
- Validar membresía y permisos en el servidor para cada lectura y escritura. No basta con esconder botones.
- Si se usa Sites, preservar su autenticación y verificar que su política de acceso soporta los usuarios requeridos antes de prometerlo.
- Si no lo soporta, explicar la limitación y preparar una alternativa concreta de hosting/autenticación. No convertir el Site en público como solución ni inventar una función de invitaciones que la plataforma no ofrece.
- Headers de identidad de la plataforma sólo son confiables detrás de su perímetro. No aceptarlos como autenticación arbitraria en un servidor expuesto directamente.
- No almacenar secretos en navegador, código, ZIP, logs ni commits. Las claves deben configurarse en el servidor por el mecanismo del entorno.

### Consistencia

- Transacciones para operaciones que afectan varias entidades.
- Evitar stock negativo y sobrecobros/sobrepagos según la política vigente.
- Protección contra doble clic, reenvío, timeout y reintentos.
- Control de concurrencia con mensajes que permitan recuperar el trabajo; no perder el contenido de formularios.
- Validación estricta en servidor: enteros, límites, decimales, fechas reales, referencias y permisos.
- Errores comprensibles sin mostrar detalles internos sensibles.
- Identificar lotes y documentos de forma inequívoca.

### Correcciones y cierres

- Corregir mediante anulación/contramovimiento y nuevo registro, con motivo, responsable y vínculo al original. No borrar silenciosamente el historial.
- Si una rendición ya tiene cobros o movimientos posteriores, manejar sus dependencias antes de revertirla. No generar stock negativo o deuda incoherente.
- Aperturas formales de stock, deuda y fondos, separadas de producción o ventas nuevas.
- Resumen/cierre diario con conciliación de stock y dinero. No es necesario implementar contabilidad fiscal completa.
- Paginación, filtros y exportación legible por fecha/cliente/tipo. Un JSON de respaldo no reemplaza un informe operativo para el dueño.

### Respaldos

- Copias automáticas con periodicidad documentada y exportación manual.
- Indicar alcance, retención, dónde se administran y cuándo fue la última copia exitosa.
- Probar restauración a un ambiente aislado y conciliar saldos.
- No prometer frecuencia, disponibilidad o recuperación que el proveedor todavía no ofrece o no esté configurada.
- Ofrecer un procedimiento de salida: exportar clientes, movimientos y saldos sin depender de esta conversación.

## 8. Pruebas de aceptación mínimas

Implementá pruebas útiles sobre reglas y persistencia, además de verificar la interfaz móvil. No te limites a comprobar que abre la página.

1. **Caso principal:** producir 200, cargar 40, entregar 40, contar 15, rendir 25 a $1.000, cobrar $20.000. Resultado: fábrica 160, vehículo 0, cliente 15, deuda $5.000 y fondos +$20.000.
2. **Conservación de stock:** las transferencias internas no cambian el stock físico total. Las ventas y pérdidas sí lo reducen. Sin ajustes de apertura: producción acumulada = existencias actuales + ventas + pérdidas, considerando anulaciones.
3. **Sin ventas nuevas:** después de quedar 15 bolsas y deuda $5.000, repetir un recuento de 15 no genera cargos nuevos. Cobrar $5.000 salda la deuda sin reducir stock.
4. **Reposición posterior:** reponer 20 desde vehículo deja 35 en el cliente; no vuelve a facturar la entrega anterior.
5. **Pérdidas:** 40 registradas, 13 contadas y 2 perdidas producen 25 ventas; la pérdida pendiente no genera deuda. Resolverla descuenta cero bolsas adicionales.
6. **Resolución única:** no se puede cobrar ni absorber dos veces una misma pérdida. Si paga el cliente, se genera un cargo claramente diferenciado.
7. **Devoluciones:** retirar bolsas del comercio al vehículo y descargarlas en fábrica no genera una venta ni un cobro; conserva stock total.
8. **Validación:** rechazar cantidades negativas o fraccionarias de bolsas, valores no finitos, fechas inválidas, recuentos imposibles y referencias inexistentes. Un recuento cero es válido.
9. **Precios:** un cambio de precio no modifica deudas ya confirmadas. El precio usado y su política quedan guardados en el documento. Las pérdidas resueltas respetan la valoración fijada.
10. **Compras y pagos:** compra de $10.000, pago inicial de $3.000: deuda al proveedor $7.000 y fondos −$3.000. Pago posterior de $2.000 deja deuda $5.000; no repetir el gasto completo.
11. **Concurrencia:** dos usuarios intentando consumir la misma última bolsa no pueden entregar dos. Mostrar conflicto recuperable.
12. **Reintentos:** repetir la misma solicitud de cobro con igual clave de idempotencia produce un único cobro. Reintentar una visita completa no la duplica.
13. **Atomicidad:** una reposición inválida no deja una visita parcialmente confirmada sin una explicación y recuperación previstas.
14. **Permisos:** alguien sin acceso al negocio no puede consultar ni escribir datos por API aunque conozca una URL o un ID.
15. **Correcciones:** una anulación justificada compensa cantidades e importes, mantiene trazabilidad y respeta dependencias posteriores.
16. **Apertura y migración:** saldos iniciales no se contabilizan como ventas del día ni como producción nueva. El traslado desde el JSON conserva todos los saldos.
17. **Persistencia:** guardar en un dispositivo, recargar y consultar desde otro autorizado devuelve datos consistentes.
18. **Respaldo:** restaurar una copia en un ambiente de prueba reproduce registros, permisos aplicables y saldos esperados.
19. **Celular:** completar una visita sin desplazamientos horizontales en el formulario, sin botones tapados y con mensajes claros ante caída de conexión.
20. **Zona horaria:** movimientos cercanos a medianoche se agrupan por la fecha local del negocio y no por la fecha UTC equivocada.

No declarar una prueba aprobada si no se ejecutó. Informar qué quedó verificado, simulado o pendiente.

## 9. Orden de trabajo

### Etapa A — Auditoría y base segura

Leer los archivos y las instrucciones del repositorio; ejecutar checks existentes; identificar datos y entorno; documentar diferencias con este contexto si las hay. Crear una rama de trabajo cuando corresponda. Mantener la app publicada operativa y no conectar fixtures al negocio real.

### Etapa B — Dominio y persistencia

Separar código, incorporar contratos estrictos, diseñar y probar el modelo de movimientos, dinero exacto, transacciones, idempotencia y migración. Conservar la trazabilidad del estado antiguo.

### Etapa C — Uso cotidiano

Mejorar la visita integral, fichas de clientes, reparto, pérdidas, apertura, compras, cuentas y correcciones. Mantener la estética y simplificar acciones frecuentes.

### Etapa D — Acceso y recuperación

Resolver el acceso individual de las personas reales, permisos, respaldos y restauración. Verificar capacidades del proveedor antes de elegir una migración de infraestructura. Preparar costos sólo con información comprobada; no contratar nada sin indicación.

### Etapa E — Piloto

Ejecutar los casos anteriores en pruebas; preparar una guía breve para la familia; hacer una corrida paralela contra su registro habitual y conciliar stock/deudas/fondos antes de depender exclusivamente de la app.

No agregar facturación fiscal, WhatsApp automático, rutas con mapas, predicción de demanda, sensores o modo offline en la primera entrega si distraen de este circuito. Pueden quedar como mejoras futuras.

## 10. Entregables esperados de tu trabajo

- Código mantenible y versionado; conservar la identidad del proyecto.
- Implementación funcional de las prioridades, no pantallas de muestra.
- Migraciones y procedimiento verificable de traslado sin pérdida de datos.
- Pruebas ejecutadas y sus resultados.
- Registro de decisiones: confirmado por el negocio / heredado del código / propuesta pendiente.
- Guía breve para el dueño: apertura, producción, carga, visita, cobro, cierre y corrección.
- Guía de mantenimiento y respaldo/restauración.
- Configuración documentada con nombres de variables sin secretos.
- Plan de despliegue, recuperación y pendientes concretos.

Si falta acceso externo para completar una parte, terminá y verificá todo lo que se pueda de forma independiente, y explicá exactamente qué acceso falta y qué permitirá hacer. No afirmar que creaste un repositorio GitHub, invitaste usuarios, migraste datos, configuraste backups o publicaste una versión si no ocurrió y no hay evidencia.

**Empezá ahora por inspeccionar el código adjunto y ejecutar los checks actuales. Después implementá la primera etapa prioritaria, explicando los cambios con brevedad.**
