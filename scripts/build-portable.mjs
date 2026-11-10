import {build} from 'vite';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
await build({configFile:false,root,define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{outDir:'outputs/portable-bundle',emptyOutDir:true,lib:{entry:'portable/main.tsx',name:'FelifrioLocal',formats:['iife'],fileName:()=> 'app.js'},minify:true,sourcemap:false}});
const script=await readFile('outputs/portable-bundle/app.js','utf8');
const font=(await readFile('sitio/assets/Manrope.ttf')).toString('base64');
const appStyles=(await readFile('app/globals.css','utf8')).replace(/^@import[^\n]*\n/gm,'');
const localStyles=await readFile('portable/local.css','utf8');
const readableStyles=await readFile('app/readability.css','utf8');
const styles=`@font-face{font-family:Manrope;src:url(data:font/ttf;base64,${font});font-weight:200 800;font-display:swap}${appStyles}${readableStyles}${localStyles}`;
const html=`<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'"><title>Felifrío · App de prueba local</title><style>${styles}</style></head><body><div id="root"><p style="padding:30px;font:16px Arial">Abriendo Felifrío… Si este mensaje continúa, descargá el archivo y abrilo con Chrome o Edge en tu computadora.</p></div><noscript>Esta app necesita JavaScript. Descargá el archivo y abrilo en Chrome o Edge.</noscript><script>${script.replaceAll('</script','<\\/script')}</script></body></html>`;
// Distribution is suspended pending review of the Defender detection.
// Keep regenerated artifacts outside tracked/public delivery paths.
await mkdir('outputs/portable-review',{recursive:true});
await writeFile('outputs/portable-review/Felifrio_App.html',html);
console.log(`Artefacto sólo para revisión: outputs/portable-review/Felifrio_App.html (${Buffer.byteLength(html)} bytes). Publicación suspendida.`);
