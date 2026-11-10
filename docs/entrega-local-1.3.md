# Felifrío 1.3: nueva entrega local, pendiente de validación con Defender

**Estado actualizado: retirada.** El usuario confirmó que la descarga 1.3 también muestra «Virus detected» en Chrome. Los cambios descritos abajo no resolvieron el bloqueo. El paquete ya no se ofrece como descarga. Ver [investigación posterior](bloqueo-defender-1.3.md).

La detección de la 1.2 permanece sin resolver. Su ZIP y su HTML siguen retirados. La 1.3 se entrega como versión candidata solicitada por el usuario, sin afirmar que sea una resolución de `Trojan:Script/Ulthar.A!ml`.

## Cambios concretos

- HTML de 882 bytes con referencias a un JavaScript clásico y un CSS locales; sin programa incrustado ni fuentes codificadas.
- JavaScript sin minificar y fuentes tipográficas del sistema. No hay instaladores, lanzadores, macros ni archivos ejecutables del sistema operativo.
- Política de contenido que bloquea scripts inline, evaluación dinámica, conexiones de datos externas y objetos. Permite los archivos de la carpeta local para uso mediante `file://` y archivos del mismo origen para alojamiento HTTP.
- Zod actualizado de 3.25.76 a 4.6.6, versión corregida según `GHSA-mrhx-c7xc-m3w5`. Ese aviso describe agotamiento de memoria al validar colecciones; no explica ni descarta la detección de Defender.
- Mismo modelo de inventario: rolito y triturado, cada uno en 3 y 10 kg, precios por cliente/producto, deuda común y respaldos.

## Evidencia y límites

`pnpm typecheck`, 11 pruebas de dominio y persistencia, compilación del proyecto y recorrido completo de navegador pasaron con la dependencia actualizada. El recorrido comprueba las cuatro variantes, precios faltantes, cobros, reintentos, reinicio de navegador, importación/exportación y actualización desde la base v1. Las solicitudes observadas durante el recorrido se limitaron al HTML y a sus propios archivos locales; no se observaron solicitudes a servicios externos.

El inventario emitido por el empaquetador incluye React 19.2.6, React DOM 19.2.6, Scheduler 0.27.0, Lucide React 1.31.0 y Zod 4.6.6. En la consulta de `pnpm audit --prod` del 10 de noviembre de 2026 no quedaron avisos para esos módulos. El repositorio completo aún tiene avisos en otras dependencias (incluido Next), que **no forman parte del JavaScript local**. No se declara que el repositorio completo esté libre de vulnerabilidades ni que la versión del servidor esté lista para despliegue público.

El entorno no dispone de Microsoft Defender. No se ejecutó un análisis antivirus de la 1.3 ni se enviaron archivos a servicios externos. Las huellas SHA-256 verifican integridad, no seguridad. Las pruebas de navegador se ejecutan con HTTP local: la política del navegador administrado bloquea la navegación `file://`, por lo que no se afirma haber probado esa ruta en este entorno.

Si Chrome o el antivirus bloquean esta entrega, detenerse, conservar el nombre de la amenaza y el archivo señalado. No desactivar controles ni agregar excepciones. La descarga de la 1.3 no constituye una validación del artefacto 1.2.

## Reproducción

```sh
node scripts/build-local-folder.mjs
FELIFRIO_FOLDER_BUILD=1 python tests/portable-browser.py
```

El resultado está en `outputs/felifrio-1.3/`. Conservar juntos `Felifrio_App.html` y `assets/`. `DEPENDENCIAS.json` enumera las bibliotecas incluidas y `SHA256SUMS.txt` identifica los archivos. La base IndexedDB mantiene su nombre y versión 2; no se vacían registros al actualizar.
