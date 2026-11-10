# App local para pruebas en computadora

`demo/Felifrio_App.html` contiene la aplicación de gestión en un solo archivo. Usa los formularios existentes y las mismas validaciones, reglas de consignación y cálculos monetarios. Empieza vacía; los datos de las pruebas no están incluidos.

Versión 1.1: textos y campos más grandes, mayor contraste, navegación activa más visible, botones principales y secundarios diferenciados, y aviso de almacenamiento compacto. La hoja `app/readability.css` se comparte con la app conectada. Se mantienen el nombre de la base IndexedDB, las claves, los recibos y el formato de respaldo de la versión 1.0. Antes de reemplazar el archivo, exportar un respaldo y seguir las instrucciones de actualización de `LEEME.txt`.

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

El recorrido de navegador requiere Playwright para Python y Chromium en `/usr/bin/chromium`. Genera los artefactos, sirve temporalmente en localhost y comprueba altas, producción, entrega, rendición, cobro, rechazo de sobrecobro, persistencia después de reiniciar el navegador, exportación/restauración, bloqueo de sobrescritura, reintentos y competencia por la última bolsa. Los perfiles y datos de prueba están aislados. La prueba se ejecuta por HTTP local; el navegador administrado del entorno bloquea la navegación `file://`.

Ver instrucciones de uso y límites en [LEEME.txt](LEEME.txt). Para trabajar con varias personas o equipos sigue pendiente publicar la aplicación con autorización y persistencia compartida.
