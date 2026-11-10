# Descarga local suspendida: detección de Microsoft Defender

Actualización: se preparó una [versión candidata 1.3 con archivos separados y una dependencia corregida](entrega-local-1.3.md), a pedido del usuario. No se declara que resuelva esta detección. Los artefactos 1.2 identificados abajo siguen retirados y sin un veredicto de falso positivo.

## Evidencia disponible

El usuario mostró una detección de Microsoft Defender del 10 de noviembre de 2026:

- Amenaza: `Trojan:Script/Ulthar.A!ml`.
- Archivo señalado: `Felifrio_App.html`, dentro de `Felifrio_App_Computadora_v1.2.zip`.
- Estado mostrado: error en la cuarentena / corrección incompleta.
- Chrome bloqueó la descarga con el mensaje «Virus detected».

La captura confirma la detección del archivo. No demuestra por sí sola que se haya ejecutado código malicioso ni permite clasificarla como falso positivo.

## Archivos examinados

| Archivo | Tamaño | SHA-256 |
|---|---:|---|
| `Felifrio_App_Computadora_v1.2.zip` | 190124 bytes | `756eabb21f59c5bc319943fde4586b163de89142be62e263298fcad8d689e775` |
| `Felifrio_App.html` | 547705 bytes | `6c45bdd5e6f3aca96d1eb0d024f7101df81011ca51bf9bcf27b36a40e4632b7a` |

El ZIP contiene el HTML, `LEEME.txt` y `Licencias.txt`. Su comprobación de integridad pasó y el HTML extraído coincide byte a byte con el artefacto local. La reconstrucción desde el código disponible reprodujo la misma huella del HTML. Estas comprobaciones no son un análisis antivirus.

En la revisión estática del HTML no se encontraron etiquetas de scripts externos ni iframes. Los hosts literales presentes son referencias de SVG (`www.w3.org`) y mensajes de React (`react.dev`). La versión local inyecta un adaptador IndexedDB y su política de contenido contiene `connect-src 'none'`. Esto documenta el funcionamiento previsto; no prueba ausencia de malware en todas las dependencias.

## Contención

Se retiran del estado actual de la rama los paquetes descargables de gestión y el HTML publicado. La detección aportada corresponde a la versión 1.2; la versión 1.1 también se retira por precaución, sin afirmar que Defender la haya detectado. Se conservan el código fuente y copias de análisis fuera de los archivos publicados. Los archivos siguen existiendo en commits históricos: retirarlos de la rama no borra el historial de Git ni copias ya descargadas.

El generador escribe a partir de ahora en `outputs/portable-review/`, ignorado por Git. Las pruebas usan ese destino y no restauran automáticamente las descargas publicadas. No se cambia, renombra ni recompila el archivo como sustituto destinado a evitar la detección.

## Pendiente

No hay Microsoft Defender ni otro motor antivirus instalado en este entorno. Se intentó comprobar acceso a la base oficial de ClamAV, pero la red devolvió HTTP 403; no se instaló ni se ejecutó ClamAV. No se afirma haber obtenido un resultado antivirus limpio.

Para decidir si se trata de un falso positivo hace falta una revisión del artefacto por Microsoft u otro análisis competente, con el motor y firmas correspondientes. El canal oficial de Microsoft es <https://www.microsoft.com/en-us/wdsi/filesubmission>. No se envió el archivo ni el código del usuario a servicios de terceros. La publicación permanece suspendida hasta aclarar la detección.

En el equipo afectado: no abrir ni permitir el archivo señalado, eliminar las copias descargadas si Windows lo permite y actualizar/ejecutar Microsoft Defender. Si la eliminación falla o la detección continúa, usar Microsoft Defender sin conexión o solicitar asistencia técnica. No es necesario borrar la base de datos del navegador para retirar el ZIP.
