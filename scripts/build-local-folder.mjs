import {build} from 'vite';
import {createHash} from 'node:crypto';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
const out='outputs/felifrio-1.3';
const bundledPackages=new Map();
// Ordinary, readable browser assets. No embedded program, encoded font or
// executable launcher. This does not establish an antivirus verdict.
await build({configFile:false,root,define:{'process.env.NODE_ENV':JSON.stringify('production')},plugins:[{
  name:'record-local-app-dependencies',
  generateBundle(_options,bundle){
    for(const chunk of Object.values(bundle)){
      if(chunk.type!=='chunk')continue;
      for(const id of Object.keys(chunk.modules)){
        const position=id.lastIndexOf('/node_modules/');
        if(position<0)continue;
        const rest=id.slice(position+14).split('/');
        const name=rest[0].startsWith('@')?rest.slice(0,2).join('/'):rest[0];
        bundledPackages.set(name,id.slice(0,position+14)+name+'/package.json');
      }
    }
  },
}],build:{
  outDir:out+'/assets',emptyOutDir:true,minify:false,sourcemap:false,
  lib:{entry:'portable/main.tsx',name:'FelifrioLocal',formats:['iife'],fileName:()=> 'app.js'},
}});
const appStyles=(await readFile('app/globals.css','utf8')).replace(/^@import[^\n]*\n/gm,'');
const readableStyles=await readFile('app/readability.css','utf8');
const localStyles=await readFile('portable/local.css','utf8');
const systemFonts='\nbody,button,input,select,h1,h2,h3,.brand,.stat strong,.stat em,.iceart>span{font-family:"Segoe UI",Arial,sans-serif}\n';
await writeFile(out+'/assets/styles.css',appStyles+readableStyles+localStyles+systemFonts);
await copyFile('public/favicon.svg',out+'/assets/favicon.svg');
await writeFile(out+'/Felifrio_App.html',`<!doctype html>
<html lang="es-AR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' file:; style-src 'self' file:; style-src-attr 'unsafe-inline'; img-src 'self' file:; font-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
  <title>Felifrío 1.3 · Gestión local</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/styles.css">
  <script src="assets/app.js" defer></script>
</head>
<body>
  <div id="root"><p>Abriendo Felifrío… Conservá la carpeta assets junto a este archivo.</p></div>
  <noscript>Felifrío necesita JavaScript habilitado para funcionar.</noscript>
</body>
</html>
`);
await copyFile('portable/LEEME-1.3.txt',out+'/LEEME.txt');
await copyFile('portable/REVISION-1.3.txt',out+'/REVISION.txt');
const notices=[];
for(const name of ['react','react-dom','lucide-react','zod']){
  notices.push(name+'\n\n'+await readFile(`node_modules/${name}/LICENSE`,'utf8'));
}
await writeFile(out+'/Licencias.txt',notices.join('\n\n'));
const dependencies=[];
for(const [name,location] of bundledPackages){
  const info=JSON.parse(await readFile(location,'utf8'));
  dependencies.push({name,version:info.version});
}
if(!dependencies.length)throw Error('No se pudo identificar las dependencias del paquete.');
await writeFile(out+'/DEPENDENCIAS.json',JSON.stringify({version:'1.3',dependencies:dependencies.sort((a,b)=>a.name.localeCompare(b.name)),defenderVerdict:'pending'},null,2)+'\n');
const files=['Felifrio_App.html','assets/app.js','assets/styles.css','assets/favicon.svg','LEEME.txt','REVISION.txt','Licencias.txt','DEPENDENCIAS.json'];
const hashes=[];
for(const file of files)hashes.push(`${createHash('sha256').update(await readFile(out+'/'+file)).digest('hex')}  ${file}`);
await writeFile(out+'/SHA256SUMS.txt',hashes.join('\n')+'\n');
console.log(`Versión 1.3 generada en ${out}. Resultado de Microsoft Defender: pendiente; no se declara libre de detecciones.`);
