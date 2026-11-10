# Bloqueo de la 1.3: investigación y resultado pendiente

El usuario confirmó que Chrome también muestra «Virus detected» para la descarga 1.3. Se retira el ZIP del estado actual de la rama y se conserva una copia de investigación en `outputs/security-review/`, fuera de Git. No se declara resuelto el bloqueo.

## Artefacto

| Archivo | SHA-256 |
|---|---|
| `Felifrio_App_1.3_Revision.zip` | `423f6cf11817a63d6716bd3f294b10bf400f119fc64d335b962a553c2831ab62` |
| `Felifrio_App.html` (882 bytes) | `e5e61e9cb7d106d7d4f53ee06e21757174146d3fa619d9cf38a425a51f7f22c6` |
| `assets/app.js` (774780 bytes) | `24f660f23f436527ac614b36fe93d595d3dd45a51747fd674707adf69dc44121` |

El ZIP pasa la comprobación interna de integridad. Falta el detalle de Defender correspondiente específicamente a la 1.3: la evidencia `Trojan:Script/Ulthar.A!ml` aportada antes identificaba el HTML del ZIP 1.2. No se supone que la familia ni el miembro del ZIP sean iguales en la 1.3 sin el nuevo detalle.

## Revisión adicional

- Se inspeccionaron en el JS distribuido las referencias a URL, `new Function`, `atob`, funciones de red y decodificación. Las coincidencias examinadas corresponden al renderizador React y al validador Zod. En particular, `new Function("")` es la comprobación de disponibilidad de compilación dinámica de Zod y `atob` pertenece a validadores de base64/JWT. No se ha demostrado que ninguna de estas funciones provoque la detección; quitarlas por sospecha no sería una corrección verificada.
- `pnpm store status` marcó esbuild 0.18.20, 0.25.12, 0.27.3, 0.28.0 y workerd 1.20260515.1 como modificados. Se comprobó que sus archivos `bin/esbuild` y `bin/workerd` son ELF y coinciden byte a byte con los binarios de sus paquetes de plataforma instalados. Ambos paquetes declaran `node install.js` como postinstall, coherente con esa sustitución. Esto no es una certificación de toda la cadena de suministro ni una explicación del aviso de Defender.
- Se intentó acceder al portal oficial de envío de muestras de Microsoft, a sus definiciones y a la base oficial de ClamAV. Las conexiones fueron bloqueadas con HTTP 403 por la red del entorno. También se solicitó y obtuvo permiso de red para el turno; las consultas oficiales siguieron bloqueadas. No se recurrió a intermediarios para eludir esa restricción.
- No hay Microsoft Defender instalado ni un equipo Windows conectado a las herramientas. No se ejecutó un escaneo de Defender ni se enviaron muestras a terceros.

## Para poder cerrar el problema

Hace falta analizar el ZIP exacto con Microsoft Defender y/o obtener una revisión de Microsoft que determine la causa. Si se encuentra código comprometido, corregirlo y reconstruir; si Microsoft confirma un falso positivo, verificar la actualización de firmas y repetir el análisis sobre el artefacto que se entregará. Registrar el hash analizado, la versión del motor y firmas, y el resultado.

Las pruebas funcionales no sustituyen esa verificación. No entregar otra versión renombrada o empaquetada de otra forma como si el problema estuviera resuelto. No pedir que se desactive la protección ni que se permita el archivo señalado.

El código de gestión, las pruebas y las cuatro variantes de producto permanecen en el repositorio. Retirar los ZIP no cambia ni elimina los datos del navegador del usuario. El historial Git conserva los artefactos previos, que no se consideran descargas validadas.
