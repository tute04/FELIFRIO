# Felifrío · Web promocional

Sitio estático independiente de la aplicación de gestión. Incluye diseño adaptable a celulares, demo interactiva de cuatro pasos, capturas reales con datos ficticios, video promocional de 65 segundos, preguntas frecuentes y opción de compartir el enlace una vez publicado.

## Ver la web

Descomprimir el paquete completo y abrir `index.html` en un navegador. Mantener juntos `index.html`, `styles.css`, `site.js` y la carpeta `assets/`.

Para una vista mediante HTTP, desde la raíz del repositorio:

```sh
python -m http.server 4173 --directory sitio
```

Abrir `http://localhost:4173`. No requiere instalar dependencias ni ejecutar un build. El video y la tipografía están incluidos; no dependen de servicios externos.

## Publicar

Subir **el contenido de `sitio/`** a un alojamiento de archivos estáticos. El archivo de entrada es `index.html`; el directorio de salida es `sitio`; no hay comando de compilación. Se puede desplegar en Cloudflare Pages, Netlify, GitHub Pages u otro hosting estático.

Esta entrega no habilita hosting ni tiene una URL pública propia. El repositorio y el ZIP contienen el sitio listo para subir. Publicar sólo esta carpeta: la aplicación de gestión usa un perímetro privado y no forma parte de esta web.

## Contenido y contacto

- Los números de ejemplo explican un circuito: producir 200 bolsas, cargar 40, entregar 40, contar 15 sin pérdidas, rendir 25 a $1.000 y cobrar $20.000. La deuda final es $5.000.
- La demo no consulta APIs ni guarda operaciones.
- El botón final apunta a la demo. Para incorporar WhatsApp, cambiar el enlace `#contact-cta` por `https://wa.me/NUMERO` y su texto por «Hablemos por WhatsApp». Usar el número autorizado, con código de país y sin espacios ni signos.
- La función de compartir utiliza el mecanismo nativo o copia el enlace. En vistas locales indica que hay que publicar primero.
- No hay formularios que simulen envíos, precios inventados, testimonios ni acceso público a datos de clientes.
- Tipografía Manrope incluida con su licencia OFL en `assets/Manrope-OFL.txt`.

## Verificación

Revisado con Chromium a 1440, 768, 390 y 360 px: sin desplazamiento horizontal, cuatro pasos de la demo, navegación con teclado, reinicio del circuito, preguntas desplegables, apertura/cierre del video y pausa al cerrar. MP4 local H.264/AAC, 1080 × 1920, 65 segundos. Sin errores JavaScript durante el recorrido.
