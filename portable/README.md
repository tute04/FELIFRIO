# App local para pruebas en computadora

**Distribución suspendida:** Microsoft Defender detectó `Trojan:Script/Ulthar.A!ml` en el artefacto 1.2. No se ha confirmado un falso positivo. Ver [evidencia y estado](../docs/revision-defender-2026-11-10.md). El generador escribe únicamente en `outputs/portable-review/Felifrio_App.html`; no es una entrega aprobada para el usuario.

El HTML contiene la aplicación de gestión en un solo archivo. Usa los formularios existentes y las mismas validaciones, reglas de consignación y cálculos monetarios. Empieza vacía; los datos de las pruebas no están incluidos.

Versión 1.2: cuatro productos (rolito/triturado × 3/10 kg), existencias y precios independientes por cliente, selector en formularios, resumen de bolsas y kilos. Conserva las mejoras de contraste, tipografía y botones de la 1.1.

Los registros anteriores se interpretan como rolito de 3 kg, conservando deudas, fondos e historial. Los precios de las otras variantes quedan sin configurar; rendir sin precio se rechaza. `inventory` y `stockByProduct` contienen el detalle y los campos numéricos antiguos conservan totales de bolsas. El campo heredado `price` representa únicamente rolito de 3 kg, o cero si no está configurado. Las pérdidas guardan el producto y el precio al informarlas.

Se mantiene el nombre de la base y las claves, pero IndexedDB se abre en versión 2 para impedir escrituras desde un archivo antiguo que no entiende productos. La actualización no borra registros ni recibos. Cerrar pestañas anteriores antes de actualizar y seguir `LEEME.txt`. Los respaldos nuevos incorporan `schemaVersion: 2`; se valida el detalle contra los totales. Los respaldos antiguos se aceptan en una base vacía y se normalizan a rolito de 3 kg.

## Generar

```sh
node scripts/build-portable.mjs
```

No modifica el despliegue D1. `Workspace` acepta un adaptador de solicitudes y un espacio de nombres para solicitudes pendientes; los valores predeterminados mantienen el comportamiento de la aplicación conectada. La versión descargable inyecta el adaptador local y las herramientas de respaldo.

## Datos

IndexedDB mantiene el estado y los recibos de operaciones en una única transacción de escritura. La confirmación al usuario ocurre al completar esa transacción. Los reintentos con el mismo identificador no duplican movimientos; una revisión obsoleta produce un conflicto recuperable. Los datos pertenecen al perfil y origen del navegador, no al archivo HTML ni al repositorio.

Exportación JSON y restauración validada en una base vacía. Las importaciones no mezclan ni reemplazan datos existentes. Se conservan los respaldos de formato `{state, exportedAt}` exportados por la aplicación original. Importes expresados en pesos con aritmética en centavos, como en el dominio existente.

Todo el JavaScript, CSS y la tipografía están incluidos. La política de contenido bloquea conexiones externas. No utiliza APIs de producción, cuentas, telemetría ni servicios en la nube.

## Verificar

```sh
pnpm typecheck
pnpm test
python tests/portable-browser.py
```

El recorrido de navegador requiere Playwright para Python y Chromium en `/usr/bin/chromium`. Comprueba el circuito de las cuatro variantes desde los formularios, precios faltantes, importación/exportación multiproducto, actualización de una base v1 con recibo previo y bloqueo de escritores antiguos, además de cobros, persistencia, reintentos y competencia por stock. `products.test.ts` verifica aislamiento entre productos, kilos, precios, pérdidas congeladas, retiros y migración sin alterar saldos. Los perfiles y datos de prueba están aislados. La prueba se ejecuta por HTTP local; el navegador administrado del entorno bloquea la navegación `file://`.

Ver instrucciones de uso y límites en [LEEME.txt](LEEME.txt). Para trabajar con varias personas o equipos sigue pendiente publicar la aplicación con autorización y persistencia compartida.
